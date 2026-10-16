FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy application source
COPY . .

EXPOSE 5000

# Runs seed then launches Express server
CMD ["sh", "-c", "node src/seed.js && node src/server.js"]

