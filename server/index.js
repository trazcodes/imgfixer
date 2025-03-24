// Load environment variables
const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const sharp = require('sharp');
const PDFDocument = require('pdfkit');
const Jimp = require('jimp');
const { createReport } = require('docx');
const Tesseract = require('tesseract.js');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const { ImageModel, setupTTLIndex } = require('./models/Image');
const { 
  initGridFS, 
  uploadBufferToGridFS, 
  getBufferFromGridFS,
  getFileFromGridFS,
  deleteFileFromGridFS 
} = require('./utils/gridfsStorage');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Set up multer for file uploads
const storage = multer.memoryStorage();

// File filter for images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload an image file.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB size limit
  }
});

// Initialize GridFS after MongoDB connection is established
mongoose.connection.once('open', async () => {
  initGridFS();
  
  // Set up TTL index properly
  await setupTTLIndex();
  
  // Log database information to help locate data
  const dbName = mongoose.connection.db.databaseName;
  console.log(`Connected to MongoDB database: ${dbName}`);
  
  try {
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Available collections:');
    collections.forEach(collection => {
      console.log(` - ${collection.name}`);
    });
    
    // Log count of documents in key collections
    const imagesCount = await ImageModel.countDocuments();
    console.log(`Images collection contains ${imagesCount} documents`);
    
    const filesCount = await mongoose.connection.db.collection('uploads.files').countDocuments();
    console.log(`GridFS uploads.files collection contains ${filesCount} documents`);
  } catch (err) {
    console.error('Error listing collections:', err);
  }
  
  console.log('GridFS initialized after MongoDB connection');
});

