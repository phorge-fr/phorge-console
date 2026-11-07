# The build runs on the builder's own architecture and produces plain JavaScript, so the image for arm64 and amd64 is
# built without emulation: the svc nodes are arm64, a developer machine is often amd64.
FROM --platform=$BUILDPLATFORM node:26-slim AS build
WORKDIR /app
# The version of pnpm is the one of "packageManager" in package.json, the only place it is written.
COPY package.json pnpm-lock.yaml .npmrc ./
RUN npm install --global "pnpm@$(node -p "require('./package.json').packageManager.split('@')[1]")"
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM --platform=$BUILDPLATFORM node:26-slim AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml .npmrc ./
RUN npm install --global "pnpm@$(node -p "require('./package.json').packageManager.split('@')[1]")"
# Only what the server loads at run time (the adapter leaves the packages of "dependencies" out of its bundle), and none of
# the scripts of the packages.
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

FROM gcr.io/distroless/nodejs26-debian13:nonroot
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/build ./build
COPY package.json ./
USER 65532:65532
EXPOSE 3000
CMD ["build/index.js"]
