import os
import io
import json
import re
from typing import Dict
from dotenv import load_dotenv
from PIL import Image
import google.generativeai as genai

load_dotenv()
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

def ai_classify_clothing(image_bytes: bytes) -> Dict:
    image = Image.open(io.BytesIO(image_bytes))

    model = genai.GenerativeModel("gemini-1.5-flash")

    prompt = (
        "Classify this clothing item and return JSON in this format only:\n"
        "{"
        "\"name\": str, "
        "\"brand\": str or null, "
        "\"category\": str, "
        "\"gender\": str (male/female/unisex), "
        "\"color\": str, "
        "\"size\": str or null, "
        "\"material\": str or null, "
        "\"description\": str, "
        "\"tags\": list of strings, "
        "\"occasions\": list of strings, "
        "\"weather_suitability\": list of strings"
        "}"
    )

    response = model.generate_content([prompt, image], generation_config={"temperature": 0.4})

    try:
        print("AI raw response:", response.text)  # 👈 чтобы видеть, что именно вернул Gemini

        # Попробуем извлечь JSON
        match = re.search(r'\{.*\}', response.text, re.DOTALL)
        if match:
            return json.loads(match.group())
        else:
            raise ValueError("No JSON object found in AI response.")

    except Exception as e:
        print("❌ Error parsing AI response:", e)
        return {"error": "Invalid response from AI"}
