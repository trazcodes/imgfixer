# Server Environment Variables Setup

This document explains how to set up environment variables for the ImgFixer server application.

## Local Development

Create a `.env` file in the server directory with:

```
NODE_ENV=development
PORT=5000
MONGO_URI=your_mongodb_connection_string
FRONTEND_URL=http://localhost:3000
```

### Variable Explanation:

- `NODE_ENV`: Sets the environment (development, production, etc.)
- `PORT`: The port the server will listen on
- `MONGO_URI`: Connection string for your MongoDB database
- `FRONTEND_URL`: URL of your frontend application (for CORS configuration)

## Production Deployment

For production deployment on Render, set these environment variables in the Render dashboard:

```
NODE_ENV=production
PORT=10000
MONGO_URI=your_mongodb_atlas_connection_string
FRONTEND_URL=https://your-vercel-app.vercel.app
```

## How Environment Variables Work

The server uses `dotenv` to load environment variables from the .env file:

```javascript
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '.env') });
```

## Security Considerations

- Never commit your `.env` file to Git (it should be in `.gitignore`)
- Use environment variables for all sensitive information
- For MongoDB Atlas, create a dedicated database user with restricted permissions
- Make sure to set the correct `FRONTEND_URL` to prevent CORS issues 