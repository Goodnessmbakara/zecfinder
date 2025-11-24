FROM node:20-alpine

WORKDIR /app

# Install pnpm and wget for healthcheck
RUN npm install -g pnpm && apk add --no-cache wget

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build TypeScript
RUN pnpm build

# Expose port
EXPOSE 3001

# Start server
CMD ["pnpm", "start"]


