const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');
const stream = require('stream');

// Setup GridFS - USING GLOBAL VARIABLES FOR BOTH
let gfs;
let bucket;

// Improved initialization that ensures bucket is created properly
const initGridFS = () => {
  // Initialize GridFS bucket if not already done
  if ((!gfs || !bucket) && mongoose.connection.readyState === 1) {
    try {
      gfs = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
        bucketName: 'uploads'
      });
      
      bucket = new GridFSBucket(mongoose.connection.db, {
        bucketName: 'uploads'
      });
      
      console.log('GridFS initialized with bucketName: uploads');
      
      // Verify the bucket is working by checking if the collection exists
      mongoose.connection.db.listCollections({ name: 'uploads.files' })
        .toArray()
        .then(collections => {
          if (collections.length > 0) {
            console.log('Confirmed uploads.files collection exists');
          } else {
            console.log('Warning: uploads.files collection not found, will be created on first use');
          }
        })
        .catch(err => console.error('Error checking uploads collection:', err));
      
    } catch (error) {
      console.error('Failed to initialize GridFS:', error);
      throw error; // Rethrow to ensure we don't continue with invalid state
    }
  }
  
  // Ensure we actually have valid bucket instances
  if (!bucket || !gfs) {
    console.error('GridFS bucket not properly initialized');
    throw new Error('GridFS bucket not initialized');
  }
  
  return { gfs, bucket };
};

// Function to get a file as a buffer from GridFS by ID
const getBufferFromGridFS = (fileId) => {
  return new Promise((resolve, reject) => {
    initGridFS();
    
    const chunks = [];
    const downloadStream = bucket.openDownloadStream(new mongoose.Types.ObjectId(fileId));
    
    downloadStream.on('data', (chunk) => {
      chunks.push(chunk);
    });
    
    downloadStream.on('error', (error) => {
      reject(error);
    });
    
    downloadStream.on('end', () => {
      const buffer = Buffer.concat(chunks);
      resolve(buffer);
    });
  });
};

// Function to upload a file to GridFS from a buffer
const uploadBufferToGridFS = (buffer, originalFilename, contentType) => {
  return new Promise((resolve, reject) => {
    initGridFS();
    
    const filename = `${Date.now()}-${originalFilename}`;
    const uploadStream = bucket.openUploadStream(filename, {
      contentType: contentType
    });
    
    const fileId = uploadStream.id; // Capture the ID before piping
    
    const bufferStream = new stream.PassThrough();
    bufferStream.end(buffer);
    
    bufferStream
      .pipe(uploadStream)
      .on('error', (error) => {
        reject(error);
      })
      .on('finish', () => {
        resolve({
          fileId: fileId, // Use the ID captured earlier
          filename: filename,
          contentType: contentType,
          size: uploadStream.bytesWritten // Use bytes written for size
        });
      });
  });
};

// Function to retrieve a file from GridFS by ID
const getFileFromGridFS = (fileId) => {
  initGridFS();
  
  return bucket.openDownloadStream(new mongoose.Types.ObjectId(fileId));
};

// Function to delete a file from GridFS by ID
const deleteFileFromGridFS = async (fileId) => {
  return new Promise((resolve) => {
    try {
      // Make sure we have a valid MongoDB ObjectId
      if (!fileId || !mongoose.Types.ObjectId.isValid(fileId)) {
        console.error(`Invalid fileId: ${fileId}`);
        resolve({ success: false, error: 'Invalid file ID', fileFound: false });
        return;
      }
      
      // Initialize GridFS if needed
      try {
        initGridFS();
      } catch (initErr) {
        console.error('Failed to initialize GridFS during deletion:', initErr);
        resolve({ success: false, error: `GridFS initialization failed: ${initErr.message}`, fileFound: false });
        return;
      }
      
      // Convert string ID to ObjectId
      const objectId = new mongoose.Types.ObjectId(fileId);
      
      // First check if the file exists in uploads.files collection directly
      mongoose.connection.db.collection('uploads.files').findOne({ _id: objectId }, (err, file) => {
        if (err) {
          console.error(`Error checking file existence ${fileId}:`, err);
          resolve({ success: false, error: err.message, fileFound: false });
          return;
        }
        
        if (!file) {
          console.log(`File ${fileId} not found in uploads.files, skipping deletion`);
          resolve({ success: true, fileFound: false });
          return;
        }
        
        console.log(`File found in uploads.files: ${fileId}, proceeding with deletion`);
        
        // Delete the file using the bucket API
        bucket.delete(objectId, (deleteErr) => {
          if (deleteErr) {
            console.error(`Error in bucket.delete for ${fileId}:`, deleteErr);
            resolve({ success: false, error: deleteErr.message, fileFound: true });
          } else {
            console.log(`Successfully deleted file ${fileId} from GridFS`);
            resolve({ success: true, fileFound: true });
          }
        });
      });
    } catch (err) {
      console.error(`Exception in deleteFileFromGridFS for ${fileId}:`, err);
      resolve({ success: false, error: err.message, fileFound: false });
    }
  });
};

module.exports = {
  initGridFS,
  uploadBufferToGridFS,
  getBufferFromGridFS,
  getFileFromGridFS,
  deleteFileFromGridFS
}; 