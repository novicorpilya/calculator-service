import React, { Suspense, lazy } from 'react';
import type { EmojiClickData, Theme } from 'emoji-picker-react';

// Lazy load the picker so it doesn't inflate the initial bundle size
const EmojiPicker = lazy(() => import('emoji-picker-react'));

interface TelegramEmojiPickerProps {
    onEmojiClick: (emoji: string) => void;
    onClose?: () => void;
}

export const TelegramEmojiPicker: React.FC<TelegramEmojiPickerProps> = ({ onEmojiClick }) => {
    // Handler adapter: library passes an object, we just need the emoji char
    const handleEmojiClick = (emojiData: EmojiClickData) => {
        onEmojiClick(emojiData.emoji);
    };

    return (
        <div className="relative animate-in zoom-in-95 slide-in-from-bottom-2 duration-200 shadow-2xl rounded-[1.5rem] overflow-hidden border border-border-theme">
            <Suspense fallback={
                <div className="w-[300px] h-[400px] bg-[#171717] flex items-center justify-center text-white/20">
                    Загрузка...
                </div>
            }>
                <EmojiPicker
                    onEmojiClick={handleEmojiClick}
                    theme={'dark' as Theme}
                    lazyLoadEmojis={true}
                    skinTonesDisabled={false}
                    searchPlaceHolder="Поиск..."
                    width={320}
                    height={400}
                    previewConfig={{
                        showPreview: false // Telegram style usually doesn't show the big preview at bottom
                    }}
                    style={{
                        backgroundColor: '#171717',
                        border: 'none',
                    }}
                />
            </Suspense>
        </div>
    );
};
