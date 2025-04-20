# ImgFixer - Backend API

This is the backend API for the ImgFixer application, handling image processing, OCR, and storage.

## Features

- **Image Processing**: Resize and convert images using Sharp
- **OCR Processing**: Extract text from images using Tesseract.js
- **Format Conversion**: Convert to various formats including PDF and DOCX
- **GridFS Storage**: Store images efficiently in MongoDB using GridFS
- **Automatic Cleanup**: TTL index for automatic file deletion

## Tech Stack

- Node.js with Express
- MongoDB with Mongoose
- GridFS for file storage
- Multer for file uploads
- Sharp for image processing
- Tesseract.js for OCR
- PDFKit for PDF generation

## Getting Started

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file with:
   ```
   NODE_ENV=development
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   FRONTEND_URL=http://localhost:3000
   ```

3. Start the development server:
   ```
   npm run dev
   ```

## API Endpoints

- **POST /api/upload**: Upload an image
- **POST /api/ocr**: Perform OCR on an image
- **POST /api/resize**: Resize an image
- **POST /api/convert**: Convert image format
- **GET /api/download/:imageId**: Download processed image

## Deployment

To deploy to Render:

1. Create a web service on Render
2. Connect your GitHub repository
3. Configure the service with:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - Environment variables from your .env file
   
Alternatively, use the `render.yaml` file for Blueprint deployment. 