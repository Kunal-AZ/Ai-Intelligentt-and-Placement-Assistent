FROM node:22-alpine AS build
WORKDIR /app/Frontend
COPY Frontend/package.json ./
RUN npm install
COPY Frontend ./
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/Frontend/dist /usr/share/nginx/html
COPY infrastructure/docker/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
