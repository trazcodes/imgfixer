# Deploying ImgFixer

This guide outlines how to deploy the ImgFixer application with the client on Vercel and the server on Render.

## Deploying the Server to Render

### Option 1: Deploy via Dashboard

1. Create a Render account at [render.com](https://render.com) if you don't have one.

2. From the Render dashboard, click **New** and select **Web Service**.

3. Connect your GitHub repository or click **Build and deploy from a public repository**.

4. Configure the service:
   - **Name**: imgfixer-api (or your preferred name)
   - **Environment**: Node
   - **Build Command**: npm install
   - **Start Command**: npm start
   - **Plan**: Free (or select another plan if needed)

5. Add the following environment variables:
   - `NODE_ENV`: production
   - `MONGO_URI`: Your MongoDB connection string
   - `FRONTEND_URL`: Your frontend URL (will be your Vercel deployment URL)

6. Click **Create Web Service**.

7. Wait for the deployment to complete and note the service URL (e.g., `https://imgfixer-api.onrender.com`).

### Option 2: Deploy Using render.yaml

1. Make sure the `render.yaml` file is present in your server directory.

2. From the Render dashboard, click **New** and select **Blueprint**.

3. Connect your GitHub repository.

4. Render will detect the `render.yaml` file and configure the services.

5. Add the secret environment variables:
   - `MONGO_URI`: Your MongoDB connection string
   - `FRONTEND_URL`: Your frontend URL (will be your Vercel deployment URL)

6. Click **Apply** to create the service.

7. Wait for the deployment to complete and note the service URL.

## Deploying the Client to Vercel

1. Update the `client/vercel.json` file to point to your Render backend:
   ```json
   "rewrites": [
     {
       "source": "/api/:path*",
       "destination": "https://your-render-app-url.onrender.com/api/:path*"
     }
   ]
   ```

2. Create a `client/.env` file with your backend URL:
   ```
   VITE_API_BASE_URL=https://your-render-app-url.onrender.com/api
   ```

3. Deploy to Vercel:
   - Create a Vercel account at [vercel.com](https://vercel.com) if you don't have one.
   - Install Vercel CLI: `npm install -g vercel`
   - Navigate to your client directory: `cd client`
   - Log in to Vercel: `vercel login`
   - Deploy your app: `vercel`

4. During deployment, Vercel will ask for configuration details. You can accept the defaults or customize as needed.

5. After deployment completes, note the deployment URL (e.g., `https://imgfixer.vercel.app`).

## Connecting Client and Server

After deploying both services, you need to update the following:

1. **Update the server's CORS settings**:
   - Go to your Render dashboard.
   - Navigate to your web service.
   - Update the `FRONTEND_URL` environment variable to your Vercel URL (e.g., `https://imgfixer.vercel.app`).

2. **Update the client's API endpoint**:
   - If you didn't configure it correctly during deployment:
     - Go to your Vercel dashboard.
     - Navigate to your project.
     - Go to Settings > Environment Variables.
     - Add `VITE_API_BASE_URL` with your Render API URL (e.g., `https://imgfixer-api.onrender.com/api`).
   - Alternatively, redeploy with updated vercel.json and .env files.

## Setting Up MongoDB Atlas

1. Create a MongoDB Atlas account and set up a new cluster.
2. Create a database user with read/write permissions.
3. Configure network access (whitelist IP addresses or allow all).
4. Get your connection string from the MongoDB Atlas dashboard.
5. Add your connection string as `MONGO_URI` in Render environment variables.

## Notes About Production Deployment

1. **Render Free Tier Limitations**:
   - Free plan web services will spin down after 15 minutes of inactivity.
   - The first request after inactivity may take some time to respond.
   - Free plan includes 750 hours per month of runtime.

2. **File Handling**:
   - In production, files are automatically cleaned up based on the server's load.
   - With few files (<50): Files kept for up to 6 hours.
   - With many files (>1000): Files deleted after just 5 minutes.

3. **OCR Functionality**:
   - Tesseract language data files are downloaded on first use.

4. **Server Maintenance**:
   - The server includes a scheduled cleanup job that runs every hour to manage storage.

## Troubleshooting

- **Client-side API calls failing**: 
  - Check that the rewrite rules in vercel.json are correctly pointing to your Render URL.
  - Verify the VITE_API_BASE_URL is set correctly.
  - Ensure CORS is properly configured on the server with the correct frontend URL.

- **Server not responding**:
  - For the free tier, the server might be in a sleep state. Wait for it to wake up (first request may take up to 30 seconds).
  - Check Render logs for any errors.

- **MongoDB connection issues**:
  - Verify the MONGO_URI is correctly set in Render environment variables.
  - Check that network access is properly configured in MongoDB Atlas.

- **"Not found" errors when navigating directly to routes**:
  - Ensure the client's vercel.json includes the catch-all rewrite to index.html. 