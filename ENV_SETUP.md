# Environment Variables Setup

This application uses environment variables for configuration. There are separate `.env` files for the client and server components.

## Server Environment Variables

Create a `server/.env` file with the following variables:

```
NODE_ENV=development
PORT=5000
MONGO_URI=your_mongodb_connection_string
FRONTEND_URL=http://localhost:3000
```

### Explanation:
- `NODE_ENV`: Sets the environment (development, production, etc.)
- `PORT`: The port the server will listen on
- `MONGO_URI`: Connection string for your MongoDB database
- `FRONTEND_URL`: URL of your frontend application (for CORS configuration)

## Client Environment Variables

Create a `client/.env` file with the following variables:

```
VITE_API_BASE_URL=http://localhost:5000/api
```

### Explanation:
- `VITE_API_BASE_URL`: The base URL for API requests from the frontend

## Development Setup

1. Copy the example environment variables from `.env.example` to create your own `.env` files
2. Place them in the appropriate directories (client/ and server/)
3. Adjust values as needed for your environment

## Production Deployment

### Server on Render
For production deployment on Render, set these environment variables in the Render dashboard:
```
NODE_ENV=production
MONGO_URI=your_mongodb_atlas_connection_string
FRONTEND_URL=https://your-vercel-app.vercel.app
PORT=10000
```

### Client on Vercel
For production deployment on Vercel, set these environment variables in the Vercel dashboard:
```
VITE_API_BASE_URL=https://your-render-app.onrender.com/api
```

Additionally, update the client/vercel.json file with the correct API URL:
```json
"rewrites": [
  {
    "source": "/api/:path*",
    "destination": "https://your-render-app.onrender.com/api/:path*"
  }
]
```

## Notes

- The `.env` files are excluded from Git via `.gitignore` to protect sensitive information
- For production deployment, set the environment variables according to your hosting provider's instructions
- Tesseract language data files (*.traineddata) are downloaded automatically during first use and should not be committed to Git 