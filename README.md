# ImgFixer

A MERN stack application for image processing with OCR capabilities, resizing, and format conversion.

## Project Structure

This project is organized into two main directories:

- **client/**: Frontend React application
- **server/**: Backend Node.js API

Each directory has its own README.md, package.json, and deployment instructions.

## Quick Start

### Running the Server

```bash
cd server
npm install
# Set up .env file - see server/ENV_SETUP.md
npm run dev
```

### Running the Client

```bash
cd client
npm install
# Set up .env file - see client/ENV_SETUP.md
npm run dev
```

## Deployment

- The client is configured for deployment to Vercel
- The server is configured for deployment to Render

For detailed deployment instructions, see the DEPLOYMENT.md files in the respective directories.

## Documentation

- **client/README.md**: Frontend documentation
- **server/README.md**: Backend documentation
- **client/DEPLOYMENT.md**: Frontend deployment guide
- **server/DEPLOYMENT.md**: Backend deployment guide
- **client/ENV_SETUP.md**: Frontend environment variables guide
- **server/ENV_SETUP.md**: Backend environment variables guide