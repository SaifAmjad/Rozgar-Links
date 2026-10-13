# syntax=docker/dockerfile:1

FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json tsconfig.base.json ./
COPY client/package.json client/package.json
COPY server/package.json server/package.json
COPY shared/package.json shared/package.json
RUN npm ci

COPY shared shared
COPY server server
RUN npm run build --workspace @rozgar-links/shared \
  && npm run build --workspace @rozgar-links/server

FROM node:20-alpine AS production-dependencies
WORKDIR /app
COPY package.json package-lock.json ./
COPY client/package.json client/package.json
COPY server/package.json server/package.json
COPY shared/package.json shared/package.json
RUN npm ci --omit=dev --workspace @rozgar-links/server --workspace @rozgar-links/shared

FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

COPY --from=production-dependencies /app/node_modules ./node_modules
COPY --from=production-dependencies /app/package.json ./package.json
COPY --from=production-dependencies /app/server/package.json ./server/package.json
COPY --from=production-dependencies /app/shared/package.json ./shared/package.json
COPY --from=build --chown=node:node /app/server/dist ./server/dist
COPY --from=build --chown=node:node /app/shared/dist ./shared/dist
COPY --from=build --chown=node:node /app/server/data/jobs.seed.json ./server/data/jobs.seed.json
RUN chown -R node:node /app/server/data

USER node
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:4000/api/health').then((response)=>{if(!response.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "server/dist/index.js"]
