FROM node:20-alpine
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy shared types to the path the relative imports expect
# Imports like ../../shared/types from /app/lib/ resolve to /shared/types
COPY shared /shared

# Copy all frontend source
COPY . .

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
