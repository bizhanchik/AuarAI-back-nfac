# Dockerfile (frontend)

FROM node:20 AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

# вот здесь передаём переменную на этапе сборки
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Сервер для отдачи статики
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
