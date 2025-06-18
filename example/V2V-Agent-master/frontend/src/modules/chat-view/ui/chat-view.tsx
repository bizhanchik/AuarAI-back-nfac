import { Mic, StopCircle, Volume2 } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { useVoiceChatStore } from "../model/voice-chat-store";
import { motion } from "framer-motion";

export default function ChatView() {
  const { status, isListening, toggle, response, stopPlayback } = useVoiceChatStore();

  return (
    <div className="w-full h-screen bg-gradient-to-br from-sky-100 to-white flex flex-col items-center justify-center px-6 py-10">
      <motion.h1
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-4xl sm:text-5xl font-extrabold text-slate-700 mb-10 tracking-tight text-center"
      >
        🎙️ Voice-to-Voice AI Assistant
      </motion.h1>

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="relative rounded-full w-72 h-72 sm:w-80 sm:h-80 shadow-xl bg-white bg-opacity-70 backdrop-blur-md border border-slate-200 flex items-center justify-center"
      >
        <div
          className={`absolute w-full h-full rounded-full transition-all duration-700 ease-in-out ${
            isListening
              ? "ring-4 ring-rose-400 scale-110 animate-pulse"
              : "ring-2 ring-slate-300"
          }`}
        />
        <Button
          onClick={toggle}
          disabled={status === "responding"}
          size="icon"
          className={`z-10 w-20 h-20 rounded-full p-5 shadow-lg transition-all duration-300 ${
            isListening
              ? "bg-rose-500 hover:bg-rose-600"
              : "bg-slate-700 hover:bg-slate-800"
          }`}
        >
          <Mic className="w-8 h-8 text-white" />
        </Button>
      </motion.div>

      <div className="mt-6 text-slate-600 text-lg font-medium text-center">
        {status === "responding"
          ? "⏳ Подождите, идёт ответ..."
          : isListening
          ? "🎧 Говорите сейчас..."
          : "Нажмите на кнопку, чтобы начать"}
      </div>

      {response && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 p-5 bg-white rounded-2xl shadow-inner border border-slate-200 max-w-2xl text-center text-slate-800 flex items-center gap-3"
        >
          <Volume2 className="text-rose-500 w-6 h-6 shrink-0" />
          <span className="text-base sm:text-lg">{response}</span>
        </motion.div>
      )}

      <Button
        onClick={stopPlayback}
        variant="outline"
        className="mt-6 flex items-center gap-2"
      >
        <StopCircle className="w-5 h-5" />
        Прервать ответ
      </Button>
    </div>
  );
}
