FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY --chown=node:node package*.json ./
RUN npm ci

# Copy application source
COPY --chown=node:node . .

RUN chown -R node:node /app

USER node

EXPOSE 5000

# Launches Express server (non-destructive startup)
CMD ["node", "src/server.js"]

