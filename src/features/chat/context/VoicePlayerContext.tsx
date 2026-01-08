import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

interface VoicePlayerContextType {
    currentPlayingId: string | null;
    play: (id: string, audio: HTMLAudioElement) => void;
    pause: (id: string) => void;
    register: (id: string, stopFn: () => void) => void;
    unregister: (id: string) => void;
}

const VoicePlayerContext = createContext<VoicePlayerContextType | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export const useVoicePlayer = () => {
    const context = useContext(VoicePlayerContext);
    if (!context) {
        throw new Error('useVoicePlayer must be used within a VoicePlayerProvider');
    }
    return context;
};

export const VoicePlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);
    const currentPlayingIdRef = useRef<string | null>(null); // Ref for stable callbacks
    const stopFns = useRef<Map<string, () => void>>(new Map());

    // Sync ref with state
    useEffect(() => {
        currentPlayingIdRef.current = currentPlayingId;
    }, [currentPlayingId]);

    const register = useCallback((id: string, stopFn: () => void) => {
        console.log('[AudioContext] Registering:', id);
        stopFns.current.set(id, stopFn);
    }, []);

    const unregister = useCallback((id: string) => {
        console.log('[AudioContext] Unregistering:', id);
        stopFns.current.delete(id);
        // Use ref to avoid dependency on state
        if (currentPlayingIdRef.current === id) {
            setCurrentPlayingId(null);
        }
    }, []); // Stable callback!

    const play = useCallback((id: string, audio: HTMLAudioElement) => {
        console.log('[AudioContext] Play request:', id, 'Current:', currentPlayingIdRef.current);

        // If another audio is playing, stop it
        if (currentPlayingIdRef.current && currentPlayingIdRef.current !== id) {
            console.log('[AudioContext] Stopping previous:', currentPlayingIdRef.current);
            const stopFn = stopFns.current.get(currentPlayingIdRef.current);
            if (stopFn) stopFn();
        }

        setCurrentPlayingId(id);
        audio.play()
            .then(() => console.log('[AudioContext] Audio started:', id))
            .catch(e => console.error("[AudioContext] Playback failed:", e));
    }, []); // Stable callback!

    const pause = useCallback((id: string) => {
        console.log('[AudioContext] Pause request:', id);
        if (currentPlayingIdRef.current === id) {
            setCurrentPlayingId(null);
        }
    }, []); // Stable callback!

    return (
        <VoicePlayerContext.Provider value={{ currentPlayingId, play, pause, register, unregister }}>
            {children}
        </VoicePlayerContext.Provider>
    );
};
