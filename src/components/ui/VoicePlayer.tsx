import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Loader2, AlertCircle, Check, CheckCheck, Clock } from 'lucide-react';

interface VoicePlayerProps {
    voiceUrl: string;
    duration?: number;
    className?: string;
    showLoading?: boolean;
    isOwn?: boolean;
    isRead?: boolean;
    isTemp?: boolean;
}

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const VoicePlayer: React.FC<VoicePlayerProps> = ({
    voiceUrl,
    duration,
    className = '',
    showLoading = false,
    isOwn = false,
    isRead = false,
    isTemp = false,
}) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [isLoading, setIsLoading] = useState(showLoading);
    const [hasError, setHasError] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const progressBarRef = useRef<HTMLDivElement | null>(null);
    const currentTimeTextRef = useRef<HTMLSpanElement | null>(null);

    useEffect(() => {
        const audio = new Audio();
        audioRef.current = audio;

        const handleLoadStart = () => {
            if (showLoading) setIsLoading(true);
        };
        const handleCanPlay = () => {
            setIsLoading(false);
        };
        const handleError = () => {
            setIsLoading(false);
            setHasError(true);
        };
        const handleEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
        };

        audio.addEventListener('loadstart', handleLoadStart);
        audio.addEventListener('canplaythrough', handleCanPlay);
        audio.addEventListener('canplay', handleCanPlay);
        audio.addEventListener('error', handleError);
        audio.addEventListener('ended', handleEnded);

        audio.src = voiceUrl;
        audio.load();

        if (audio.readyState >= 3) {
            requestAnimationFrame(() => setIsLoading(false));
        }

        return () => {
            audio.pause();
            audio.removeEventListener('loadstart', handleLoadStart);
            audio.removeEventListener('canplaythrough', handleCanPlay);
            audio.removeEventListener('canplay', handleCanPlay);
            audio.removeEventListener('error', handleError);
            audio.removeEventListener('ended', handleEnded);
            audio.src = '';
        };
    }, [voiceUrl, showLoading]);

    useEffect(() => {
        let frameId: number;

        const animate = () => {
            if (audioRef.current && !audioRef.current.paused) {
                const time = audioRef.current.currentTime;
                
                // Direct DOM update for 60fps smoothness without React re-renders
                if (progressBarRef.current) {
                    const p = duration ? (time / duration) * 100 : 0;
                    progressBarRef.current.style.width = `${p}%`;
                }
                if (currentTimeTextRef.current) {
                    currentTimeTextRef.current.innerText = formatTime(time);
                }

                frameId = requestAnimationFrame(animate);
            }
        };

        if (isPlaying) {
            frameId = requestAnimationFrame(animate);
        }

        return () => {
            if (frameId) cancelAnimationFrame(frameId);
        };
    }, [isPlaying, duration]);

    const togglePlay = () => {
        if (!audioRef.current || hasError) return;

        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play().catch(() => setHasError(true));
        }
        setIsPlaying(!isPlaying);
    };

    const progress = duration ? (currentTime / duration) * 100 : 0;

    return (
        <div
            className={`flex items-center gap-3 p-2.5 bg-primary rounded-2xl border border-primary/20 shadow-lg shadow-primary/10 ${className}`}
        >
            <button
                onClick={togglePlay}
                disabled={isLoading || hasError}
                className="w-10 h-10 rounded-full bg-white text-primary hover:scale-105 active:scale-95 transition-all flex items-center justify-center shrink-0 disabled:opacity-50 shadow-md"
            >
                {isLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                ) : hasError ? (
                    <AlertCircle size={16} className="text-red-500" />
                ) : isPlaying ? (
                    <Pause size={16} fill="currentColor" />
                ) : (
                    <Play size={16} fill="currentColor" className="ml-0.5" />
                )}
            </button>

            <div className="flex-1 pr-1">
                <div className="h-1 bg-white/20 rounded-full overflow-hidden relative mb-2">
                    <div
                        ref={progressBarRef}
                        className="absolute inset-y-0 left-0 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-white">
                    <div className="flex items-center gap-2">
                        <span ref={currentTimeTextRef}>{formatTime(currentTime)}</span>
                        {isOwn && (
                            <div className="flex items-center opacity-70">
                                {isTemp ? (
                                    <Clock size={10} />
                                ) : isRead ? (
                                    <CheckCheck size={11} className="text-white" />
                                ) : (
                                    <Check size={11} />
                                )}
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white/10 rounded-full border border-white/5">
                        <svg
                            width="8"
                            height="8"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="4"
                        >
                            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                        </svg>
                        <span>{formatTime(duration || 0)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
