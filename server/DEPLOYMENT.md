# Deploying the Server to Render

This guide outlines how to deploy the ImgFixer backend API to Render.

## Prerequisites

- A MongoDB Atlas cluster or other MongoDB database
- A Render account (free at [render.com](https://render.com))

## Deployment Steps

1. **Method 1: Deploy using Render Dashboard**

   - Log in to your Render account
   - Click **New** and select **Web Service**
   - Connect your GitHub repository
   - Configure the service:
     - **Name**: imgfixer-api (or your preferred name)
     - **Environment**: Node
     - **Build Command**: npm install
     - **Start Command**: npm start
     - **Plan**: Free (or select another plan if needed)
   - Add environment variables:
     - `NODE_ENV`: production
     - `PORT`: 10000
     - `MONGO_URI`: Your MongoDB connection string
     - `FRONTEND_URL`: Your frontend URL (Vercel deployment URL)
   - Click **Create Web Service**

2. **Method 2: Deploy using render.yaml**

   - Make sure the `render.yaml` file is present in your server directory
   - From the Render dashboard, click **New** and select **Blueprint**
   - Connect your GitHub repository
   - Render will detect the `render.yaml` file and configure services
   - Add the secret environment variables (MONGO_URI and FRONTEND_URL)
   - Click **Apply** to create the service

3. **After Deployment**

   - Note your service URL (e.g., `https://imgfixer-api.onrender.com`)
   - Provide this URL to the frontend team for configuration
   - Test the API by making a request to a public endpoint

## Environment Variables

- `NODE_ENV`: Set to "production" for deployment
- `PORT`: The port that Render will use internally (10000 is recommended)
- `MONGO_URI`: Your MongoDB connection string (keep this secret)
- `FRONTEND_URL`: The URL of your frontend app (for CORS configuration)

## Render Free Tier Limitations

- Free plan web services will spin down after 15 minutes of inactivity
- The first request after inactivity may take 20-30 seconds to respond
- Free plan includes 750 hours per month of runtime

## Monitoring and Maintenance

- Use the Render dashboard to monitor logs and performance
- The automatic cleanup job runs every hour to manage storage
- Files are cleaned up based on server load
  - With few files (<50): Files kept for up to 6 hours
  - With many files (>1000): Files deleted after just 5 minutes

## Troubleshooting

- **Deployment Failures**:
  - Check Render logs for specific error messages
  - Verify all required environment variables are set

- **MongoDB Connection Issues**:
  - Check that your MongoDB connection string is correct
  - Ensure network access is configured in MongoDB Atlas
  - Verify that the database user has correct permissions

- **CORS Errors**:
  - Make sure FRONTEND_URL is set to your actual frontend domain
  - Check CORS configuration in your code 