# API Service Dockerfile for Google Cloud Run
FROM node:22-slim

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev for TypeScript compilation)
RUN npm ci

# Copy application code
COPY . .

# Compile TypeScript (API only, no frontend build needed)
RUN npm run build:api

# Remove dev dependencies for production
RUN npm ci --only=production

# Expose port (Cloud Run uses PORT env variable)
ENV PORT=8080
EXPOSE 8080

# Start the server
CMD ["npm", "run", "start"]
