from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from sqlalchemy.orm import Session
import google.generativeai as genai
from google.cloud import storage
import base64
import json
import tempfile
import os
import asyncio
import io
from typing import Optional
import logging
from datetime import datetime
import uuid
from google.oauth2 import service_account
from google.cloud.exceptions import GoogleCloudError

# Conditional imports for optional dependencies
try:
    import cv2
    import numpy as np
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False
    print("WARNING: OpenCV not available. Video processing will be limited.")

try:
    from gtts import gTTS
    GTTS_AVAILABLE = True
except ImportError:
    GTTS_AVAILABLE = False
    print("WARNING: gTTS not available. Text-to-speech will be disabled.")

try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False
    print("WARNING: PIL not available. Image processing will be limited.")

from ..database import get_db
from ..firebase_auth import get_current_user_websocket_firebase, get_current_user_firebase
from ..models import User
from ..services.image_compression import ImageCompressionService

router = APIRouter(prefix="/v2v", tags=["v2v-assistant"])

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configure Gemini AI and GCS
def get_gemini_model():
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500, 
            detail="Google API key not configured"
        )
    
    genai.configure(api_key=api_key)
    
    # Simplify for debugging - remove generation config temporarily
    return genai.GenerativeModel('gemini-2.0-flash')

def get_gcs_client():
    """Initialize Google Cloud Storage client with explicit credentials"""
    try:
        # Use GOOGLE_APPLICATION_CREDENTIALS if available, otherwise fall back to GCS_CREDENTIALS_PATH
        credentials_path = (
            os.getenv('GOOGLE_APPLICATION_CREDENTIALS') or 
            os.getenv('GCS_CREDENTIALS_PATH', 'gcs-key.json')
        )
        
        if not os.path.exists(credentials_path):
            logger.error(f"Service account file not found: {credentials_path}")
            return None
        
        # Load credentials explicitly from the service account file
        credentials = service_account.Credentials.from_service_account_file(
            credentials_path,
            scopes=['https://www.googleapis.com/auth/cloud-platform']
        )
        
        # Initialize client with explicit credentials
        client = storage.Client(credentials=credentials)
        logger.info("GCS client for V2V assistant initialized successfully")
        return client
    except Exception as e:
        logger.error(f"Failed to initialize GCS client: {e}")
        return None

class VideoToVoiceProcessor:
    def __init__(self, language='en'):
        self.model = get_gemini_model()
        self.gcs_client = get_gcs_client()
        self.bucket_name = os.getenv("GCS_BUCKET_NAME", "v2v-assistant-frames")
        self.frame_count = 0
        self.analysis_interval = 10 
        self.last_analysis_time = 0
        self.language = language  # Add language support
        
    def set_language(self, language):
        """Update the language for processing"""
        self.language = language

    async def upload_frame_to_gcs(self, frame_bytes: bytes) -> Optional[str]:
        """Upload frame to Google Cloud Storage and return public URL"""
        try:
            if not self.gcs_client:
                logger.error("GCS client not available")
                return None
                
            # Generate unique filename
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            unique_id = str(uuid.uuid4())[:8]
            filename = f"frames/{timestamp}_{unique_id}.jpg"
            
            # Get bucket
            bucket = self.gcs_client.bucket(self.bucket_name)
            blob = bucket.blob(filename)
            
            # Upload frame bytes
            blob.upload_from_string(frame_bytes, content_type='image/jpeg')
            
            # Make blob publicly readable
            blob.make_public()
            
            # Return public URL
            return blob.public_url
            
        except Exception as e:
            logger.error(f"Error uploading frame to GCS: {e}")
            return None

    async def process_frame(self, frame_data: bytes) -> Optional[str]:
        """Process video frame and return compliment text"""
        try:
            logger.info("Starting frame processing...")
            if not CV2_AVAILABLE:
                logger.error("OpenCV not available")
                return "OpenCV not available - cannot process video frames"
                
            # Decode base64 frame
            logger.info("Decoding base64 frame...")
            frame_bytes = base64.b64decode(frame_data)
            nparr = np.frombuffer(frame_bytes, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if frame is None:
                logger.error("Failed to decode frame")
                return None
                
            # Only process every Nth frame for performance
            self.frame_count += 1
            logger.info(f"Frame count: {self.frame_count}, interval: {self.analysis_interval}")
            if self.frame_count % self.analysis_interval != 0:
                logger.info("Skipping frame due to interval")
                return None
                
            # Resize frame for faster processing - make it smaller
            height, width = frame.shape[:2]
            if width > 320:
                scale = 320 / width
                new_width = 320
                new_height = int(height * scale)
                frame = cv2.resize(frame, (new_width, new_height))
            
            # Convert to RGB and encode as JPEG
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            frame_bgr = cv2.cvtColor(frame_rgb, cv2.COLOR_RGB2BGR)
            
            # Encode frame as JPEG bytes with higher compression for speed
            encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), 70]  # Lower quality = faster
            success, img_encoded = cv2.imencode('.jpg', frame_bgr, encode_param)
            if not success:
                logger.error("Failed to encode frame as JPEG")
                return None
                
            frame_bytes = img_encoded.tobytes()
            
            # Compress frame for AI processing to reduce costs
            try:
                compressed_frame_bytes = ImageCompressionService.compress_for_ai_processing(frame_bytes)
            except Exception as e:
                logger.error(f"Failed to compress frame: {e}")
                compressed_frame_bytes = frame_bytes  # Fallback to original
            
            # Save compressed frame temporarily and use Gemini with local file
            with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as tmp_file:
                tmp_file.write(compressed_frame_bytes)
                tmp_file_path = tmp_file.name
            
            try:
                # Use Gemini with PIL Image instead of URL
                if not PIL_AVAILABLE:
                    return "PIL not available - cannot process images"
                    
                image = Image.open(tmp_file_path)
                
                # Generate compliment using Gemini with image - language-specific prompt
                if self.language == 'ru':
                    prompt = """Дай краткий, искренний комплимент о внешности или стиле этого человека. Только одно предложение. Будь конкретным и позитивным. Отвечай на русском языке."""
                else:
                    prompt = """Give a brief, genuine compliment about this person's appearance or style. 1 sentence only. Be specific and positive. Respond in English."""
                
                response = self.model.generate_content([prompt, image])
                
            finally:
                # Clean up temporary file
                try:
                    os.unlink(tmp_file_path)
                except:
                    pass
            return response.text.strip()
                
        except Exception as e:
            logger.error(f"Error processing frame: {e}")
            return None
    
    async def text_to_speech(self, text: str) -> bytes:
        """Convert text to speech using gTTS with language support"""
        try:
            logger.info(f"Starting text to speech conversion for language: {self.language}")
            if not GTTS_AVAILABLE:
                logger.warning("gTTS not available - cannot generate speech")
                return b""
            
            # Determine TTS language based on current language setting
            tts_lang = 'ru' if self.language == 'ru' else 'en'
            logger.info(f"Using TTS language: {tts_lang}")
                
            # Simple TTS without async complexity
            tts = gTTS(text=text, lang=tts_lang, slow=False)
            
            # Save to bytes
            audio_buffer = io.BytesIO()
            tts.write_to_fp(audio_buffer)
            audio_buffer.seek(0)
            
            audio_data = audio_buffer.read()
            logger.info(f"TTS completed, audio size: {len(audio_data)}")
            return audio_data
            
        except Exception as e:
            logger.error(f"Error converting text to speech: {e}")
            return b""

