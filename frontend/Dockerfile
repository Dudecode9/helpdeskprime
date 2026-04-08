FROM node:20-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine

RUN apk add --no-cache gettext

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
COPY nginx.http.conf.template /etc/nginx/templates/http.conf.template
COPY nginx.https.conf.template /etc/nginx/templates/https.conf.template
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
EXPOSE 443

RUN chmod +x /usr/local/bin/docker-entrypoint.sh
CMD ["/usr/local/bin/docker-entrypoint.sh"]
