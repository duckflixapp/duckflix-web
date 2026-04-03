FROM oven/bun:latest AS builder
WORKDIR /app

ARG NODE_AUTH_TOKEN
ENV NODE_AUTH_TOKEN=$NODE_AUTH_TOKEN

COPY package.json bun.lock* .npmrc ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]