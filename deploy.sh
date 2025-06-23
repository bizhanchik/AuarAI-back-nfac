#!/bin/bash

set -e
set -o pipefail

echo "📁 Переход в директорию проекта..."
# Already in the correct directory

echo "📦 Получаем свежий код из GitHub..."
GIT_SSH_COMMAND="ssh -i ~/.ssh/id_github" git pull --no-rebase origin main

echo "🧹 Чистим старые контейнеры без удаления данных..."
docker-compose down --remove-orphans 
docker image prune -a -f

echo "⬇️ Обновляем образы с Docker Hub (если нужно)..."
docker-compose pull

echo "🔨 Пересобираем образы..."
docker-compose build

echo "🚀 Запускаем контейнеры..."
docker-compose up -d

echo "✅ Деплой завершён успешно!"
