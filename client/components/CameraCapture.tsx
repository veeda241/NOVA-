import React, { useRef, useEffect, useState } from 'react';
import { Camera, X, Check } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (base64: string) => void;
  onClose: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        onClose();
      }
    };
    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const takePicture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        // Standard quality jpeg
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        const base64 = dataUrl.split(',')[1];
        onCapture(base64);
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative bg-slate-900 p-2 rounded-2xl border border-slate-700 shadow-2xl max-w-md w-full mx-4">
        <button 
          onClick={onClose}
          className="absolute -top-3 -right-3 p-2 bg-slate-700 hover:bg-slate-600 rounded-full text-white transition-colors"
        >
          <X size={20} />
        </button>
        
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden mb-4">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className="w-full h-full object-cover transform scale-x-[-1]"
          />
        </div>
        
        <canvas ref={canvasRef} className="hidden" />
        
        <div className="flex justify-center pb-2">
          <button 
            onClick={takePicture}
            className="flex items-center gap-2 px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-full font-medium transition-colors"
          >
            <Camera size={20} />
            Capture Emotion
          </button>
        </div>
      </div>
    </div>
  );
};