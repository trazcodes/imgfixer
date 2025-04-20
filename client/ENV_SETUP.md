# Client Environment Variables Setup

This document explains how to set up environment variables for the ImgFixer client application.

## Local Development

Create a `.env` file in the client directory with:

```
VITE_API_BASE_URL=http://localhost:5000/api
```

This tells the client application where to find the API server during development.

## Production Deployment

For production deployment on Vercel, set the environment variable in the Vercel dashboard:

```
VITE_API_BASE_URL=https://your-render-app.onrender.com/api
```

Additionally, update the `vercel.json` file to proxy API requests:

```json
"rewrites": [
  {
    "source": "/api/:path*",
    "destination": "https://your-render-app.onrender.com/api/:path*"
  }
]
```

## How Environment Variables Work with Vite

In Vite applications:

1. Only variables prefixed with `VITE_` are exposed to your client code
2. You access them via `import.meta.env.VITE_VARIABLE_NAME`
3. Environment variables are embedded at build time

## Security Note

Never expose sensitive information (API keys, secrets) in client-side code. 
The client environment variables should only contain public information like API endpoints. 