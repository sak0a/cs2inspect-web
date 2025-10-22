# syntax=docker/dockerfile:1

# Multi-stage build for Nuxt 3 (SSR) app
# - Install deps with Bun (fast, uses bun.lock)
# - Build with Node (compat-friendly for Nuxt/unimport)
# - Run Nitro server with Bun

# 1) Build stage (Node + Bun for install)
FROM node:20-slim AS build
WORKDIR /app

# Install Bun into the build image
RUN apt-get update \
 && apt-get install -y --no-install-recommends curl ca-certificates unzip \
 && rm -rf /var/lib/apt/lists/* \
 && curl -fsSL https://bun.sh/install | bash \
 && mv /root/.bun/bin/bun /usr/local/bin/bun

# Install dependencies via Bun (respects bun.lock)
COPY package*.json bun.lock* ./
RUN bun install --frozen-lockfile

# Copy source and build with Node
COPY . .
RUN npm run build

# 2) Runtime stage (Bun)
FROM oven/bun:1 AS runner
WORKDIR /app

# Install curl for health checks
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

# Copy runtime dependencies and manifests for externalized packages (e.g., vue)
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package*.json ./

# Copy the built Nitro output
COPY --from=build /app/.output ./.output

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

EXPOSE 3000

# Health check configuration
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -fsS http://localhost:3000/api/health/ready || exit 1

# Start Nitro server with Bun runtime
CMD ["bun", "run", ".output/server/index.mjs"]

