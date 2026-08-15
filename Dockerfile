# ─── Build stage ─────────────────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ─── Runtime stage ──────────────────────────────────────────────────────
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist
COPY proxy-server.mjs ./

EXPOSE 3001
ENV PORT=3001
ENV HOST=0.0.0.0

CMD ["node", "proxy-server.mjs"]
