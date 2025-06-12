from celery import Celery
import redis
from .services.ai import ai_classify_clothing

celery_app = Celery(
    "tasks",
    broker="redis://redis:6379/0",
    backend="redis://redis:6379/0"
)

r = redis.Redis(host="redis", port=6379, db=1)

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
