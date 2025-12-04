FROM node:20-slim

WORKDIR /app

# Install pnpm and build tools
RUN npm install -g pnpm && \
    apt-get update && \
    apt-get install -y python3 make g++ wget && \
    rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies (pnpm ignores build scripts by default for security)
RUN pnpm install --frozen-lockfile

# Manually build sqlite3 native bindings using npm
RUN npm install -g node-gyp && \
    find node_modules/.pnpm -name "sqlite3" -type d -path "*/sqlite3@*/node_modules/sqlite3" | head -1 | xargs -I {} sh -c 'cd {} && npm run install'

# Copy source code
COPY . .

# Build TypeScript
RUN rm -rf dist && pnpm run build

# Expose port
EXPOSE 3001

# Start server
CMD ["pnpm", "start"]
