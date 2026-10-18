FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy application source
COPY . .

EXPOSE 5000

# Launches Express server (non-destructive startup)
CMD ["node", "src/server.js"]

