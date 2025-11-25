FROM node:20-slim

WORKDIR /app

# Install pnpm and build tools
RUN npm install -g pnpm && \
    apt-get update && \
    apt-get install -y python3 make g++ wget && \
    rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build TypeScript
RUN rm -rf dist && npm run build

# Expose port
EXPOSE 3001

# Start server
CMD ["npm", "start"]
