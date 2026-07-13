# Build stage
FROM node:20-alpine AS build
RUN npm install -g bun
WORKDIR /app
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile --ignore-scripts
COPY . .
RUN bun run nuxt prepare && JWT_SECRET=build-placeholder bun run build

# Runtime stage
FROM oven/bun:1-alpine AS runtime
WORKDIR /app
COPY --from=build /app/.output .output
COPY --from=build /app/node_modules node_modules
COPY --from=build /app/server/database/drizzle server/database/drizzle
COPY --from=build /app/drizzle.config.ts drizzle.config.ts
COPY --from=build /app/server/database/schema server/database/schema

ENV NODE_ENV=production
ENV PORT=3220
ENV HOST=0.0.0.0

EXPOSE 3220

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -fsS http://localhost:3220/api/health || exit 1

CMD ["bun", "run", ".output/server/index.mjs"]
