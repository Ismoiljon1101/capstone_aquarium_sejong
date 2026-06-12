# Stage 1: Build
FROM node:20-alpine AS builder

# Install build dependencies for native node modules (e.g., better-sqlite3)
RUN apk add --no-cache python3 make g++

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy lockfile, workspace manifest, and root package.json
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./

# Copy packages configuration files
COPY shared/package.json shared/
COPY services/backend/package.json services/backend/

# Install workspace dependencies
RUN pnpm install --frozen-lockfile

# Copy codebase
COPY shared/ shared/
COPY services/backend/ services/backend/

# Build NestJS application
RUN pnpm --filter backend build

# Stage 2: Runner
FROM node:20-alpine AS runner

# Install pnpm globally
RUN npm install -g pnpm

WORKDIR /app

# Copy all build artifacts and dependencies from builder
COPY --from=builder /app /app

EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

# Start NestJS backend in production mode
CMD ["pnpm", "--filter", "backend", "run", "start:prod"]
