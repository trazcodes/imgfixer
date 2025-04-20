# Deploying the Client to Vercel

This guide outlines how to deploy the ImgFixer client to Vercel.

## Prerequisites

- A deployed backend API (on Render or elsewhere)
- A Vercel account (free at [vercel.com](https://vercel.com))

## Deployment Steps

1. **Update Configuration Files**

   Update the `vercel.json` file to point to your backend API:
   ```json
   {
     "framework": "vite",
     "buildCommand": "npm run build",
     "outputDirectory": "dist",
     "rewrites": [
       {
         "source": "/api/:path*",
         "destination": "https://your-backend-url.onrender.com/api/:path*"
       },
       {
         "source": "/(.*)",
         "destination": "/index.html"
       }
     ],
     "headers": [
       {
         "source": "/assets/(.*)",
         "headers": [
           {
             "key": "Cache-Control",
             "value": "public, max-age=31536000, immutable"
           }
         ]
       }
     ]
   }
   ```

2. **Create Environment File**

   Create a `.env` file with:
   ```
   VITE_API_BASE_URL=https://your-backend-url.onrender.com/api
   ```

3. **Deploy using Vercel CLI**

   Install and use Vercel CLI:
   ```bash
   # Install Vercel CLI
   npm install -g vercel
   
   # Login to Vercel
   vercel login
   
   # Deploy
   vercel
   ```

4. **Deploy using Vercel Dashboard**

   Alternatively, you can deploy through the Vercel dashboard:
   - Push your code to GitHub
   - Create a new project in Vercel
   - Connect your GitHub repository
   - Configure the build settings (Framework: Vite)
   - Add environment variables
   - Deploy

5. **Verify Deployment**

   After deployment:
   - Note your Vercel URL (e.g., `https://imgfixer.vercel.app`)
   - Update your backend's CORS configuration to allow requests from this domain
   - Test that API requests work correctly

## Troubleshooting

- **API Calls Failing**: 
  - Check that `vercel.json` rewrites point to the correct backend URL
  - Verify environment variables are set correctly
  - Ensure CORS is properly configured on the backend

- **Build Errors**:
  - Check Vercel build logs
  - Make sure all dependencies are properly listed in package.json
  
- **"Not Found" on Page Refresh**:
  - Verify the catch-all rewrite rule is working correctly 