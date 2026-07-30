# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies. Using `npm install` (not `npm ci`) so that
# `"lyzr-architect-pg": "latest"` resolves fresh on every build — matches
# Netlify's behavior. Tradeoff: non-reproducible builds across time.
RUN npm install --no-audit --no-fund

# Copy source files
COPY . .

# Apply pending drizzle migrations before building (mirrors netlify.toml).
# DATABASE_URL must be provided as a build arg/env by the deploy platform
# (Coolify: mark it as a build variable); skipped when the app has no database.
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}
RUN if [ -n "$DATABASE_URL" ]; then npm run db:migrate; fi

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application (standalone output)
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3333

ENV PORT=3333
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
