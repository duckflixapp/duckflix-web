FROM oven/bun:latest AS build
RUN apt-get update && apt-get install -y python3 make g++ 

WORKDIR /app

COPY package.json bun.lockb* ./
COPY packages/shared ./packages/shared
COPY packages/frontend ./packages/frontend

RUN bun install

WORKDIR /app/packages/frontend
RUN bun run build

FROM nginx:stable-alpine
COPY --from=build /app/packages/frontend/dist /usr/share/nginx/html
COPY packages/frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]