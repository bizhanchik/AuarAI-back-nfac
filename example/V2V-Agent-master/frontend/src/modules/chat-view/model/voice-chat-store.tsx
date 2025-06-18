import { useRef, useState } from "react";

export function useVoiceChatStore() {
  const [status, setStatus] = useState<"idle" | "listening" | "responding">("idle");
  const [isListening, setIsListening] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [response, setResponse] = useState<string>("");
  const wsRef = useRef<WebSocket | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopPlayback = () => {
    audioRef.current?.pause();
    audioRef.current?.removeAttribute("src");
    audioRef.current?.load();
  };

  const toggle = async () => {
    // Остановить озвучку если уже идет
    stopPlayback();

    if (isListening) {
      mediaRecorder?.stop();
      setIsListening(false);
      setStatus("responding");
    } else {
      if (!wsRef.current || wsRef.current.readyState !== 1) {
        wsRef.current = new WebSocket("ws://localhost:8080/api/ws/voice-chat");

        wsRef.current.onmessage = async (event) => {
          const audioBlob = new Blob([event.data], { type: "audio/mpeg" });
          const url = URL.createObjectURL(audioBlob);

          const audio = new Audio(url);
          audioRef.current = audio;
          audio.play();

          setResponse("🔊 Ответ получен");
          setStatus("idle");
        };

        wsRef.current.onerror = () => {
          setStatus("idle");
        };
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      let chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: "audio/webm" });
        if (wsRef.current && wsRef.current.readyState === 1) {
          wsRef.current.send(await audioBlob.arrayBuffer());
        }
        setStatus("responding");
      };

      setMediaRecorder(recorder);
      recorder.start();
      setIsListening(true);
      setStatus("listening");
    }
  };

  return { status, isListening, toggle, response, stopPlayback };
}
