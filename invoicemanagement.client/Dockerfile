# Use Node.js 18 as base image
FROM node:18-alpine AS base

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Development stage
FROM base AS dev
WORKDIR /app
RUN npm ci
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--config", "vite.config.docker.ts", "--host", "0.0.0.0"]

# Build stage
FROM base AS build
WORKDIR /app
RUN npm ci
COPY . .
RUN npm run build -- --config vite.config.docker.ts

# Production stage
FROM nginx:alpine AS production
WORKDIR /usr/share/nginx/html

# Copy built files from build stage
COPY --from=build /app/dist .

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
