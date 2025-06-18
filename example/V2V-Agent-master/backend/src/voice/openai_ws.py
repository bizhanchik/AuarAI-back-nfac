from fastapi import WebSocket, WebSocketDisconnect, APIRouter
from openai import OpenAI
from config import settings
import tempfile

client = OpenAI(api_key=settings.OPENAI_API_KEY)

router = APIRouter()    

@router.websocket("/ws/voice-chat")
async def websocket_voice_chat(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_bytes()

            # Сохраняем временный файл
            with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp:
                tmp.write(data)
                tmp_path = tmp.name

            # Распознаем
            with open(tmp_path, "rb") as audio_file:
                transcript = client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file
                )

            # Получаем ответ
            response = client.chat.completions.create(
                model="gpt-4o",  # можно turbo
                messages=[{"role": "user", "content": transcript.text}]
            )
            reply_text = response.choices[0].message.content

            # 🔊 Генерируем голос
            tts_response = client.audio.speech.create(
                model="tts-1",
                voice="nova",  # можно 'alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'
                input=reply_text,
            )

            # Отправляем mp3-файл клиенту
            await websocket.send_bytes(tts_response.read())
    except WebSocketDisconnect:
        print("Client disconnected")
