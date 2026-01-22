import React, { useState } from 'react';
import { X, Check, History } from 'lucide-react';

interface SnapshotReasonModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => void;
    defaultReason: string;
}

const QUICK_TAGS = [
    { label: 'Оптимизация', icon: '💰' },
    { label: 'Наличие', icon: '📦' },
    { label: 'Просьба клиента', icon: '👤' },
    { label: 'Исправление', icon: '🔧' },
];

export const SnapshotReasonModal: React.FC<SnapshotReasonModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    defaultReason,
}) => {
    const [reason, setReason] = useState(defaultReason);

    if (!isOpen) return null;

    const handleTagClick = (tag: string) => {
        if (reason.startsWith(tag)) return;
        setReason(`${tag}: ${reason}`);
    };

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xl z-[300] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="glass-card max-w-lg w-full p-8 space-y-6 border-primary/20 shadow-3xl">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-primary">
                        <History size={20} />
                        <h3 className="text-xl font-black uppercase tracking-tight">
                            Создание снимка
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/5 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40 italic">
                        Укажите причину изменений для клиента
                    </p>

                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="w-full h-32 p-4 bg-white/[0.03] border border-white/10 rounded-2xl text-sm focus:border-primary/50 focus:ring-0 transition-all resize-none outline-none"
                        placeholder="Например: Заменил расходники на более выгодные аналоги..."
                    />

                    <div className="flex flex-wrap gap-2">
                        {QUICK_TAGS.map((tag) => (
                            <button
                                key={tag.label}
                                onClick={() => handleTagClick(tag.label)}
                                className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:border-primary/40 hover:bg-primary/5 transition-all text-[10px] font-black uppercase tracking-tighter flex items-center gap-1.5"
                            >
                                <span>{tag.icon}</span>
                                {tag.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex gap-3 pt-2">
                    <button
                        onClick={onClose}
                        className="flex-1 py-4 rounded-2xl border border-white/10 font-black text-[10px] uppercase tracking-widest hover:bg-white/5 transition-all"
                    >
                        Отмена
                    </button>
                    <button
                        onClick={() => onConfirm(reason)}
                        className="flex-1 py-4 rounded-2xl bg-primary text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all flex items-center justify-center gap-2"
                    >
                        <Check size={14} />
                        Сохранить
                    </button>
                </div>
            </div>
        </div>
    );
};
