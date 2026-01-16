import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface ChatImageProps {
    src: string;
    altText?: string;
    onImageClick?: () => void;
    className?: string;
    footer?: React.ReactNode;
    onReady?: () => void;
    isTemp?: boolean;
}

export const ChatImage: React.FC<ChatImageProps> = ({
    src,
    altText,
    onImageClick,
    className = '',
    footer,
    onReady,
    isTemp = false
}) => {
    const [currentSrc, setCurrentSrc] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!src) return;

        // Start loading new image, but keep showing old one if exists (via currentSrc state persistance across renders if key is stable)
        // If key changes, this state resets, so stable key is crucial.
        
        const img = new Image();
        img.src = src;
        
        const handleLoad = () => {
            setCurrentSrc(src);
            setIsLoading(false);
            onReady?.();
        };

        img.onload = handleLoad;

        if (img.complete) {
            handleLoad();
        }
    }, [src, onReady]);

    // Show skeleton only if we have NO image to show at all
    if (!currentSrc && isLoading) {
        return (
            <div 
                className={`relative flex items-center justify-center bg-muted/20 rounded-lg ${className}`}
                style={{ 
                    minWidth: '200px', 
                    maxWidth: '430px', 
                    aspectRatio: '16/10' 
                }}
            >
                <Loader2 className="w-8 h-8 text-primary/50 animate-spin" />
            </div>
        );
    }

    return (
        <div 
            className={`relative overflow-hidden animate-in fade-in zoom-in-95 duration-500 ${className}`}
            style={{ 
                minWidth: '200px', 
                maxWidth: '430px', 
                aspectRatio: '16/10' 
            }}
            onClick={onImageClick}
        >
            <img
                src={currentSrc || src}
                alt={altText || 'Изображение'}
                className={`w-full h-full object-cover block cursor-pointer ${isTemp ? 'blur-sm' : ''} transition-opacity duration-300`}
                decoding="async"
            />
            {footer && (
                <div className="absolute bottom-0 left-0 right-0 z-10 px-3 py-2 bg-gradient-to-t from-black/60 to-transparent">
                    {footer}
                </div>
            )}
        </div>
    );
};
