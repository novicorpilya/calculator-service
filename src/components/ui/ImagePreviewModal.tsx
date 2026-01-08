import React, { useEffect, useState } from 'react';
import { X, Download, Maximize2, ZoomIn, ZoomOut } from 'lucide-react';

interface ImagePreviewModalProps {
    imageUrl: string;
    onClose: () => void;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({ imageUrl, onClose }) => {
    const [zoom, setZoom] = useState(1);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), 10);
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('keydown', handleEsc);
        };
    }, [onClose]);

    const handleDownload = async () => {
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `image_${Date.now()}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch {
            window.open(imageUrl, '_blank');
        }
    };

    return (
        <div className={`fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-10 transition-all duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/95 backdrop-blur-sm cursor-zoom-out"
                onClick={onClose}
            />

            {/* Controls */}
            <div className="absolute top-6 right-6 flex items-center gap-3 z-10">
                <div className="flex items-center gap-1 bg-white/10 backdrop-blur-md rounded-full p-1 border border-white/10">
                    <button
                        onClick={() => setZoom(prev => Math.max(0.5, prev - 0.25))}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white"
                    >
                        <ZoomOut size={18} />
                    </button>
                    <span className="text-[10px] font-black text-white/50 w-12 text-center uppercase tracking-widest">
                        {Math.round(zoom * 100)}%
                    </span>
                    <button
                        onClick={() => setZoom(prev => Math.min(3, prev + 0.25))}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white"
                    >
                        <ZoomIn size={18} />
                    </button>
                </div>

                <button
                    onClick={handleDownload}
                    className="p-3 bg-white/10 backdrop-blur-md hover:bg-white/20 rounded-full transition-all text-white border border-white/10"
                    title="Скачать"
                >
                    <Download size={20} />
                </button>

                <button
                    onClick={onClose}
                    className="p-3 bg-white/10 backdrop-blur-md hover:bg-primary rounded-full transition-all text-white border border-white/10"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Image Container */}
            <div
                className="relative max-w-full max-h-full transition-transform duration-300 ease-out flex items-center justify-center"
                style={{ transform: `scale(${zoom})` }}
            >
                <img
                    src={imageUrl}
                    alt="Preview"
                    className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-500"
                />
            </div>

            {/* Bottom info */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 bg-white/5 backdrop-blur-md rounded-full border border-white/5">
                <div className="flex items-center gap-3">
                    <Maximize2 size={14} className="text-primary" />
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Режим предпросмотра HoReCa Hub</p>
                </div>
            </div>
        </div>
    );
};
