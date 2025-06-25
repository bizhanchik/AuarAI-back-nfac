#!/bin/bash

set -e
set -o pipefail

echo "📁 Переход в директорию проекта..."
cd ~/AuarAI-back-nfac

echo "📦 Получаем свежий код из GitHub..."
GIT_SSH_COMMAND="ssh -i ~/.ssh/id_github" git pull --no-rebase origin main

if [[ "$1" == "--clean" ]]; then
  echo "🧹 Полная очистка старых контейнеров и образов..."
  docker-compose down --remove-orphans
  docker image prune -a -f
else
  echo "🧼 Мягкое выключение контейнеров (без удаления образов)..."
  docker-compose down --remove-orphans
fi

echo "⬇️ Обновляем образы с Docker Hub (если указаны)..."
docker-compose pull || true

echo "🔨 Собираем только изменённые образы..."
docker-compose build --quiet

echo "🚀 Запускаем контейнеры..."
docker-compose up -d

echo "✅ Деплой завершён успешно!"
