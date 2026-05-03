# Duckflix Frontend — Deployment & Development Guide

## 1. Prerequisites

### Local Development

- **Bun**: [https://bun.sh/](https://bun.sh/)

### Containerized

- **Docker & Docker Compose**: [https://www.docker.com/](https://www.docker.com/)

## 2. Environment Variables

Copy `.example.env` to `.env` and fill in the values:
```bash
cp .example.env .env
```

> **Note:** Variables are injected during the build process. Ensure your `.env` is populated before building.

## 3. Running via Docker
```bash
docker compose up --build -d
```
```bash
docker compose down
```

Served statically via Nginx on port 5173.

## 4. Local Development

### Install Dependencies
```bash
bun install
```

### Start
```bash
bun dev
```

## 5. Endpoints

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

## 6. License

Duckflix Frontend is licensed under the [MIT License](./LICENSE).
