# Video-to-Voice AI Assistant Documentation

## Обзор

Video-to-Voice (V2V) ассистент - это интеллектуальная система, которая анализирует видео пользователя в реальном времени и предоставляет персонализированные голосовые комплименты, используя Gemini AI API.

## Функциональность

- 🎥 **Real-time видео анализ** через веб-камеру
- 🤖 **AI анализ внешности** с помощью Gemini 2.0 Flash
- 🗣️ **Text-to-Speech** с русской озвучкой через Google TTS
- 📡 **WebSocket соединение** для мгновенной связи
- 💬 **Персонализированные комплименты** на основе стиля и внешности

## Архитектура

### Backend (FastAPI)
- **WebSocket endpoint**: `/v2v/ws/video-chat`
- **Health check**: `/v2v/health`
- **Обработка видео кадров**: анализ каждые 30 кадров (~1 сек)
- **AI модель**: Gemini 2.0 Flash для анализа изображений
- **TTS**: Google Text-to-Speech с русской озвучкой

### Frontend (React)
- **Компонент**: `V2VAssistantModal.jsx`
- **Кнопка активации**: "Talk to AI Stylist" в Dashboard
- **Видео capture**: HTML5 getUserMedia API
- **WebSocket клиент**: для отправки видео кадров
- **Аудио плеер**: для воспроизведения голосовых комплиментов

## Установка и настройка

### 1. Зависимости Backend

Все необходимые пакеты уже добавлены в `requirements.txt`:

```bash
pip install -r requirements.txt
```

Ключевые новые зависимости:
- `websockets==12.0` - WebSocket поддержка
- `opencv-python==4.10.0.84` - обработка видео
- `numpy==1.24.3` - математические операции
- `gtts==2.4.0` - Text-to-Speech
- `aiofiles==23.2.1` - асинхронная работа с файлами

### 2. Переменные окружения

Добавьте в ваш `.env` файл:

```env
# Google AI (Gemini) - ОБЯЗАТЕЛЬНО!
GOOGLE_API_KEY=your-google-api-key-here

# Остальные переменные (уже должны быть)
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
SECRET_KEY=your-secret-key-here
FRONTEND_URLS=http://localhost:5173,http://localhost:5175
```

### 3. Получение Google API ключа

1. Перейдите в [Google AI Studio](https://aistudio.google.com/)
2. Создайте новый API ключ
3. Скопируйте ключ в переменную `GOOGLE_API_KEY`

### 4. Frontend настройка

Компонент автоматически подключается к WebSocket на `ws://localhost:8000/v2v/ws/video-chat`

## Использование

### 1. Запуск Backend

```bash
cd /path/to/your/Backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Запуск Frontend

```bash
cd /path/to/your/Backend/frontend/auarai
npm run dev
```

### 3. Использование V2V ассистента

1. Войдите в Dashboard
2. Нажмите кнопку **"Talk to AI Stylist"**
3. Разрешите доступ к камере
4. Нажмите **"Включить видео"**
5. Получайте персональные комплименты от AI!

## Workflow процесса

```mermaid
graph TD
    A[Пользователь нажимает 'Talk to AI Stylist'] --> B[Открывается модальное окно]
    B --> C[Подключение к WebSocket]
    C --> D[Пользователь включает камеру]
    D --> E[Захват видео кадров каждую секунду]
    E --> F[Отправка кадра в base64 через WebSocket]
    F --> G[Backend: декодирование кадра]
    G --> H[Gemini AI: анализ внешности]
    H --> I[Генерация персонального комплимента]
    I --> J[Google TTS: преобразование в речь]
    J --> K[Отправка аудио обратно клиенту]
    K --> L[Воспроизведение комплимента]
    L --> E
```

## Технические детали

### Обработка видео кадров

```python
# Анализируется каждый 30-й кадр для оптимизации производительности
self.analysis_interval = 30

# Кадры масштабируются до 640px ширины для быстрой обработки
if width > 640:
    scale = 640 / width
    new_width = 640
    new_height = int(height * scale)
    frame = cv2.resize(frame, (new_width, new_height))
```

### Prompt для Gemini AI

```python
prompt = """
Analyze this image of a person and give them a genuine, positive compliment about their appearance, style, or presentation. 
Be specific about what looks good - their outfit, color choices, hair, smile, posture, or overall style.
Keep the compliment natural, friendly, and encouraging. Make it sound like something a supportive friend or professional stylist would say.
Keep it to 1-2 sentences maximum. Be authentic and avoid generic compliments.

Examples of good compliments:
- "That color really brings out your eyes beautifully!"
- "Your outfit has such a great balance of colors and style!"
- "You have such a confident, radiant smile!"
- "That hairstyle really suits your face shape perfectly!"

Give ONE specific compliment based on what you see in the image:
"""
```

## Безопасность

- WebSocket соединения защищены через токен аутентификации
- Временные файлы изображений автоматически удаляются после обработки
- Видео данные не сохраняются на сервере
- Все коммуникации происходят в реальном времени без логирования

## Проблемы и решения

### Проблема: WebSocket не подключается
**Решение**: Проверьте, что backend запущен на порту 8000 и доступен по адресу `localhost:8000`

### Проблема: Камера не включается
**Решение**: Убедитесь, что браузер имеет разрешение на доступ к камере

### Проблема: "Google API key not configured"
**Решение**: Добавьте переменную `GOOGLE_API_KEY` в файл `.env`

### Проблема: Аудио не воспроизводится
**Решение**: Проверьте, что браузер поддерживает воспроизведение MP3 и не заблокирован автоплей

## Производительность

- **Частота анализа**: 1 кадр в секунду
- **Размер кадра**: максимум 640px по ширине
- **Формат передачи**: JPEG с качеством 80%
- **Время ответа**: 2-5 секунд в зависимости от загрузки Gemini API

## Расширение функциональности

Для добавления новых функций:

1. **Изменение языка TTS**: Измените параметр `lang` в `text_to_speech()`
2. **Настройка частоты анализа**: Измените `analysis_interval` в `VideoToVoiceProcessor`
3. **Кастомизация промпта**: Отредактируйте промпт в методе `process_frame()`
4. **Добавление новых типов анализа**: Расширьте логику в WebSocket обработчике

## Мониторинг

Проверьте статус сервиса:
```bash
curl http://localhost:8000/v2v/health
```

Ответ:
```json
{
  "status": "healthy",
  "service": "v2v-assistant", 
  "gemini_configured": true
}
``` 