# OpenClaw Deployer - Main Web App
# This runs the control plane that manages OpenClaw bot containers

FROM node:22-alpine

# Install Docker CLI (to manage containers from inside the app)
RUN apk add --no-cache docker-cli

# Set working directory
WORKDIR /app

# Copy package files and patches
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy application code
COPY . .

# Build frontend
RUN pnpm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["pnpm", "start"]
