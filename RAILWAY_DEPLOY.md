# OpenClaw Deployer - Railway Deployment Guide

This guide will help you deploy the OpenClaw Deployer to Railway.app in just a few clicks.

## Prerequisites

1. Railway.app account (sign up at https://railway.app)
2. GitHub account
3. Credit card added to Railway (they provide $5 free credit)

## Deployment Steps

### 1. Push to GitHub

The code is already in this repository. You just need to push it to GitHub:

```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit - OpenClaw Deployer"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/openclaw-deployer.git
git push -u origin main
```

### 2. Deploy to Railway

1. Go to https://railway.app
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Authorize Railway to access your GitHub account
5. Select the `openclaw-deployer` repository
6. Railway will automatically detect the Dockerfile and start building

### 3. Add Environment Variables

Railway needs the same environment variables that Manus provides. Add these in the Railway dashboard:

**Required Variables:**
- `DATABASE_URL` - MySQL/TiDB connection string
- `JWT_SECRET` - Session cookie signing secret
- `VITE_APP_ID` - Manus OAuth application ID
- `OAUTH_SERVER_URL` - Manus OAuth backend base URL
- `VITE_OAUTH_PORTAL_URL` - Manus login portal URL
- `OWNER_OPEN_ID` - Owner's OpenID
- `OWNER_NAME` - Owner's name
- `BUILT_IN_FORGE_API_URL` - Manus built-in APIs URL
- `BUILT_IN_FORGE_API_KEY` - Bearer token for Manus APIs (server-side)
- `VITE_FRONTEND_FORGE_API_KEY` - Bearer token for frontend
- `VITE_FRONTEND_FORGE_API_URL` - Manus built-in APIs URL for frontend

**To add variables in Railway:**
1. Click on your deployed service
2. Go to "Variables" tab
3. Click "Add Variable"
4. Paste each variable name and value

### 4. Enable Docker Socket

Railway needs access to Docker to spawn OpenClaw containers:

1. In your service settings, go to "Settings" tab
2. Under "Deploy", enable "Docker Socket Access"
3. This allows the app to create and manage Docker containers

### 5. Add Database

Railway can provision a MySQL database for you:

1. Click "New" in your project
2. Select "Database" → "MySQL"
3. Copy the connection string
4. Add it as the `DATABASE_URL` environment variable

### 6. Deploy!

Railway will automatically deploy your app. You can:

- View logs in the "Deployments" tab
- Get your public URL in the "Settings" tab
- Monitor resource usage in the "Metrics" tab

## How It Works

1. **Main App**: Runs in a Docker container built from `Dockerfile`
2. **Bot Instances**: Each bot spawns its own Docker container using the OpenClaw base image
3. **Process Management**: The app uses Docker API to start/stop/restart bot containers
4. **Isolation**: Each bot runs in complete isolation with its own dependencies

## Troubleshooting

### Build Fails

- Check that all environment variables are set
- Review build logs in Railway dashboard
- Ensure Dockerfile is in the repository root

### Bots Won't Start

- Verify Docker socket access is enabled
- Check that the OpenClaw base image built successfully
- Review bot logs in the app dashboard

### Database Connection Issues

- Ensure `DATABASE_URL` is correct
- Check that Railway MySQL is running
- Verify network connectivity

## Cost Estimate

Railway pricing (as of 2024):
- **Free tier**: $5 credit/month
- **Hobby plan**: $5/month base + usage
- **Estimated cost**: $10-30/month depending on number of bots

Each bot container uses ~200MB RAM and minimal CPU when idle.

## Support

For issues with:
- **Railway deployment**: Check Railway docs at https://docs.railway.app
- **OpenClaw**: Visit https://github.com/openclaw/openclaw
- **This app**: Create an issue in the GitHub repository
