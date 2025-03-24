const mongoose = require('mongoose');

// Schema for image metadata
const ImageSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  fileId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  contentType: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  width: {
    type: Number
  },
  height: {
    type: Number
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  // Session ID to track which browser session this image belongs to
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  // Last time this session was active (updated by ping) - no longer used for TTL
  lastActive: {
    type: Date,
    default: Date.now,
    index: true
  },
  // GridFS chunk ID for the processed version of the image (if applicable)
  processedFileId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  // Type of processing performed (resize, convert, ocr)
  processingType: {
    type: String,
    enum: ['original', 'resize', 'convert', 'ocr'],
    default: 'original'
  },
  // OCR text extracted from the image (if OCR was performed)
  ocrText: {
    type: String,
    default: null
  },
  // TTL field - deletes documents after 1 minute
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// IMPORTANT: We need to remove any existing index
const ImageModel = mongoose.model('Image', ImageSchema);

// This function will be called after MongoDB connection is established
// to ensure the TTL index is properly set up
const setupTTLIndex = async () => {
  try {
    // First, try to drop any existing TTL index on createdAt
    const collection = ImageModel.collection;
    const indexes = await collection.indexes();
    
    for (const index of indexes) {
      if (index.key && index.key.createdAt) {
        console.log('Dropping existing createdAt index:', index.name);
        await collection.dropIndex(index.name);
      }
    }
    
    // Create a new TTL index
    await collection.createIndex(
      { createdAt: 1 },
      { 
        expireAfterSeconds: 3600, // 1 hour expiration (3600 seconds)
        background: true,
        name: 'createdAt_ttl_1hour'
      }
    );
    
    console.log('Successfully created TTL index with 1-hour expiration');
  } catch (error) {
    console.error('Error setting up TTL index:', error);
  }
};

// This middleware will run before each findOneAndDelete operation
ImageSchema.pre('findOneAndDelete', async function(next) {
  try {
    // Get the document that's about to be deleted
    const doc = await this.model.findOne(this.getFilter());
    if (!doc) return next();
    
    console.log(`Pre-delete hook: deleting files for image ${doc._id}`);
    
    // Import the GridFS deletion function - we must use require directly here 
    // since we're in a model file and can't easily pass the function
    const { deleteFileFromGridFS } = require('../utils/gridfsStorage');
    
    // Delete the main file
    if (doc.fileId) {
      try {
        const result = await deleteFileFromGridFS(doc.fileId);
        console.log(`Pre-delete hook: deleted original file ${doc.fileId}, success: ${result.success}`);
      } catch (error) {
        console.error(`Pre-delete hook: failed to delete original file ${doc.fileId}:`, error);
      }
    }
    
    // Delete the processed file if it exists
    if (doc.processedFileId) {
      try {
        const result = await deleteFileFromGridFS(doc.processedFileId);
        console.log(`Pre-delete hook: deleted processed file ${doc.processedFileId}, success: ${result.success}`);
      } catch (error) {
        console.error(`Pre-delete hook: failed to delete processed file ${doc.processedFileId}:`, error);
      }
    }
    
    next();
  } catch (error) {
    console.error('Error in pre-delete hook for Image model:', error);
    next(); // Continue with deletion even if file deletion fails
  }
});

module.exports = {
  ImageModel,
  setupTTLIndex
}; 