import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export const ConnectivityBanner: React.FC = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isVisible, setIsVisible] = useState(!navigator.onLine);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            setTimeout(() => setIsVisible(false), 3000); // Hide after 3s when back online
        };
        const handleOffline = () => {
            setIsOnline(false);
            setIsVisible(true);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (!isVisible) return null;

    return (
        <div 
            className={`fixed top-0 left-0 right-0 z-[9999] transition-all duration-500 overflow-hidden ${
                isOnline ? 'bg-emerald-500 h-8' : 'bg-red-500 h-8'
            }`}
        >
            <div className="flex items-center justify-center gap-2 h-full text-white text-[10px] font-black uppercase tracking-widest">
                {isOnline ? (
                    <>
                        <Wifi className="w-3 h-3" />
                        Соединение восстановлено
                    </>
                ) : (
                    <>
                        <WifiOff className="w-3 h-3" />
                        Вы работаете в офлайн-режиме
                    </>
                )}
            </div>
        </div>
    );
};
