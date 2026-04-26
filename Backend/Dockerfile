# ---------- builder: install all deps and compile TypeScript ----------
FROM node:24-alpine AS builder

WORKDIR /app

# Install all dependencies (including devDeps like typescript / ts-node)
COPY ./Backend/package.json ./Backend/package-lock.json* /app/
RUN npm install

# Copy sources and compile to /app/build
COPY ./Backend /app
RUN npm run build


# ---------- runner: full deps (compose uses ts-node + nodemon via npm start) ----------
FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Full install: docker-compose bind-mounts source and runs `npm start` (dev tooling).
# Omitting dev would break `nodemon` / `ts-node` on the anonymous node_modules volume.
COPY ./Backend/package.json ./Backend/package-lock.json* /app/
RUN npm install

# Bring in the compiled output for `node build/app.js` (non-compose runs)
COPY --from=builder /app/build /app/build

# Named volume `backend_assets` is seeded from the repo on first use.
COPY ./Backend/src/1-assets /app/src/1-assets

ENTRYPOINT ["node", "build/app.js"]
