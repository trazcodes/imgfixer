const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Get MongoDB URI from environment or use default
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/imgfixer';
    
    // Log the connection URI (masking password for security)
    const maskedURI = mongoURI.replace(/mongodb:\/\/([^:]+):([^@]+)@/, 'mongodb://$1:****@');
    console.log(`Connecting to MongoDB: ${maskedURI}`);
    
    const conn = await mongoose.connect(mongoURI, {});
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database Name: ${conn.connection.name}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB; 