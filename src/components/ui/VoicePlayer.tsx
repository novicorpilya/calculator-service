import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Loader2 } from 'lucide-react';

interface VoicePlayerProps {
    voiceUrl: string;
    duration?: number;
    className?: string;
}

export const VoicePlayer: React.FC<VoicePlayerProps> = ({ voiceUrl, duration, className = '' }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const requestRef = useRef<number | null>(null);

    // Animation frame for ultra-smooth progress
    const animate = React.useCallback(() => {
        if (audioRef.current && !audioRef.current.paused) {
            setCurrentTime(audioRef.current.currentTime);
            requestRef.current = requestAnimationFrame(animate);
        }
    }, []);

    useEffect(() => {
        const audio = new Audio(voiceUrl);
        audioRef.current = audio;

        audio.addEventListener('loadstart', () => setIsLoading(true));
        audio.addEventListener('canplay', () => setIsLoading(false));
        audio.addEventListener('ended', () => {
            setIsPlaying(false);
            setCurrentTime(0);
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        });

        // Coarse fallback
        audio.addEventListener('timeupdate', () => {
            if (!requestRef.current) setCurrentTime(audio.currentTime);
        });

        return () => {
            audio.pause();
            audio.src = '';
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [voiceUrl]);

    useEffect(() => {
        if (isPlaying) {
            requestRef.current = requestAnimationFrame(animate);
        } else {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        }
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [isPlaying, animate]);

    const togglePlay = () => {
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const progress = duration ? (currentTime / duration) * 100 : 0;

    return (
        <div className={`flex items-center gap-3 p-2.5 bg-primary rounded-2xl border border-primary/20 shadow-lg shadow-primary/10 ${className}`}>
            <button
                onClick={togglePlay}
                disabled={isLoading}
                className="w-10 h-10 rounded-full bg-white text-primary hover:scale-105 active:scale-95 transition-all flex items-center justify-center shrink-0 disabled:opacity-50 shadow-md"
            >
                {isLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                ) : isPlaying ? (
                    <Pause size={16} fill="currentColor" />
                ) : (
                    <Play size={16} fill="currentColor" className="ml-0.5" />
                )}
            </button>

            <div className="flex-1 pr-1">
                <div className="h-1 bg-white/20 rounded-full overflow-hidden relative mb-2">
                    <div
                        className="absolute inset-y-0 left-0 bg-white rounded-full transition-all duration-75 ease-linear shadow-[0_0_10px_rgba(255,255,255,0.8)]"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-white">
                    <span>{formatTime(currentTime)}</span>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white/10 rounded-full border border-white/5">
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
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