@router.websocket("/ws/video-chat")
async def websocket_video_chat(websocket: WebSocket):
    await websocket.accept()
    processor = VideoToVoiceProcessor()
    
    try:
        logger.info("V2V WebSocket connection established")
        
        while True:
            # Receive frame data from client
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("type") == "video_frame":
                frame_data = message.get("data")
                language = message.get("language", "en")  # Get language from message
                logger.info(f"Received video frame data: {len(frame_data) if frame_data else 'None'}, language: {language}")
                
                # Update processor language if needed
                if processor.language != language:
                    processor.set_language(language)
                    logger.info(f"Updated processor language to: {language}")
                
                if frame_data:
                    # Process the frame
                    logger.info("Processing frame...")
                    compliment_text = await processor.process_frame(frame_data)
                    logger.info(f"Process frame result: {compliment_text}")
                    
                    if compliment_text:
                        logger.info(f"Generated compliment: {compliment_text}")
                        
                        # Convert to speech
                        logger.info("Converting to speech...")
                        audio_data = await processor.text_to_speech(compliment_text)
                        logger.info(f"Audio data generated: {len(audio_data) if audio_data else 'None'}")
                        
                        if audio_data:
                            # Send response back to client
                            response = {
                                "type": "compliment",
                                "text": compliment_text,
                                "audio": base64.b64encode(audio_data).decode('utf-8'),
                                "language": language
                            }
                            await websocket.send_text(json.dumps(response))
                            logger.info("Response sent to client")
            
            elif message.get("type") == "language_change":
                # Handle language change without video frame
                language = message.get("language", "en")
                processor.set_language(language)
                logger.info(f"Language changed to: {language}")
                
                # Send confirmation
                response = {
                    "type": "language_updated",
                    "language": language
                }
                await websocket.send_text(json.dumps(response))
            
            elif message.get("type") == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))
                
    except WebSocketDisconnect:
        logger.info("V2V WebSocket client disconnected")
    except Exception as e:
        logger.error(f"V2V WebSocket error: {e}")
        try:
            await websocket.close()
        except:
            pass

@router.get("/health")
async def health_check():
    """Health check endpoint for V2V service"""
    try:
        model = get_gemini_model()
        gcs_client = get_gcs_client()
        
        return {
            "status": "healthy",
            "service": "v2v-assistant",
            "gemini_configured": True,
            "opencv_available": CV2_AVAILABLE,
            "gtts_available": GTTS_AVAILABLE,
            "gcs_available": gcs_client is not None,
            "bucket_name": os.getenv("GCS_BUCKET_NAME", "v2v-assistant-frames")
        }
    except Exception as e:
        return {
            "status": "unhealthy", 
            "service": "v2v-assistant",
            "error": str(e),
            "gemini_configured": False,
            "opencv_available": CV2_AVAILABLE,
            "gtts_available": GTTS_AVAILABLE,
            "gcs_available": False,
            "bucket_name": os.getenv("GCS_BUCKET_NAME", "v2v-assistant-frames")
        } 