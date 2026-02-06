FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

# Copy source
COPY prisma ./prisma
COPY src ./src
COPY seeds ./seeds
COPY tsconfig.json ./

# Generate Prisma client
RUN bunx prisma generate

# Expose port
EXPOSE 3001

# Start: wait for DB, push schema, seed, then run server
CMD ["sh", "-c", "sleep 5 && for i in 1 2 3 4 5; do bunx prisma db push --skip-generate --accept-data-loss && break || sleep 5; done && bun run seeds/seed.ts 2>/dev/null; bun run src/index.ts"]
