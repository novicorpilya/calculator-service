import React, { useState, useEffect, useRef } from 'react';
import { Trash2, Send } from 'lucide-react';

interface VoiceRecorderProps {
    onRecordingComplete: (blob: Blob, duration: number) => void;
    onCancel: () => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
    onRecordingComplete,
    onCancel,
}) => {
    const [elapsedTime, setElapsedTime] = useState(0); // in milliseconds
    const [isBlocked, setIsBlocked] = useState(false);
    const mediaRecorder = useRef<MediaRecorder | null>(null);
    const audioChunks = useRef<Blob[]>([]);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const startTimeRef = useRef<number>(0);

    useEffect(() => {
        // Request microphone access and start recording
        const startRecording = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const recorder = new MediaRecorder(stream);
                mediaRecorder.current = recorder;

                recorder.ondataavailable = (e) => {
                    if (e.data.size > 0) {
                        audioChunks.current.push(e.data);
                    }
                };

                recorder.onstop = () => {
                    // Cleanup stream tracks
                    stream.getTracks().forEach(track => track.stop());
                };

                recorder.start();
                startTimeRef.current = Date.now();
                
                // Start Timer with higher precision
                timerRef.current = setInterval(() => {
                    setElapsedTime(Date.now() - startTimeRef.current);
                }, 100);

            } catch (err) {
                console.error('Error accessing microphone:', err);
                setIsBlocked(true);
            }
        };

        startRecording();

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
                mediaRecorder.current.stop();
            }
        };
    }, []);

    const formatTime = (ms: number) => {
        const totalSeconds = Math.floor(ms / 1000);
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        const tenths = Math.floor((ms % 1000) / 100);
        
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${tenths}`;
    };

    const stopRecording = () => {
        if (!mediaRecorder.current || mediaRecorder.current.state === 'inactive') return;

        mediaRecorder.current.onstop = () => {
            const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
            onRecordingComplete(audioBlob, elapsedTime / 1000);
        };

        mediaRecorder.current.stop();
        if (timerRef.current) clearInterval(timerRef.current);
    };

    const handleCancel = () => {
        if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
            mediaRecorder.current.onstop = () => {}; // Ignore the result
            mediaRecorder.current.stop();
        }
        if (timerRef.current) clearInterval(timerRef.current);
        onCancel();
    };

    if (isBlocked) {
        return (
            <div className="flex-1 flex items-center justify-between bg-red-500/10 border border-red-500/20 px-6 py-4 rounded-[2.5rem] animate-in slide-in-from-bottom-2">
                <span className="text-[11px] font-black uppercase tracking-widest text-red-500">
                    Доступ к микрофону запрещен
                </span>
                <button onClick={onCancel} className="text-red-500/60 hover:text-red-500 transition-colors">
                    <Trash2 size={18} />
                </button>
            </div>
        );
    }

    return (
        <div className="flex-1 flex items-center justify-between bg-card/60 backdrop-blur-xl border border-border-theme rounded-[2rem] p-1.5 animate-in slide-in-from-bottom-4 duration-500 shadow-xl shadow-black/5">
            {/* Left side: Trash/Cancel Action */}
            <div className="flex items-center pl-2">
                <button
                    type="button"
                    onClick={handleCancel}
                    className="w-11 h-11 hover:bg-red-500/10 text-foreground/20 hover:text-red-500 transition-all rounded-full flex items-center justify-center group"
                    title="Удалить"
                >
                    <Trash2 size={20} className="group-hover:scale-110 transition-transform duration-300" />
                </button>
            </div>

            {/* Center: Recording indicator and Telegram-style Timer */}
            <div className="flex items-center gap-3">
                <div className="relative flex items-center justify-center w-2.5 h-2.5">
                    <span className="absolute w-full h-full bg-red-500 rounded-full animate-ping opacity-40" />
                    <span className="relative w-2.5 h-2.5 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                </div>
                <div className="flex items-baseline gap-1">
                    <span className="text-[16px] font-bold font-mono text-foreground leading-none tabular-nums tracking-tight">
                        {formatTime(elapsedTime)}
                    </span>
                </div>
            </div>

            {/* Right side: Send Action */}
            <div className="pr-1">
                <button
                    type="button"
                    onClick={stopRecording}
                    className="w-11 h-11 bg-primary text-white rounded-full shadow-lg shadow-primary/20 flex items-center justify-center hover:scale-105 active:scale-95 transition-all group overflow-hidden relative"
                    title="Отправить"
                >
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/0 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Send size={18} className="relative z-10 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" />
                </button>
            </div>
        </div>
    );
};
