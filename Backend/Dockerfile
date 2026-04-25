# ---------- builder: install all deps and compile TypeScript ----------
    FROM node:24-alpine AS builder

    WORKDIR /app

    # Install all dependencies (including devDeps like typescript / ts-node)
    COPY ./Backend/package.json ./Backend/package-lock.json* /app/
    RUN npm install

    # Copy sources and compile to /app/build
    COPY ./Backend /app
    RUN npm run build


# ---------- runner: lean image with only production deps + compiled JS ----------
    FROM node:24-alpine AS runner

    WORKDIR /app

    ENV NODE_ENV=production

    # Install only production dependencies
    COPY ./Backend/package.json ./Backend/package-lock.json* /app/
    RUN npm install --omit=dev

    # Bring in the compiled output from the builder stage
    COPY --from=builder /app/build /app/build

    # Seed the uploads directory with any static images shipped in the repo.
    # Docker uses this folder to initialize the `backend_assets` named volume
    # the FIRST time it's created (in compose). Without this, a fresh volume
    # comes up empty and all previously-uploaded images appear broken on the
    # site even though their filenames are still in MongoDB.
    COPY ./Backend/src/1-assets /app/src/1-assets

    # Run the compiled app directly with node — no ts-node at runtime.
    ENTRYPOINT ["node", "build/app.js"]
