import React, { useEffect, useRef } from 'react';
import { Copy, Trash2, Edit2, Reply } from 'lucide-react';

interface MessageContextMenuProps {
    x: number;
    y: number;
    onClose: () => void;
    onCopy: () => void;
    onDelete: () => void;
    onEdit: () => void;
    onReply: () => void;
    isOwn: boolean;
    canEdit: boolean;
    canCopy: boolean;
}

export const MessageContextMenu: React.FC<MessageContextMenuProps> = ({
    x,
    y,
    onClose,
    onCopy,
    onDelete,
    onEdit,
    onReply,
    isOwn,
    canEdit,
    canCopy,
}) => {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    // Adjust position if menu goes off screen
    const menuWidth = 200;
    const menuHeight = 180;
    const padding = 10;

    let posX = x;
    let posY = y;

    if (x + menuWidth > window.innerWidth - padding) {
        posX = x - menuWidth;
    }
    if (y + menuHeight > window.innerHeight - padding) {
        posY = y - menuHeight;
    }

    return (
        <div
            ref={menuRef}
            className="fixed z-[999] bg-card/80 backdrop-blur-xl border border-border-theme rounded-2xl shadow-2xl overflow-hidden min-w-[180px] animate-in zoom-in-95 duration-200"
            style={{ left: posX, top: posY }}
        >
            <div className="flex flex-col p-1.5">
                <button
                    onClick={() => {
                        onReply();
                        onClose();
                    }}
                    className="flex items-center gap-3 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-foreground/70 hover:text-primary hover:bg-primary/5 rounded-xl transition-all group"
                >
                    <Reply size={16} className="group-hover:scale-110 transition-transform" />
                    Ответить
                </button>
                
                {canCopy && (
                    <button
                        onClick={() => {
                            onCopy();
                            onClose();
                        }}
                        className="flex items-center gap-3 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-foreground/70 hover:text-primary hover:bg-primary/5 rounded-xl transition-all group"
                    >
                        <Copy size={16} className="group-hover:scale-110 transition-transform" />
                        Копировать
                    </button>
                )}

                {isOwn && canEdit && (
                    <button
                        onClick={() => {
                            onEdit();
                            onClose();
                        }}
                        className="flex items-center gap-3 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-foreground/70 hover:text-primary hover:bg-primary/5 rounded-xl transition-all group"
                    >
                        <Edit2 size={16} className="group-hover:scale-110 transition-transform" />
                        Изменить
                    </button>
                )}

                {isOwn && (
                    <>
                        {canEdit && <div className="h-px bg-border-theme my-1 mx-2" />}
                        
                        <button
                            onClick={() => {
                                onDelete();
                                onClose();
                            }}
                            className="flex items-center gap-3 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500/5 rounded-xl transition-all group"
                        >
                            <Trash2 size={16} className="group-hover:scale-110 transition-transform" />
                            Удалить
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};