// Generate a random session ID
function generateSessionId() {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

// Session management endpoints
app.post('/api/session/create', (req, res) => {
  const sessionId = generateSessionId();
  res.status(200).json({ sessionId });
});

// Ping endpoint to keep session alive (called regularly by frontend)
// Note: This no longer updates the lastActive timestamp since we don't use it for TTL
app.post('/api/session/ping', async (req, res) => {
  const { sessionId } = req.body;
  
  if (!sessionId) {
    return res.status(400).json({ error: 'Session ID is required' });
  }
  
  try {
    // Just return success - we're no longer updating lastActive
    res.status(200).json({ 
      message: 'Session acknowledged',
      note: 'Files will expire based on system load - from 5 minutes (high load) to 6 hours (low load)'
    });
  } catch (error) {
    console.error('Session ping error:', error);
    res.status(500).json({ error: 'Failed to ping session' });
  }
});

// Routes
app.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Get session ID from request (send by frontend)
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    // Process the uploaded image
    // Read the file buffer for metadata to get dimensions
    const metadata = await sharp(req.file.buffer).metadata();
    console.log('Image metadata:', metadata);

    // Store the file in GridFS
    const gridFSFile = await uploadBufferToGridFS(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    // Create a document in the images collection
    const imageDoc = await ImageModel.create({
      filename: gridFSFile.filename,
      originalName: req.file.originalname,
      fileId: gridFSFile.fileId,
      contentType: req.file.mimetype,
      size: req.file.size,
      width: metadata.width,
      height: metadata.height,
      processingType: 'original',
      sessionId,
      lastActive: new Date()
    });

    res.status(200).json({
      message: 'File uploaded successfully',
      imageId: imageDoc._id,
      filename: imageDoc.filename,
      size: req.file.size,
      originalWidth: metadata.width,
      originalHeight: metadata.height
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// OCR endpoint
app.post('/api/ocr', async (req, res) => {
  try {
    const { imageId, sessionId } = req.body;
    
    if (!imageId) {
      return res.status(400).json({ error: 'No image ID provided' });
    }
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }
    
    // Find the image document
    const imageDoc = await ImageModel.findById(imageId);
    if (!imageDoc) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    // Get file buffer from GridFS
    const fileBuffer = await getBufferFromGridFS(imageDoc.fileId);
    
    // Perform OCR
    const { data } = await Tesseract.recognize(
      fileBuffer,
      'eng',
      { logger: m => console.log(m) }
    );
    
    // Update image document with OCR text
    imageDoc.ocrText = data.text;
    imageDoc.processingType = 'ocr';
    imageDoc.sessionId = sessionId;
    imageDoc.lastActive = new Date();
    await imageDoc.save();
    
    res.status(200).json({
      text: data.text,
      confidence: data.confidence
    });
  } catch (error) {
    console.error('OCR Error:', error);
    res.status(500).json({ error: 'Failed to process OCR' });
  }
});

// Resize image endpoint
app.post('/api/resize', async (req, res) => {
  try {
    const { imageId, targetSize, quality, sessionId } = req.body;
    
    if (!imageId) {
      return res.status(400).json({ error: 'No image ID provided' });
    }
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }
    
    // Check which resize mode is being used
    const isQualityMode = quality && !targetSize;
    const isTargetSizeMode = targetSize && !isQualityMode;
    
    if (!isQualityMode && !isTargetSizeMode) {
      return res.status(400).json({ error: 'Either quality or targetSize must be specified' });
    }
    
    // Find the image document
    const imageDoc = await ImageModel.findById(imageId);
    if (!imageDoc) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    // Get file buffer from GridFS
    const fileBuffer = await getBufferFromGridFS(imageDoc.fileId);
    
    // Get the format from the content type
    const format = imageDoc.contentType.split('/')[1];
    
    let processedBuffer;
    let finalQuality = quality ? parseInt(quality) : 80; // Default quality
    let finalWidth = null;
    let finalHeight = null;
    let metadata = await sharp(fileBuffer).metadata();
    
    if (isQualityMode) {
      // Quality-based resize (simple quality adjustment)
      console.log(`Processing with fixed quality: ${finalQuality}%`);
      
      // Create Sharp instance
      const sharpInstance = sharp(fileBuffer);
      
      // Apply quality setting based on format
      if (format === 'jpeg' || format === 'jpg') {
        processedBuffer = await sharpInstance.jpeg({ quality: finalQuality }).toBuffer();
      } else if (format === 'webp') {
        processedBuffer = await sharpInstance.webp({ quality: finalQuality }).toBuffer();
      } else if (format === 'png') {
        // PNG uses compression level (0-9) instead of quality (0-100)
        const compressionLevel = Math.floor((100 - finalQuality) / 11);
        processedBuffer = await sharpInstance.png({ compressionLevel }).toBuffer();
      } else {
        processedBuffer = await sharpInstance.toBuffer();
      }
    } else {
      // Target size-based resize using binary search algorithm
      const targetSizeBytes = parseInt(targetSize) * 1024;
      
      // No range anymore - we'll ensure size is <= target
      console.log(`Target size: ${targetSizeBytes} bytes (${targetSize}KB), ensuring output is <= target`);
      
      // Very aggressive approach for extremely small sizes
      if (targetSizeBytes < 5 * 1024) { // Less than 5KB
        console.log(`Using ultra-aggressive compression for very small target size: ${targetSize}KB`);
        
        // Start with lowest quality possible
        finalQuality = 1;
        
        // Try progressively more aggressive dimension reduction until target size is met
        const scales = [0.8, 0.6, 0.4, 0.2, 0.1, 0.05, 0.025]; // Down to 2.5% of original size
        let currentBuffer = null;
        let bestSize = Infinity;
        let bestBuffer = null;
        
        for (const scale of scales) {
          const newWidth = Math.max(10, Math.round(metadata.width * scale));
          const newHeight = Math.max(10, Math.round(metadata.height * scale));
          
          console.log(`Trying aggressive scaling: ${newWidth}x${newHeight} (${scale * 100}% of original) with quality 1%`);
          
          const sharpInstance = sharp(fileBuffer)
            .resize(newWidth, newHeight);
          
          let testBuffer;
          if (format === 'jpeg' || format === 'jpg') {
            testBuffer = await sharpInstance.jpeg({ quality: 1 }).toBuffer();
          } else if (format === 'webp') {
            testBuffer = await sharpInstance.webp({ quality: 1 }).toBuffer();
          } else if (format === 'png') {
            testBuffer = await sharpInstance.png({ compressionLevel: 9 }).toBuffer();
          } else {
            testBuffer = await sharpInstance.toBuffer();
          }
          
          const testSize = testBuffer.length;
          console.log(`Scale ${scale}: ${newWidth}x${newHeight}, size: ${testSize} bytes`);
          
          // Keep track of the best size under target
          if (testSize <= targetSizeBytes && (bestBuffer === null || testSize > bestSize)) {
            // This is the largest size under the target (the best result)
            bestSize = testSize;
            bestBuffer = testBuffer;
            finalWidth = newWidth;
            finalHeight = newHeight;
            console.log(`New best size: ${testSize} bytes (${Math.round(testSize/1024)}KB), within target`);
          }
          
          currentBuffer = testBuffer;
          
          // If we've found a size below target and this is a really small target,
          // we can stop - we've found a valid result
          if (bestBuffer !== null && targetSizeBytes < 3 * 1024) {
            console.log(`Found acceptable size below very small target, stopping search`);
            break;
          }
        }
        
        // Use the best buffer that's under the target
        if (bestBuffer !== null) {
          processedBuffer = bestBuffer;
          console.log(`Using best size found: ${bestSize} bytes (${Math.round(bestSize/1024)}KB)`);
        } else {
          // If no buffer is under the target, use the smallest we found
          processedBuffer = currentBuffer;
          console.log(`Could not achieve target size. Using smallest possible: ${processedBuffer.length} bytes`);
        }
      } else {
        // Standard approach for normal size targets
        // Use binary search to find the highest quality that's under the target size
        let minQuality = 1;
        let maxQuality = 100;
        let bestQuality = 80; // Default quality
        let bestSize = Infinity;
        let bestBuffer = null;
        let attempts = 0;
        const MAX_ATTEMPTS = 15; 
        
        // For smaller sizes, start with a lower quality estimate
        if (targetSizeBytes < 50 * 1024) { // Less than 50KB
          bestQuality = 30;
        }
        
        console.log(`Processing with target maximum size: ${targetSizeBytes} bytes`);
        
        while (minQuality <= maxQuality && attempts < MAX_ATTEMPTS) {
          attempts++;
          const currentQuality = Math.floor((minQuality + maxQuality) / 2);
          
          try {
            // Create Sharp instance
            const sharpInstance = sharp(fileBuffer);
            
            // Apply quality setting based on format
            let testBuffer;
            if (format === 'jpeg' || format === 'jpg') {
              testBuffer = await sharpInstance.jpeg({ quality: currentQuality }).toBuffer();
            } else if (format === 'webp') {
              testBuffer = await sharpInstance.webp({ quality: currentQuality }).toBuffer();
            } else if (format === 'png') {
              // PNG uses compression level (0-9) instead of quality (0-100)
              const compressionLevel = Math.floor((100 - currentQuality) / 11);
              testBuffer = await sharpInstance.png({ compressionLevel }).toBuffer();
            } else {
              testBuffer = await sharpInstance.toBuffer();
            }
            
            const currentSize = testBuffer.length;
            console.log(`Quality: ${currentQuality}, Size: ${currentSize} bytes, Target max: ${targetSizeBytes} bytes`);
            
            if (currentSize <= targetSizeBytes) {
              // This quality produces a size under the target
              // Check if this is better than our previous best
              if (currentSize > bestSize || bestBuffer === null) {
                bestQuality = currentQuality;
                bestSize = currentSize;
                bestBuffer = testBuffer;
                console.log(`New best quality: ${currentQuality}, size: ${currentSize} bytes (${Math.round(currentSize/1024)}KB)`);
              }
              
              // Try to find a higher quality that's still under the target
              minQuality = currentQuality + 1;
            } else {
              // This quality produces a size over the target
              // Try a lower quality
              maxQuality = currentQuality - 1;
            }
            
            // If we're running out of attempts, make larger quality jumps
            if (attempts > 12 && bestBuffer === null) {
              console.log(`Running out of attempts, making larger quality jumps`);
              maxQuality = Math.max(1, currentQuality - 20);
            }
          } catch (err) {
            console.error('Error processing image at quality', currentQuality, err);
            // If processing fails at this quality, try a lower quality
            maxQuality = currentQuality - 1;
          }
        }
        
        // If we found a quality that produces a size under the target, use it
        if (bestBuffer !== null) {
          processedBuffer = bestBuffer;
          finalQuality = bestQuality;
          console.log(`Final result: Quality ${finalQuality}, Size: ${bestSize} bytes (${Math.round(bestSize/1024)}KB), under target of ${targetSizeBytes} bytes`);
        } else {
          // If we couldn't achieve target size with quality reduction alone,
          // try dimension reduction
          console.log('Quality reduction alone not sufficient, attempting dimension reduction');
          const originalWidth = metadata.width;
          const originalHeight = metadata.height;
          bestSize = Infinity;
          
          // Try with 80%, 60%, 40%, 20%, and 10% of original dimensions
          for (const scale of [0.8, 0.6, 0.4, 0.2, 0.1]) {
            const newWidth = Math.max(10, Math.round(originalWidth * scale));
            const newHeight = Math.max(10, Math.round(originalHeight * scale));
            
            console.log(`Trying scaled dimensions: ${newWidth}x${newHeight}`);
            
            // Try with different quality levels
            for (const quality of [30, 10, 1]) {
              const sharpInstance = sharp(fileBuffer)
                .resize(newWidth, newHeight);
              
              let testBuffer;
              if (format === 'jpeg' || format === 'jpg') {
                testBuffer = await sharpInstance.jpeg({ quality }).toBuffer();
              } else if (format === 'webp') {
                testBuffer = await sharpInstance.webp({ quality }).toBuffer();
              } else if (format === 'png') {
                const compressionLevel = Math.floor((100 - quality) / 11);
                testBuffer = await sharpInstance.png({ compressionLevel }).toBuffer();
              } else {
                testBuffer = await sharpInstance.toBuffer();
              }
              
              const testSize = testBuffer.length;
              console.log(`Scale ${scale} with quality ${quality}: ${newWidth}x${newHeight}, size: ${testSize} bytes`);
              
              // Check if this is under target and better than our previous best
              if (testSize <= targetSizeBytes && (testSize > bestSize || bestBuffer === null)) {
                bestSize = testSize;
                bestBuffer = testBuffer;
                finalWidth = newWidth;
                finalHeight = newHeight;
                finalQuality = quality;
                console.log(`New best size: ${testSize} bytes (${Math.round(testSize/1024)}KB), within target`);
                
                // If we're at quality 30 and under target, we can stop - good quality achieved
                if (quality === 30) {
                  break;
                }
              }
              
              // If we're already under target with the lowest quality, try the next scale
              if (testSize <= targetSizeBytes && quality === 1) {
                break;
              }
            }
            
            // If we found something under the target, stop
            if (bestBuffer !== null) {
              break;
            }
          }
          
          if (bestBuffer !== null) {
            processedBuffer = bestBuffer;
            console.log(`Dimension scaling successful: Quality ${finalQuality}, Size: ${bestSize} bytes (${Math.round(bestSize/1024)}KB), under target`);
          } else {
            // If we still can't get under the target, use the smallest possible
            console.log(`Could not achieve target size. Creating minimal image.`);
            
            // Create a tiny image with minimal quality as a last resort
            const minimumWidth = Math.max(10, Math.round(originalWidth * 0.05));
            const minimumHeight = Math.max(10, Math.round(originalHeight * 0.05));
            
            const sharpInstance = sharp(fileBuffer)
              .resize(minimumWidth, minimumHeight);
            
            if (format === 'jpeg' || format === 'jpg') {
              processedBuffer = await sharpInstance.jpeg({ quality: 1 }).toBuffer();
            } else if (format === 'webp') {
              processedBuffer = await sharpInstance.webp({ quality: 1 }).toBuffer();
            } else if (format === 'png') {
              processedBuffer = await sharpInstance.png({ compressionLevel: 9 }).toBuffer();
            } else {
              processedBuffer = await sharpInstance.toBuffer();
            }
            
            finalWidth = minimumWidth;
            finalHeight = minimumHeight;
            finalQuality = 1;
          }
        }
      }
    }
    
    // Get metadata for the processed image
    metadata = await sharp(processedBuffer).metadata();
    
    // Upload processed image to GridFS
    const processedFileName = `processed-${Date.now()}-${imageDoc.filename}`;
    const gridFSFile = await uploadBufferToGridFS(
      processedBuffer,
      processedFileName,
      imageDoc.contentType
    );
    
    // Create a new document for the processed image
    const processedImageDoc = await ImageModel.create({
      filename: gridFSFile.filename,
      originalName: imageDoc.originalName,
      fileId: gridFSFile.fileId,
      contentType: imageDoc.contentType,
      size: processedBuffer.length,
      width: metadata.width || finalWidth,
      height: metadata.height || finalHeight,
      processingType: 'resize',
      sessionId: sessionId,
      lastActive: new Date()
    });
    
    res.status(200).json({
      message: 'Image processed successfully',
      imageId: processedImageDoc._id,
      filename: processedImageDoc.filename,
      size: processedBuffer.length,
      width: metadata.width || finalWidth,
      height: metadata.height || finalHeight,
      originalWidth: imageDoc.width,
      originalHeight: imageDoc.height,
      quality: finalQuality,
      targetSize: isTargetSizeMode ? parseInt(targetSize) * 1024 : null,
      actualSize: processedBuffer.length,
      actualSizeKB: Math.round(processedBuffer.length / 1024),
      rangeTargeted: isTargetSizeMode ? `${targetSize}KB` : null,
      withinTargetRange: isTargetSizeMode ? 
        (processedBuffer.length <= parseInt(targetSize) * 1024) : null,
      dimensionReduction: finalWidth ? `${Math.round((finalWidth / imageDoc.width) * 100)}%` : null
    });
  } catch (error) {
    console.error('Resize Error:', error);
    res.status(500).json({ error: 'Failed to process image' });
  }
});

// Convert image format endpoint
app.post('/api/convert', async (req, res) => {
  try {
    const { imageId, format, sessionId } = req.body;
    
    if (!imageId || !format) {
      return res.status(400).json({ 
        error: 'Image ID and target format are required' 
      });
    }
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }
    
    const validFormats = ['jpeg', 'png', 'webp', 'pdf', 'docx'];
    if (!validFormats.includes(format.toLowerCase())) {
      return res.status(400).json({ 
        error: 'Invalid format. Supported formats: jpeg, png, webp, pdf, docx' 
      });
    }
    
    // Find the image document
    const imageDoc = await ImageModel.findById(imageId);
    if (!imageDoc) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    // Get file buffer from GridFS
    const fileBuffer = await getBufferFromGridFS(imageDoc.fileId);
    
    // Determine new content type
    let newContentType;
    switch (format.toLowerCase()) {
      case 'jpeg':
        newContentType = 'image/jpeg';
        break;
      case 'png':
        newContentType = 'image/png';
        break;
      case 'webp':
        newContentType = 'image/webp';
        break;
      case 'pdf':
        newContentType = 'application/pdf';
        break;
      case 'docx':
        newContentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        break;
      default:
        newContentType = 'application/octet-stream';
    }
    
    let outputBuffer;
    const outputFileName = `converted-${Date.now()}.${format}`;
    
    if (format.toLowerCase() === 'pdf') {
      // Create PDF
      const pdfDoc = new PDFDocument();
      const chunks = [];
      
      pdfDoc.on('data', chunk => chunks.push(chunk));
      
      // Use Sharp with buffer to get image dimensions
      const metadata = await sharp(fileBuffer).metadata();
      const imgWidth = metadata.width;
      const imgHeight = metadata.height;
      
      // Adjust to fit PDF page
      const pdfWidth = pdfDoc.page.width - 50;
      const pdfHeight = pdfDoc.page.height - 50;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      
      // Generate a JPEG version of the image for PDF compatibility
      const jpegBuffer = await sharp(fileBuffer)
        .jpeg()
        .toBuffer();
      
      // Add the image directly to the PDF using buffer
      pdfDoc.image(jpegBuffer, 25, 25, {
        width: imgWidth * ratio,
        height: imgHeight * ratio
      });
      
      pdfDoc.end();
      
      await new Promise((resolve) => {
        pdfDoc.on('end', resolve);
      });
      
      outputBuffer = Buffer.concat(chunks);
    } 
    else if (format.toLowerCase() === 'docx') {
      // Create a DOCX file containing the image using docx library
      const docx = require('docx');
      const { Document, Packer, Paragraph, TextRun, ImageRun } = docx;
      
      // Generate a JPEG version of the image for DOCX compatibility
      const jpegBuffer = await sharp(fileBuffer)
        .jpeg()
        .toBuffer();
      
      // Create a new document
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: "Converted Image", bold: true, size: 28 }),
              ],
            }),
            new Paragraph({
              children: [
                new ImageRun({
                  data: jpegBuffer,
                  transformation: {
                    width: 500,
                    height: 300,
                  },
                }),
              ],
            }),
          ],
        }],
      });
      
      // Generate the buffer
      outputBuffer = await Packer.toBuffer(doc);
    } 
    else {
      // Use Sharp for image format conversions (jpeg, png, webp)
      outputBuffer = await sharp(fileBuffer)
        .toFormat(format.toLowerCase())
        .toBuffer();
    }
    
    // Upload converted file to GridFS
    const gridFSFile = await uploadBufferToGridFS(
      outputBuffer,
      outputFileName,
      newContentType
    );
    
    // Ensure size is always defined
    const fileSize = gridFSFile.size || outputBuffer.length;
    
    // Create a new document for the converted image
    const convertedImageDoc = await ImageModel.create({
      filename: gridFSFile.filename,
      originalName: `${path.parse(imageDoc.originalName).name}.${format}`,
      fileId: gridFSFile.fileId,
      contentType: newContentType,
      size: fileSize,
      processingType: 'convert',
      sessionId: sessionId,
      lastActive: new Date()
    });
    
    res.status(200).json({
      message: `Image converted to ${format} successfully`,
      imageId: convertedImageDoc._id,
      filename: convertedImageDoc.filename
    });
  } catch (error) {
    console.error('Conversion Error:', error);
    res.status(500).json({ error: 'Failed to convert image' });
  }
});

