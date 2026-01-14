import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Square, X } from 'lucide-react';
import { logger } from '@/core/logging';
import { toast } from 'sonner';

export interface VoiceRecorderProps {
    onRecordingComplete: (audioBlob: Blob, duration: number) => void;
    onCancel?: () => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onRecordingComplete, onCancel }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<number | null>(null);
    const startTimeRef = useRef<number>(0);

    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus',
            });

            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
                const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
                onRecordingComplete(audioBlob, duration);
                stream.getTracks().forEach((track) => track.stop());
                setIsRecording(false);
                setRecordingTime(0);
            };

            mediaRecorder.start();
            setIsRecording(true);
            startTimeRef.current = Date.now();
            setRecordingTime(0);

            // Update timer based on actual elapsed time
            timerRef.current = window.setInterval(() => {
                const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
                setRecordingTime(elapsed);
            }, 100); // Update every 100ms for smooth display, but show only full seconds
        } catch (error) {
            logger.error('Error accessing microphone', { error });
            toast.error('Не удалось получить доступ к микрофону. Проверьте разрешения.');
        }
    }, [onRecordingComplete]);

    useEffect(() => {
        // Auto-start recording when component mounts
        const timer = setTimeout(() => {
            startRecording();
        }, 0);

        return () => {
            clearTimeout(timer);
            if (timerRef.current) clearInterval(timerRef.current);
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
            }
        };
    }, [startRecording]);

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
            if (timerRef.current) clearInterval(timerRef.current);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleCancel = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
        if (timerRef.current) clearInterval(timerRef.current);
        onCancel?.();
    };

    if (isRecording) {
        return (
            <div className="flex items-center gap-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-2xl animate-pulse">
                <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-[11px] font-black uppercase tracking-widest text-red-500">
                        {formatTime(recordingTime)}
                    </span>
                </div>
                {onCancel && (
                    <button
                        onClick={handleCancel}
                        className="p-2 text-foreground/40 hover:text-foreground transition-colors rounded-lg"
                        aria-label="Отменить запись"
                    >
                        <X size={16} />
                    </button>
                )}
                <button
                    onClick={stopRecording}
                    className="ml-auto p-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all flex items-center gap-2"
                >
                    <Square size={16} fill="currentColor" />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                        Остановить
                    </span>
                </button>
            </div>
        );
    }

    // Loading state while requesting microphone access
    return (
        <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-foreground/40">
                Запрос доступа к микрофону...
            </span>
        </div>
    );
};
