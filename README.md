# ImgFixer - Image Processing Application

A MERN stack application for image processing with OCR capabilities, resizing, and format conversion.

## Features

- **Drag and Drop Image Upload**: Easily upload images via drag and drop or file browser
- **OCR (Optical Character Recognition)**: Extract text from images using Tesseract.js
- **Image Resizing**: Resize images while maintaining aspect ratio
- **Format Conversion**: Convert images to various formats (JPEG, PNG, WebP, PDF, DOCX)
- **MongoDB Storage**: Images are stored in MongoDB using GridFS for efficient storage
- **Automatic Cleanup**: Files are only kept for 1 hour with MongoDB's TTL index
- **Modern UI/UX**: Beautiful and responsive user interface

## Tech Stack

### Frontend
- React with Vite
- Styled-components for styling
- React-dropzone for drag and drop functionality
- Axios for API requests
- React-toastify for notifications
- React-icons for icons

### Backend
- Node.js with Express
- MongoDB with Mongoose for the database
- GridFS for storing large image files
- Multer for handling file uploads
- Sharp for image resizing and format conversion
- PDFKit for creating PDFs
- Jimp for image processing
- Tesseract.js for OCR functionality

## Setup and Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- MongoDB (running locally or remote connection)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/imgfixer.git
   cd imgfixer
   ```

2. Set up environment variables:
   - Create separate environment files for client and server:
   
   For server (`server/.env`):
   ```
   NODE_ENV=development
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/imgfixer
   ```
   
   For client (`client/.env`):
   ```
   VITE_API_BASE_URL=http://localhost:5000/api
   ```
   
   - See `ENV_SETUP.md` for more details about environment configuration
   - Modify the MONGO_URI if you're using a remote MongoDB instance

3. Install dependencies:
   ```
   # Install server dependencies
   npm install
   
   # Install client dependencies
   npm run install-client
   ```

4. Start the development server:
   ```
   # Run both frontend and backend
   npm run dev
   
   # Or run them separately
   npm run server
   npm run client
   ```

5. Open your browser and navigate to http://localhost:3000

## Usage

1. **Upload an Image**:
   - Drag and drop an image into the designated area
   - Or click "Browse Files" to select an image from your device

2. **Process the Image**:
   - **Resize**: Enter desired dimensions (width/height)
   - **Convert Format**: Select the target format (JPEG, PNG, WebP, PDF, DOCX)
   - **Extract Text**: Click "Extract Text" to perform OCR on the image

3. **Download the Result**:
   - When processing is complete, click "Download" to save the processed file

## Data Management

- Image files are stored in MongoDB using GridFS, allowing for efficient storage of large files
- A TTL (Time To Live) index is set up to automatically remove files after 1 hour
- Each uploaded image has metadata stored in MongoDB, including information about processing operations

## Project Structure

```
imgfixer/
├── client/                  # Frontend React application
│   ├── public/              # Public assets
│   └── src/                 # Source files
│       ├── components/      # React components
│       ├── App.jsx          # Main App component
│       └── main.jsx         # React entry point
├── server/                  # Backend Express application
│   ├── config/              # Configuration files
│   ├── models/              # MongoDB models
│   ├── utils/               # Utility functions
│   ├── index.js             # Main server file
│   └── temp/                # Temporary storage for processing
└── package.json             # Project dependencies and scripts
```

## License

ISC