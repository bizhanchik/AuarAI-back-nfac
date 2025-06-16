from celery import Celery
from celery.schedules import crontab
import redis
import os
from dotenv import load_dotenv
from .services.ai import ai_classify_clothing
from .services.weather import fetch_weather

# Load environment variables
load_dotenv()

celery_app = Celery(
    "tasks",
    broker=os.getenv("CELERY_BROKER_URL", "redis://redis:6379/0"),
    backend=os.getenv("CELERY_RESULT_BACKEND", "redis://redis:6379/0")
)

# Configure Celery Beat schedule
celery_app.conf.beat_schedule = {
    'update-weather-every-hour': {
        'task': 'app.tasks.update_weather_task',
        'schedule': crontab(minute=0),  # Run at the start of every hour
    },
}

r = redis.Redis.from_url(os.getenv("REDIS_URL", "redis://redis:6379/0"), db=1)

def redis_key_for_user(user_id: int) -> str:
    return f"user:{user_id}:tasks"

@celery_app.task(bind=True)
def classify_image_task(self, image_bytes: bytes, user_id: int):
    key = redis_key_for_user(user_id)
    try:
        result = ai_classify_clothing(image_bytes)
        return result
    finally:
        # Удаляем task_id из Redis даже если была ошибка
        r.srem(key, self.request.id)

@celery_app.task
def update_weather_task():
    """Celery task to update weather data."""
    try:
        weather_data = fetch_weather()
        if weather_data:
            return {"status": "success", "data": weather_data}
        return {"status": "error", "message": "Failed to fetch weather data"}
    except Exception as e:
        return {"status": "error", "message": str(e)}
