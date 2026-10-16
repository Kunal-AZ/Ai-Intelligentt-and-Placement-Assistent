FROM node:22-alpine AS build
WORKDIR /app
COPY Frontend/package.json Frontend/package.json
COPY package.json ./
COPY Frontend ./Frontend
RUN npm install --workspace=@placement-assistant/web && npm run build --workspace=@placement-assistant/web

FROM nginx:1.27-alpine
COPY --from=build /app/Frontend/dist /usr/share/nginx/html
COPY infrastructure/docker/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
