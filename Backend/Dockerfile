FROM node:22-alpine AS build
WORKDIR /app
COPY package.json tsconfig.base.json ./
COPY Backend/package.json Backend/package.json
COPY packages ./packages
COPY Backend ./Backend
RUN npm install --workspaces --include-workspace-root && npm run build --workspace=@placement-assistant/api

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/Backend ./Backend
COPY --from=build /app/packages ./packages
WORKDIR /app/Backend
EXPOSE 4000
CMD ["node", "dist/server.js"]
