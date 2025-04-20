# ImgFixer - Frontend

This is the frontend for the ImgFixer application, a MERN stack application for image processing with OCR capabilities, resizing, and format conversion.

## Features

- **Drag and Drop Image Upload**: Easily upload images via drag and drop or file browser
- **OCR (Optical Character Recognition)**: Extract text from images
- **Image Resizing**: Resize images while maintaining aspect ratio
- **Format Conversion**: Convert images to various formats (JPEG, PNG, WebP, PDF, DOCX)
- **Modern UI/UX**: Beautiful and responsive user interface

## Tech Stack

- React with Vite
- Styled-components for styling
- React-dropzone for drag and drop functionality
- Axios for API requests
- React-toastify for notifications
- React-icons for icons

## Getting Started

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file with:
   ```
   VITE_API_BASE_URL=http://localhost:5000/api
   ```

3. Start the development server:
   ```
   npm run dev
   ```

4. Open your browser and navigate to http://localhost:3000

## Deployment

To deploy the client to Vercel, follow these steps:

1. Update the `vercel.json` file with your backend URL.
2. Create a `.env` file with your production API URL.
3. Deploy using Vercel CLI or GitHub integration.

See the server's README for backend setup instructions. 