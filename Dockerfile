# ─── Build stage ─────────────────────────────────────────────────────────
FROM node:26-alpine AS build
WORKDIR /app

# Set to "true" to build a public demo bundle that serves mock data and
# never talks to a real Syncthing instance (see SECURITY.md / README).
ARG VITE_DEMO_MODE=false
ENV VITE_DEMO_MODE=${VITE_DEMO_MODE}

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ─── Runtime stage ──────────────────────────────────────────────────────
FROM node:26-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Must match the build-stage VITE_DEMO_MODE — this one disables the proxy's
# ability to forward anywhere, as defense-in-depth on top of the frontend
# never issuing real requests in demo mode.
ARG VITE_DEMO_MODE=false
ENV DEMO_MODE=${VITE_DEMO_MODE}

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist
COPY proxy-server.mjs ./

EXPOSE 3001
ENV PORT=3001
ENV HOST=0.0.0.0

CMD ["node", "proxy-server.mjs"]
