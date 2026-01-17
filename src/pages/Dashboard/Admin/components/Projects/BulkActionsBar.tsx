import React from 'react';
import { 
    Trash2, 
    X
} from 'lucide-react';

interface BulkActionsBarProps {
    selectedCount: number;
    onClear: () => void;
    onDelete: () => void;
    onStatusUpdate: (status: string) => void;
}

export const BulkActionsBar: React.FC<BulkActionsBarProps> = ({ 
    selectedCount, 
    onClear, 
    onDelete, 
    onStatusUpdate 
}) => {
    if (selectedCount === 0) return null;

    return (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-8 duration-500">
            <div className="bg-primary px-6 py-4 rounded-[2rem] shadow-2xl flex items-center gap-6 border border-white/20">
                <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Выбрано</span>
                    <span className="text-white font-black leading-none">{selectedCount} объякт(ов)</span>
                </div>

                <div className="h-8 w-px bg-white/20" />

                <div className="flex items-center gap-2">
                    <button 
                        onClick={onDelete}
                        className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all flex items-center gap-2 text-xs font-bold"
                    >
                        <Trash2 size={16} />
                        Удалить
                    </button>
                    
                    <select 
                        onChange={(e) => onStatusUpdate(e.target.value)}
                        className="bg-white/10 hover:bg-white/20 text-white rounded-xl px-4 py-3 text-xs font-bold outline-none border-none cursor-pointer"
                        defaultValue=""
                    >
                        <option value="" disabled className="text-foreground">Сменить статус...</option>
                        <option value="draft" className="text-foreground">Черновик</option>
                        <option value="sent" className="text-foreground">Отправлено</option>
                        <option value="expert" className="text-foreground">Экспертиза</option>
                        <option value="completed" className="text-foreground">Завершено</option>
                    </select>

                    <button 
                        onClick={onClear}
                        className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};
