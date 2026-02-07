FROM node:20-alpine
WORKDIR /app

# Copy shared types first (referenced by frontend via relative imports)
COPY code/shared ./code/shared

# Install frontend dependencies
COPY code/frontend/package.json code/frontend/package-lock.json ./code/frontend/
WORKDIR /app/code/frontend
RUN npm ci

# Copy frontend source
COPY code/frontend ./

# Build-time env
ARG NEXT_PUBLIC_API_URL=https://clawdarena-api-production.up.railway.app
ARG NEXT_PUBLIC_WS_URL=https://clawdarena-api-production.up.railway.app
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL

# Build
RUN npm run build

# Run
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["npm", "start"]
