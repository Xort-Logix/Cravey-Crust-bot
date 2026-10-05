# Use official Node.js 20 LTS image
FROM node:20-bookworm-slim

# Install system dependencies (ffmpeg is useful for audio/video processing)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./

# Install production dependencies
RUN npm install --omit=dev

# Copy application files
COPY . .

# Expose HTTP port for keep-alive server
EXPOSE 3000

# Start the bot
CMD ["npm", "start"]