// Download file endpoint
app.get('/api/download/:imageId', async (req, res) => {
  try {
    const imageId = req.params.imageId;
    
    // Find the image document
    const imageDoc = await ImageModel.findById(imageId);
    if (!imageDoc) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    // Set appropriate content type
    res.set('Content-Type', imageDoc.contentType);
    
    // Set filename for download
    const safeFilename = encodeURIComponent(imageDoc.originalName);
    res.set('Content-Disposition', `attachment; filename="${safeFilename}"`);
    
    // Stream the file from GridFS to the response
    const downloadStream = getFileFromGridFS(imageDoc.fileId);
    downloadStream.pipe(res);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

// Get file information endpoint
app.get('/api/file-info/:imageId', async (req, res) => {
  try {
    const imageId = req.params.imageId;
    
    if (!imageId) {
      return res.status(400).json({ error: 'Image ID is required' });
    }
    
    // Find the image document
    const imageDoc = await ImageModel.findById(imageId);
    if (!imageDoc) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    // Get file info from GridFS
    const file = await gfs.files.findOne({ _id: imageDoc.fileId });
    
    if (!file) {
      return res.status(404).json({ error: 'File not found in GridFS' });
    }
    
    // Return file info
    res.status(200).json({
      filename: file.filename,
      contentType: file.contentType,
      size: file.size,
      uploadDate: file.uploadDate
    });
  } catch (error) {
    console.error('File info error:', error);
    res.status(500).json({ error: 'Failed to get file information' });
  }
});

// Admin route to clean up expired files
app.post('/api/admin/cleanup', async (req, res) => {
  try {
    // Get all images that were created more than 72 hours ago
    const cutoffDate = new Date(Date.now() - (3600 * 72 * 1000));
    const oldImages = await ImageModel.find({ createdAt: { $lt: cutoffDate } });
    
    let deletedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    let errors = [];
    
    // Delete each image and its GridFS file
    for (const image of oldImages) {
      try {
        // Delete the GridFS file with improved error handling
        const deleteResult = await deleteFileFromGridFS(image.fileId);
        
        // Delete the image document regardless of file deletion result
        await ImageModel.findByIdAndDelete(image._id);
        
        if (deleteResult.success) {
          if (deleteResult.fileFound) {
            deletedCount++;
          } else {
            skippedCount++;
          }
        } else {
          errorCount++;
          const errMsg = deleteResult.error || 'Unknown error';
          console.error(`Error deleting file ${image.fileId}: ${errMsg}`);
          errors.push({ imageId: image._id, error: errMsg });
        }
      } catch (error) {
        errorCount++;
        console.error(`Error deleting image ${image._id}:`, error);
        errors.push({ imageId: image._id, error: error.message });
        
        // Try to delete just the document if the overall process failed
        try {
          await ImageModel.findByIdAndDelete(image._id);
        } catch (docError) {
          console.error(`Failed to delete document ${image._id}:`, docError);
        }
      }
    }
    
    res.status(200).json({ 
      message: 'Cleanup completed', 
      deletedCount,
      skippedCount,
      errorCount,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({ error: 'Failed to clean up expired files' });
  }
});

// Database status endpoint for debugging
app.get('/api/admin/db-status', async (req, res) => {
  try {
    // Get database name
    const dbName = mongoose.connection.db.databaseName;
    
    // Get collection names
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    // Count documents in key collections
    const imagesCount = await ImageModel.countDocuments();
    const filesCount = await mongoose.connection.db.collection('uploads.files').countDocuments();
    const chunksCount = await mongoose.connection.db.collection('uploads.chunks').countDocuments();
    
    // Get most recent images (limited to 10)
    const recentImages = await ImageModel.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('_id filename originalName fileId contentType size width height createdAt processingType');
    
    res.status(200).json({
      database: {
        name: dbName,
        collections: collectionNames,
        status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
      },
      counts: {
        images: imagesCount,
        'uploads.files': filesCount,
        'uploads.chunks': chunksCount
      },
      recentImages
    });
  } catch (error) {
    console.error('Database status error:', error);
    res.status(500).json({ error: 'Failed to get database status' });
  }
});

// Size estimation endpoint
app.post('/api/estimate-size', async (req, res) => {
  try {
    const { imageId, width, height, quality, format } = req.body;
    
    if (!imageId) {
      return res.status(400).json({ error: 'No image ID provided' });
    }
    
    // Find the image document
    const imageDoc = await ImageModel.findById(imageId);
    if (!imageDoc) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    // Get file buffer from GridFS
    const fileBuffer = await getBufferFromGridFS(imageDoc.fileId);
    
    // Determine format to use
    const sourceFormat = imageDoc.contentType.split('/')[1];
    const targetFormat = format || sourceFormat;
    
    // Create resizing options
    const resizeOptions = {
      width: parseInt(width) || null,
      height: parseInt(height) || null,
      fit: 'contain'
    };
    
    // Create Sharp instance with resize
    const sharpInstance = sharp(fileBuffer).resize(resizeOptions);
    
    // Apply format and quality
    if (['jpeg', 'jpg', 'webp', 'png'].includes(targetFormat.toLowerCase())) {
      if (targetFormat === 'jpeg' || targetFormat === 'jpg') {
        sharpInstance.jpeg({ quality: parseInt(quality) || 80 });
      } else if (targetFormat === 'webp') {
        sharpInstance.webp({ quality: parseInt(quality) || 80 });
      } else if (targetFormat === 'png') {
        // PNG uses compression level (0-9) instead of quality (0-100)
        const compressionLevel = Math.floor((100 - (parseInt(quality) || 80)) / 11);
        sharpInstance.png({ compressionLevel });
      }
    }
    
    // Generate a small sample to estimate size
    // Using metadata to get the correct dimensions
    const metadata = await sharp(fileBuffer).metadata();
    
    // Generate processed buffer
    const processedBuffer = await sharpInstance.toBuffer();
    
    // Get metadata for the processed image
    const processedMetadata = await sharp(processedBuffer).metadata();
    
    // Return the estimated file size
    res.status(200).json({
      originalSize: fileBuffer.length,
      estimatedSize: processedBuffer.length,
      originalDimensions: {
        width: metadata.width,
        height: metadata.height
      },
      processedDimensions: {
        width: processedMetadata.width,
        height: processedMetadata.height
      }
    });
  } catch (error) {
    console.error('Size estimation error:', error);
    res.status(500).json({ error: 'Failed to estimate file size' });
  }
});

// Manual file cleanup endpoint - force removal of old files
app.post('/api/admin/cleanup-all', async (req, res) => {
  try {
    console.log('Starting manual cleanup of all files...');
    
    // 1. First clean up orphaned GridFS files
    await cleanupOrphanedFiles();
    
    // 2. Get stats before cleanup
    const beforeImageCount = await ImageModel.countDocuments();
    const beforeFilesCount = await mongoose.connection.db.collection('uploads.files').countDocuments();
    
    // 3. Find images without valid GridFS files (where files were deleted but image docs remain)
    const images = await ImageModel.find({});
    const orphanedImageDocs = [];
    
    for (const image of images) {
      try {
        // Check if file exists in GridFS
        const fileExists = await mongoose.connection.db.collection('uploads.files')
          .findOne({ _id: image.fileId });
          
        if (!fileExists) {
          orphanedImageDocs.push(image);
        }
      } catch (error) {
        console.error(`Error checking file existence for image ${image._id}:`, error);
      }
    }
    
    console.log(`Found ${orphanedImageDocs.length} image documents with missing GridFS files`);
    
    // 4. Delete orphaned image documents
    for (const image of orphanedImageDocs) {
      await ImageModel.findByIdAndDelete(image._id);
    }
    
    // 5. Force a final orphaned file cleanup
    await cleanupOrphanedFiles();
    
    // 6. Get stats after cleanup
    const afterImageCount = await ImageModel.countDocuments();
    const afterFilesCount = await mongoose.connection.db.collection('uploads.files').countDocuments();
    
    res.status(200).json({
      success: true,
      message: 'Manual cleanup completed',
      stats: {
        imagesDeleted: beforeImageCount - afterImageCount,
        filesDeleted: beforeFilesCount - afterFilesCount,
        beforeCounts: {
          images: beforeImageCount,
          files: beforeFilesCount
        },
        afterCounts: {
          images: afterImageCount,
          files: afterFilesCount
        }
      }
    });
  } catch (error) {
    console.error('Manual cleanup error:', error);
    res.status(500).json({ error: 'Failed to perform manual cleanup' });
  }
});

// Add a direct delete endpoint to manually clean up images
app.delete('/api/images/:id', async (req, res) => {
  try {
    const imageId = req.params.id;
    
    // Find the image document
    const imageDoc = await ImageModel.findById(imageId);
    if (!imageDoc) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    console.log(`Manual deletion request for image ${imageId}`);
    
    // Delete the file from GridFS
    let mainFileDeleted = false;
    let processedFileDeleted = false;
    
    if (imageDoc.fileId) {
      const deleteResult = await deleteFileFromGridFS(imageDoc.fileId);
      mainFileDeleted = deleteResult.success;
      console.log(`Deleted original file for image ${imageId}: ${deleteResult.success}`);
    }
    
    if (imageDoc.processedFileId) {
      const deleteResult = await deleteFileFromGridFS(imageDoc.processedFileId);
      processedFileDeleted = deleteResult.success;
      console.log(`Deleted processed file for image ${imageId}: ${deleteResult.success}`);
    }
    
    // Delete the image document
    await ImageModel.findByIdAndDelete(imageId);
    
    // Return success
    res.status(200).json({
      success: true,
      message: 'Image deleted successfully',
      mainFileDeleted,
      processedFileDeleted
    });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

// Add a force expiration endpoint to clean up all images
app.post('/api/force-expire-all', async (req, res) => {
  try {
    console.log('Force expiring all images...');
    
    // Find all images
    const images = await ImageModel.find({});
    console.log(`Found ${images.length} images to expire`);
    
    // Delete each image and its files
    let deletedCount = 0;
    let errorCount = 0;
    
    for (const image of images) {
      try {
        console.log(`Deleting image ${image._id}`);
        
        // Delete the files
        if (image.fileId) {
          await deleteFileFromGridFS(image.fileId);
        }
        
        if (image.processedFileId) {
          await deleteFileFromGridFS(image.processedFileId);
        }
        
        // Delete the document
        await ImageModel.findByIdAndDelete(image._id);
        deletedCount++;
      } catch (error) {
        errorCount++;
        console.error(`Error deleting image ${image._id}:`, error);
      }
    }
    
    // Return success
    res.status(200).json({
      success: true,
      message: `Expired ${deletedCount} images with ${errorCount} errors`
    });
  } catch (error) {
    console.error('Error in force expiration:', error);
    res.status(500).json({ error: 'Failed to force expire images' });
  }
});

// Add a utility endpoint to force-delete a specific GridFS file by ID
app.delete('/api/admin/gridfs/:fileId', async (req, res) => {
  try {
    const fileId = req.params.fileId;
    console.log(`Manual request to delete GridFS file: ${fileId}`);
    
    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      return res.status(400).json({ 
        error: 'Invalid file ID format',
        message: 'The provided fileId is not a valid MongoDB ObjectId'
      });
    }
    
    // Convert string ID to MongoDB ObjectId
    const objectId = new mongoose.Types.ObjectId(fileId);
    
    // Check if file exists
    const fileExists = await mongoose.connection.db.collection('uploads.files')
      .findOne({ _id: objectId });
      
    if (!fileExists) {
      return res.status(404).json({ 
        error: 'File not found',
        message: `No file with ID ${fileId} found in GridFS`
      });
    }
    
    // Delete chunks first
    const chunksResult = await mongoose.connection.db.collection('uploads.chunks')
      .deleteMany({ files_id: objectId });
    
    console.log(`Deleted ${chunksResult.deletedCount} chunks for file ${fileId}`);
    
    // Then delete the file entry
    const fileResult = await mongoose.connection.db.collection('uploads.files')
      .deleteOne({ _id: objectId });
    
    if (fileResult.deletedCount === 0) {
      return res.status(500).json({
        error: 'Failed to delete file',
        message: `Failed to delete file entry ${fileId} from GridFS`
      });
    }
    
    // Also clean up any image documents referencing this file
    const relatedImages = await ImageModel.find({ 
      $or: [
        { fileId: objectId },
        { processedFileId: objectId }
      ]
    });
    
    let relatedImagesDeleted = 0;
    for (const image of relatedImages) {
      console.log(`Deleting related image document: ${image._id}`);
      await ImageModel.findByIdAndDelete(image._id);
      relatedImagesDeleted++;
    }
    
    res.status(200).json({
      success: true,
      message: `Successfully deleted file ${fileId} from GridFS`,
      details: {
        chunksDeleted: chunksResult.deletedCount,
        fileEntryDeleted: fileResult.deletedCount > 0,
        relatedImagesDeleted
      }
    });
  } catch (error) {
    console.error(`Error in manual file deletion for ${req.params.fileId}:`, error);
    res.status(500).json({ 
      error: 'Failed to delete file',
      message: error.message
    });
  }
});

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}

// Helper function to find and clean up orphaned GridFS files
const cleanupOrphanedFiles = async () => {
  try {
    // Skip cleanup if previous run is still in progress (use a global flag)
    if (global.isCleanupRunning) {
      console.log('Skipping cleanup as previous run is still in progress');
      return;
    }
    
    global.isCleanupRunning = true;
    console.log('Starting orphaned file cleanup...');
    
    // Only scan GridFS if there are images or enough time has passed since last full scan
    let gridfsFiles = [];
    const now = Date.now();
    
    // Dynamic cleanup strategy - only do full scans when needed
    if (!global.lastFullScan || (now - global.lastFullScan) > 6 * 60 * 60 * 1000) { // Every 6 hours
      console.log('Performing full GridFS scan');
      // Get all fileIds from the Image collection
      const images = await ImageModel.find({}, 'fileId processedFileId').lean();
      
      // Create a set of all valid fileIds, including both original and processed files
      const validFileIds = new Set();
      
      images.forEach(img => {
        if (img.fileId) {
          validFileIds.add(img.fileId.toString());
        }
        if (img.processedFileId) {
          validFileIds.add(img.processedFileId.toString());
        }
      });
      
      console.log(`Found ${validFileIds.size} valid file IDs in Image collection`);
      
      // Find all files in GridFS
      gridfsFiles = await mongoose.connection.db.collection('uploads.files').find({}).toArray();
      console.log(`Found ${gridfsFiles.length} total files in GridFS`);
      
      // Find orphaned files (files in GridFS but not in Image collection)
      const orphanedFiles = gridfsFiles.filter(file => !validFileIds.has(file._id.toString()));
      console.log(`Found ${orphanedFiles.length} orphaned files to clean up`);
      
      global.lastFullScan = now;
      
      // Store orphaned files for next runs
      global.orphanedFiles = orphanedFiles;
    } else {
      console.log('Using cached orphaned files list from previous scan');
      // Use the list of orphaned files from previous run
      gridfsFiles = await mongoose.connection.db.collection('uploads.files').find({}).toArray();
    }
    
    // Calculate file age threshold based on number of files
    let fileAgeThresholdMs = 6 * 60 * 60 * 1000; // Default 6 hours for few files
    
    // Adjust threshold based on file count - MORE files = FASTER deletion
    if (gridfsFiles.length > 1000) {
      fileAgeThresholdMs = 5 * 60 * 1000; // Just 5 minutes for 1000+ files
    } else if (gridfsFiles.length > 500) {
      fileAgeThresholdMs = 15 * 60 * 1000; // 15 minutes for 500+ files
    } else if (gridfsFiles.length > 100) {
      fileAgeThresholdMs = 30 * 60 * 1000; // 30 minutes for 100+ files
    } else if (gridfsFiles.length > 50) {
      fileAgeThresholdMs = 60 * 60 * 1000; // 1 hour for 50+ files
    } // else default 6 hours for < 50 files
    
    const fileAgeThreshold = new Date(now - fileAgeThresholdMs);
    console.log(`Using file age threshold of ${fileAgeThresholdMs / (60 * 60 * 1000)} hours`);
    
    // Get old files (created more than threshold time ago)
    const oldFiles = gridfsFiles.filter(file => 
      new Date(file.uploadDate) < fileAgeThreshold
    );
    
    console.log(`Found ${oldFiles.length} files older than ${fileAgeThresholdMs / (60 * 60 * 1000)} hours`);
    
    // List files for debugging only if there are a reasonable number
    if (gridfsFiles.length > 0 && gridfsFiles.length < 10) {
      console.log('File ages (hours):');
      gridfsFiles.forEach(file => {
        const ageHours = (now - new Date(file.uploadDate).getTime()) / (60 * 60 * 1000);
        console.log(`- ${file._id}: ${ageHours.toFixed(2)} hours old`);
      });
    }
    
    // Combine orphaned files and old files for deletion
    const filesToDelete = global.orphanedFiles ? 
      [...new Set([...global.orphanedFiles, ...oldFiles])] : 
      [...new Set([...oldFiles])];
    
    console.log(`Deleting a total of ${filesToDelete.length} files`);
    
    if (filesToDelete.length === 0) {
      global.isCleanupRunning = false;
      return;
    }
    
    // Delete in batches of 10 files to reduce load
    const BATCH_SIZE = 10;
    let deletedCount = 0;
    let errorCount = 0;
    
    // Process in batches
    for (let i = 0; i < filesToDelete.length; i += BATCH_SIZE) {
      const batch = filesToDelete.slice(i, i + BATCH_SIZE);
      
      // Process batch in parallel with Promise.all for efficiency
      const deletePromises = batch.map(async (file) => {
        try {
          const fileId = file._id;
          console.log(`Deleting file: ${fileId}`);
          
          // Delete chunks first
          const chunksResult = await mongoose.connection.db.collection('uploads.chunks')
            .deleteMany({ files_id: fileId });
          
          console.log(`Directly deleted ${chunksResult.deletedCount} chunks for file ${fileId}`);
          
          // Then delete the file entry
          const fileResult = await mongoose.connection.db.collection('uploads.files')
            .deleteOne({ _id: fileId });
          
          if (fileResult.deletedCount > 0) {
            console.log(`Directly deleted file entry ${fileId} from GridFS`);
            
            // Also delete any Image document referencing this file
            const relatedImages = await ImageModel.find({ 
              $or: [
                { fileId: fileId },
                { processedFileId: fileId }
              ]
            }).lean();
            
            for (const image of relatedImages) {
              console.log(`Deleting related image document: ${image._id}`);
              await ImageModel.findByIdAndDelete(image._id);
            }
            
            return { success: true };
          } else {
            console.error(`Failed to delete file entry ${fileId} from GridFS`);
            return { success: false, error: 'Failed to delete file entry' };
          }
        } catch (error) {
          console.error(`Error deleting file ${file._id}:`, error);
          return { success: false, error: error.message };
        }
      });
      
      const results = await Promise.all(deletePromises);
      
      deletedCount += results.filter(r => r.success).length;
      errorCount += results.filter(r => !r.success).length;
      
      // Update the cached orphaned files list by removing deleted files
      if (global.orphanedFiles) {
        const batchIds = new Set(batch.map(f => f._id.toString()));
        global.orphanedFiles = global.orphanedFiles.filter(f => !batchIds.has(f._id.toString()));
      }
    }
    
    console.log(`File cleanup complete: ${deletedCount} files deleted, ${errorCount} errors`);
    
    // If we had many successful deletions, force a full scan next time
    if (deletedCount > 20) {
      global.lastFullScan = null;
    }
    
    global.isCleanupRunning = false;
  } catch (error) {
    console.error('Error in file cleanup:', error);
    global.isCleanupRunning = false;
  }
};

// Clean up GridFS files when MongoDB TTL index removes Image documents
// Use a dynamic interval based on system load
// Initialize global variables
global.isCleanupRunning = false;
global.lastFullScan = null;
global.orphanedFiles = [];
global.cleanupInterval = 20 * 60 * 1000; // Start with 20 minutes

// Set up an adaptive cleanup interval
const setupCleanupInterval = () => {
  console.log(`Setting up file cleanup to run every ${global.cleanupInterval/60000} minutes`);
  
  const intervalId = setInterval(async () => {
    try {
      // Get current time
      const startTime = Date.now();
      
      // Count files in GridFS to determine if cleanup is needed
      const filesCount = await mongoose.connection.db.collection('uploads.files').countDocuments();
      
      if (filesCount === 0) {
        console.log('No files in GridFS, skipping cleanup');
        
        // If no files, we can increase the interval to reduce load
        if (global.cleanupInterval < 6 * 60 * 60 * 1000) { // Max 6 hours
          global.cleanupInterval = Math.min(global.cleanupInterval * 1.5, 6 * 60 * 60 * 1000);
          console.log(`Increased cleanup interval to ${global.cleanupInterval/60000} minutes`);
          
          // Reset the interval
          clearInterval(intervalId);
          setupCleanupInterval();
        }
        return;
      }
      
      // Adjust the cleanup interval based on file count - BEFORE running cleanup
      let newInterval = global.cleanupInterval;
      let needReset = false;
      
      // More files = more frequent checks
      if (filesCount > 1000) {
        newInterval = 3 * 60 * 1000; // Every 3 minutes for 1000+ files
      } else if (filesCount > 500) {
        newInterval = 5 * 60 * 1000; // Every 5 minutes for 500+ files
      } else if (filesCount > 100) {
        newInterval = 10 * 60 * 1000; // Every 10 minutes for 100+ files
      } else if (filesCount > 50) {
        newInterval = 20 * 60 * 1000; // Every 20 minutes for 50+ files
      } else {
        newInterval = 30 * 60 * 1000; // Every 30 minutes for < 50 files
      }
      
      // If interval needs to change
      if (newInterval !== global.cleanupInterval) {
        global.cleanupInterval = newInterval;
        console.log(`Adjusted cleanup interval to ${global.cleanupInterval/60000} minutes based on ${filesCount} files`);
        
        // Flag that we need to reset the interval after cleanup
        needReset = true;
      }
      
      // Run the cleanup
      await cleanupOrphanedFiles();
      
      // Measure how long it took
      const duration = Date.now() - startTime;
      
      // If cleanup took too long or interval was adjusted, reset the interval
      if (duration > 5000 || needReset) {
        clearInterval(intervalId);
        setupCleanupInterval();
      }
    } catch (error) {
      console.error('Error in cleanup interval:', error);
    }
  }, global.cleanupInterval);
};

// Initialize the cleanup interval on server start
// Force immediate cleanup on server startup
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  console.log('File expiration: Files will be automatically deleted based on storage load');
  console.log('- With few files (<50): Files kept for up to 6 hours');
  console.log('- With many files (>1000): Files deleted after just 5 minutes');
  console.log('This dynamic approach prevents database overload during high usage');
  
  // Run initial cleanup
  try {
    console.log('Performing initial cleanup on server startup...');
    await cleanupOrphanedFiles();
    
    // Start the adaptive cleanup interval
    setupCleanupInterval();
  } catch (error) {
    console.error('Error during initial cleanup:', error);
  }
}); 