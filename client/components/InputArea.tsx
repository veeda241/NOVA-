import React, { useState, useRef } from 'react';
import { Send, Mic, Camera, ImagePlus, StopCircle, Loader2 } from 'lucide-react';

interface InputAreaProps {
  onSendMessage: (text: string, image?: string, audio?: string) => void;
  isLoading: boolean;
  onCameraClick: () => void;
}

export const InputArea: React.FC<InputAreaProps> = ({ onSendMessage, isLoading, onCameraClick }) => {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleSend = () => {
    if (!text.trim() && !isRecording) return;
    onSendMessage(text);
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = (reader.result as string).split(',')[1];
          onSendMessage("Voice Message", undefined, base64Audio);
        };
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Microphone access denied or not available.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="p-4 bg-slate-900 border-t border-slate-800">
      <div className="max-w-4xl mx-auto relative flex items-end gap-2 bg-slate-800/50 p-2 rounded-2xl border border-slate-700 focus-within:border-indigo-500/50 transition-colors">
        
        {/* Helper Actions */}
        <div className="flex gap-1 pb-1">
          <button 
             onClick={onCameraClick}
             disabled={isLoading}
             className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-700/50 rounded-full transition-colors disabled:opacity-50"
             title="Analyze Facial Expression (FER2013)"
          >
            <Camera size={20} />
          </button>
          
          <button 
             onClick={isRecording ? stopRecording : startRecording}
             disabled={isLoading}
             className={`p-2 rounded-full transition-colors ${
                isRecording 
                  ? 'text-red-500 bg-red-500/10 animate-pulse' 
                  : 'text-slate-400 hover:text-indigo-400 hover:bg-slate-700/50'
             } disabled:opacity-50`}
             title="Analyze Voice Tone (RAVDESS)"
          >
            {isRecording ? <StopCircle size={20} /> : <Mic size={20} />}
          </button>
        </div>

        {/* Text Input */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isRecording ? "Listening..." : "Tell NOVA how you feel..."}
          disabled={isLoading || isRecording}
          rows={1}
          className="flex-1 bg-transparent text-slate-200 placeholder-slate-500 text-sm md:text-base resize-none focus:outline-none py-3 max-h-32 overflow-y-auto scrollbar-hide"
        />

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={(!text.trim() && !isRecording) || isLoading}
          className={`p-3 rounded-xl mb-0.5 transition-all duration-200 ${
            text.trim() && !isLoading 
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500' 
              : 'bg-slate-700 text-slate-500 cursor-not-allowed'
          }`}
        >
          {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>

      </div>
      <div className="text-center mt-2">
        <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">
           Multimodal Emotional Intelligence
        </p>
      </div>
    </div>
  );
};