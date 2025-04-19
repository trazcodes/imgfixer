# Deploying ImgFixer to Vercel

This guide outlines how to deploy the ImgFixer application to Vercel, either as two separate projects (recommended) or as a monorepo.

## Option 1: Separate Deployments (Recommended)

### Deploy the Server

1. Navigate to the server directory:
   ```
   cd server
   ```

2. Log in to Vercel CLI (or create an account if you don't have one):
   ```
   npx vercel login
   ```

3. Deploy the server:
   ```
   npx vercel
   ```

4. During deployment, set the following environment variables in the Vercel dashboard:
   - `MONGO_URI`: Your MongoDB connection string
   - `NODE_ENV`: production

5. Make note of the deployment URL (e.g., `https://imgfixer-server.vercel.app`)

### Deploy the Client

1. Navigate to the client directory:
   ```
   cd client
   ```

2. Edit the client/vercel.json file to update the API destination with your server URL:
   ```json
   "rewrites": [
     {
       "source": "/api/:path*",
       "destination": "https://your-server-url.vercel.app/api/:path*"
     }
   ]
   ```

3. Create a .env file with the API URL:
   ```
   VITE_API_BASE_URL=https://your-server-url.vercel.app/api
   ```

4. Deploy the client:
   ```
   npx vercel
   ```

## Option 2: Monorepo Deployment

For a single deployment containing both client and server:

1. From the project root, deploy using Vercel:
   ```
   npx vercel
   ```

2. Set the required environment variables in the Vercel dashboard:
   - `MONGO_URI`: Your MongoDB connection string
   - `NODE_ENV`: production

## Setting Up MongoDB Atlas

1. Create a MongoDB Atlas account and set up a new cluster.
2. Create a database user with read/write permissions.
3. Configure network access (whitelist IP addresses or allow all).
4. Get your connection string from the MongoDB Atlas dashboard.
5. Add your connection string as `MONGO_URI` in Vercel environment variables.

## Vercel Environment Variables

Make sure to add all required environment variables in the Vercel dashboard:

1. Go to your Vercel project.
2. Navigate to Settings > Environment Variables.
3. Add the required variables (MONGO_URI, etc.).

## Notes About Production Deployment

1. In production, files are automatically cleaned up based on the server's load:
   - With few files (<50): Files kept for up to 6 hours
   - With many files (>1000): Files deleted after just 5 minutes

2. For the OCR functionality, Tesseract language data files are downloaded on first use.

3. The server includes a scheduled cleanup (cron job) that runs every hour to manage storage.

## Troubleshooting

- **Deployment fails**: Check Vercel build logs for specific errors.
- **API requests fail**: Ensure the API URL is correctly set in the client deployment.
- **MongoDB connection issues**: Verify network access settings in MongoDB Atlas.
- **Missing environment variables**: Double-check all required variables are set in Vercel. 