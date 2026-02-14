# OpenClaw Base Image
# This Dockerfile creates a clean OpenClaw installation for bot instances

FROM node:22-alpine

# Install git and other dependencies
RUN apk add --no-cache git python3 make g++

# Set working directory
WORKDIR /app

# Clone OpenClaw repository
RUN git clone https://github.com/openclaw/openclaw.git .

# Install dependencies
RUN npm install --legacy-peer-deps

# Expose default gateway port (will be overridden per instance)
EXPOSE 8080

# Default command (will be overridden with specific config)
CMD ["node", "scripts/run-node.mjs", "gateway"]
