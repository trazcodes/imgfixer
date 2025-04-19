# Environment Variables Setup

This application uses environment variables for configuration. There are separate `.env` files for the client and server components.

## Server Environment Variables

Create a `server/.env` file with the following variables:

```
NODE_ENV=development
PORT=5000
MONGO_URI=your_mongodb_connection_string
```

## Client Environment Variables

Create a `client/.env` file with the following variables:

```
VITE_API_BASE_URL=http://localhost:5000/api
```

## Development Setup

1. Copy the example environment variables from `.env.example` to create your own `.env` files
2. Place them in the appropriate directories (client/ and server/)
3. Adjust values as needed for your environment

## Notes

- The `.env` files are excluded from Git via `.gitignore` to protect sensitive information
- For production deployment, set the environment variables according to your hosting provider's instructions
- Tesseract language data files (*.traineddata) are downloaded automatically during first use and should not be committed to Git 