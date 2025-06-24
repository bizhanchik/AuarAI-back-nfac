import { useState, useRef, useEffect } from 'react';
import { X, Video, VideoOff, Volume2 } from 'lucide-react';
import analytics from '../services/analytics';
import toast from 'react-hot-toast';

const V2VAssistantModal = ({ isOpen, onClose }) => {
  const [isVideoActive, setIsVideoActive] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [currentCompliment, setCurrentCompliment] = useState('');
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const wsRef = useRef(null);
  const streamRef = useRef(null);
  const audioRef = useRef(null);
  const frameIntervalRef = useRef(null);

  // WebSocket connection
  const connectWebSocket = () => {
    try {
      const token = localStorage.getItem('token');
      
      // Determine WebSocket URL based on environment and protocol
      let wsUrl;
      const isSecure = window.location.protocol === 'https:';
      const hostname = window.location.hostname;
      
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        // Local development
        wsUrl = `ws://localhost:8000/v2v/ws/video-chat`;
      } else {
        // Production - always use WSS for security
        if (isSecure) {
          wsUrl = `wss://${hostname}/api/v2v/ws/video-chat`;
        } else {
          wsUrl = `ws://${hostname}:8000/v2v/ws/video-chat`;
        }
      }
      
      console.log('Attempting to connect to:', wsUrl);
      
      // Add token to WebSocket if available
      if (token) {
        wsUrl += `?token=${token}`;
      }
      
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        setIsConnected(true);
        setConnectionStatus('connected');
        toast.success('Подключен к AI стилисту!');
      };
      
      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'compliment') {
          setCurrentCompliment(data.text);
          
          // Play audio compliment
          if (data.audio) {
            const audioBlob = base64ToBlob(data.audio, 'audio/mp3');
            const audioUrl = URL.createObjectURL(audioBlob);
            
            if (audioRef.current) {
              // Stop current audio if playing
              audioRef.current.pause();
              audioRef.current.currentTime = 0;
              
              // Set new source and play
              audioRef.current.src = audioUrl;
              audioRef.current.play()
                .then(() => {
                  setIsAudioPlaying(true);
                })
                .catch((error) => {
                  console.error('Error playing audio:', error);
                  setIsAudioPlaying(false);
                });
            }
          }
        }
      };
      
      wsRef.current.onclose = () => {
        setIsConnected(false);
        setConnectionStatus('disconnected');
        toast.error('Соединение с AI стилистом потеряно');
      };
      
      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('error');
        
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
          toast.error('Ошибка подключения к AI стилисту. Проверьте, что бэкенд запущен на порту 8000.');
        } else {
          toast.error('Сервис видео-чата временно недоступен. Попробуйте позже.');
        }
      };
      
    } catch (error) {
      console.error('Error connecting WebSocket:', error);
      toast.error('Не удалось подключиться к AI стилисту');
    }
  };

  // Helper function to convert base64 to blob
  const base64ToBlob = (base64, mimeType) => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  };

  // Start video capture
  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 640 }, 
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Wait for video metadata to load before playing
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().catch(error => {
            console.warn('Video autoplay failed:', error);
          });
        };
      }
      
      setIsVideoActive(true);
      
      // 📊 Отслеживание начала V2V диалога
      analytics.trackV2VDialogue();
      
      // Start sending frames to backend
      startFrameCapture();
      
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error('Не удалось получить доступ к камере');
    }
  };

  // Stop video capture
  const stopVideo = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }
    
    setIsVideoActive(false);
  };

  // Capture and send frames to backend
  const startFrameCapture = () => {
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
    }
    
    frameIntervalRef.current = setInterval(() => {
      if (videoRef.current && canvasRef.current && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        const ctx = canvas.getContext('2d');
        
        // Set canvas size to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw current video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert to base64
        const frameData = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
        
        // Send frame to backend
        const message = {
          type: 'video_frame',
          data: frameData
        };
        
        wsRef.current.send(JSON.stringify(message));
      }
    }, 1000); // Send frame every second
  };

  // Handle audio end
  const handleAudioEnd = () => {
    setIsAudioPlaying(false);
    // Clean up audio URL
    if (audioRef.current && audioRef.current.src) {
      URL.revokeObjectURL(audioRef.current.src);
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (isVideoActive) {
      stopVideo();
    } else {
      startVideo();
    }
  };

  // Initialize when modal opens
  useEffect(() => {
    if (isOpen) {
      connectWebSocket();
      
      // Create audio element
      audioRef.current = new Audio();
      audioRef.current.onended = handleAudioEnd;
    }
    
    return () => {
      // Cleanup on close
      if (wsRef.current) {
        wsRef.current.close();
      }
      stopVideo();
      if (audioRef.current) {
        audioRef.current.pause();
        // Clean up audio URL before nulling reference
        if (audioRef.current.src) {
          URL.revokeObjectURL(audioRef.current.src);
        }
        audioRef.current = null;
      }
    };
  }, [isOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopVideo();
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

        {/* Modal */}
        <div className="inline-block w-full max-w-4xl p-6 my-8 text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                🎬 AI Stylist Video Chat
              </h3>
              <p className="text-gray-600 mt-1">
                Включите камеру для получения комплиментов от ИИ
              </p>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

                      {/* Connection Status */}
          <div className="mb-4 flex items-center justify-between">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
              connectionStatus === 'connected' 
                ? 'bg-green-100 text-green-800' 
                : connectionStatus === 'error'
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${
                connectionStatus === 'connected' 
                  ? 'bg-green-500' 
                  : connectionStatus === 'error'
                  ? 'bg-red-500'
                  : 'bg-yellow-500'
              }`}></div>
              {connectionStatus === 'connected' ? 'Подключен к AI стилисту' : 
               connectionStatus === 'error' ? 'Ошибка подключения' : 'Подключение...'}
            </div>
            
            {connectionStatus === 'error' && (
              <button
                onClick={connectWebSocket}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Повторить
              </button>
            )}
          </div>
          
          {/* Service Status Info */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              🏥 <strong>Статус сервиса:</strong> Backend V2V доступен и готов к работе
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Если подключение не удается, возможно WebSocket блокируется прокси-сервером
            </p>
            {connectionStatus === 'error' && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-xs text-yellow-800">
                  <strong>Решение:</strong> Обратитесь к администратору для настройки WebSocket через nginx/apache
                </p>
              </div>
            )}
          </div>

          {/* Video Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Video Feed */}
            <div className="lg:col-span-2">
              <div className="relative bg-gray-900 rounded-xl overflow-hidden aspect-video">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  muted
                  playsInline
                />
                
                {!isVideoActive && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                    <div className="text-center text-white">
                      <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg">Камера выключена</p>
                      <p className="text-sm opacity-75">Нажмите кнопку для включения</p>
                    </div>
                  </div>
                )}
                
                {/* Canvas for frame capture (hidden) */}
                <canvas ref={canvasRef} className="hidden" />
              </div>
              
              {/* Video Controls */}
              <div className="flex justify-center mt-4 space-x-4">
                <button
                  onClick={toggleVideo}
                  disabled={!isConnected}
                  className={`flex items-center px-6 py-3 rounded-xl font-semibold transition-all ${
                    isVideoActive
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400'
                  }`}
                >
                  {isVideoActive ? (
                    <>
                      <VideoOff className="w-5 h-5 mr-2" />
                      Остановить видео
                    </>
                  ) : (
                    <>
                      <Video className="w-5 h-5 mr-2" />
                      Включить видео
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Compliments Panel */}
            <div className="lg:col-span-1">
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 h-full">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Volume2 className="w-5 h-5 mr-2" />
                  Комплименты AI
                </h4>
                
                {currentCompliment ? (
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-bold">AI</span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-800">{currentCompliment}</p>
                          {isAudioPlaying && (
                            <div className="flex items-center mt-2 text-sm text-purple-600">
                              <Volume2 className="w-4 h-4 mr-1 animate-pulse" />
                              Воспроизводится...
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="inline-flex items-center px-3 py-1 bg-white rounded-full text-sm text-gray-600">
                        ✨ Получайте комплименты в реальном времени
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">🎭</div>
                    <p className="text-gray-600 mb-2">
                      Включите камеру для получения комплиментов
                    </p>
                    <p className="text-sm text-gray-500">
                      AI проанализирует ваш образ и даст персональные комплименты
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-6 p-4 bg-blue-50 rounded-xl">
            <h5 className="font-semibold text-blue-900 mb-2">Как это работает:</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-800">
              <div className="flex items-center">
                <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold mr-2">1</div>
                Включите камеру
              </div>
              <div className="flex items-center">
                <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold mr-2">2</div>
                AI анализирует ваш образ
              </div>
              <div className="flex items-center">
                <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold mr-2">3</div>
                Получайте голосовые комплименты
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default V2VAssistantModal; 