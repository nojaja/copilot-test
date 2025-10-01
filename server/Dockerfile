# Production server
FROM node:18-alpine

WORKDIR /app

# Install server dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy server code
COPY . .

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 3000

# Start server with DB readiness wait
CMD ["sh", "-c", "node scripts/wait-for-db.js && npm start"]