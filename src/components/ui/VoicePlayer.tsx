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

    useEffect(() => {
        const audio = new Audio(voiceUrl);
        audioRef.current = audio;

        audio.addEventListener('loadstart', () => setIsLoading(true));
        audio.addEventListener('canplay', () => setIsLoading(false));
        audio.addEventListener('timeupdate', () => {
            setCurrentTime(audio.currentTime);
        });
        audio.addEventListener('ended', () => {
            setIsPlaying(false);
            setCurrentTime(0);
        });

        return () => {
            audio.pause();
            audio.src = '';
        };
    }, [voiceUrl]);

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
        <div className={`flex items-center gap-3 p-3 bg-primary/5 rounded-2xl border border-primary/20 ${className}`}>
            <button
                onClick={togglePlay}
                disabled={isLoading}
                className="w-12 h-12 rounded-full bg-primary text-white hover:bg-primary/90 transition-all flex items-center justify-center shrink-0 disabled:opacity-50 shadow-lg"
            >
                {isLoading ? (
                    <Loader2 size={20} className="animate-spin" />
                ) : isPlaying ? (
                    <Pause size={20} fill="currentColor" />
                ) : (
                    <Play size={20} fill="currentColor" className="ml-0.5" />
                )}
            </button>

            <div className="flex-1 space-y-2">
                <div className="h-2 bg-foreground/10 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-white transition-all duration-100 rounded-full shadow-sm"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-foreground/60">
                    <span>{formatTime(currentTime)}</span>
                    <div className="flex items-center gap-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
