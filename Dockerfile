# syntax=docker/dockerfile:1

# Multi-stage build for Nuxt 3 (SSR) app
# - Install deps with Bun (fast, uses bun.lock)
# - Build with Node (compat-friendly for Nuxt/unimport)
# - Run Nitro server with Bun

# 1) Build stage (Node + Bun for install)
FROM node:20-alpine AS build
WORKDIR /app

# Install build dependencies and Bun
RUN apk add --no-cache curl ca-certificates unzip bash \
 && curl -fsSL https://bun.sh/install | bash \
 && mv /root/.bun/bin/bun /usr/local/bin/bun \
 && apk del unzip bash

# Install dependencies via Bun (respects bun.lock)
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy source and build
# JWT_TOKEN is required by Nuxt prerender — dummy value is safe, only used at build time
COPY . .
RUN JWT_TOKEN=build-placeholder bun run build

# 2) Runtime stage (Bun)
FROM oven/bun:1-alpine AS runner
WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Copy runtime dependencies and manifests for externalized packages (e.g., vue)
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./

# Copy the built Nitro output
COPY --from=build /app/.output ./.output

# Copy drizzle migration files (SQL + journal) for auto-migrate on startup
COPY --from=build /app/server/database/drizzle ./server/database/drizzle

# Copy drizzle config + schema for manual db:push / db:migrate
COPY --from=build /app/drizzle.config.ts ./
COPY --from=build /app/server/database/schema ./server/database/schema

ENV NODE_ENV=production
ENV PORT=3210
ENV HOST=0.0.0.0

EXPOSE 3210

# Health check configuration
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -fsS http://localhost:${PORT:-3210}/api/health/ready || exit 1

# Start Nitro server with Bun runtime
CMD ["bun", "run", ".output/server/index.mjs"]
