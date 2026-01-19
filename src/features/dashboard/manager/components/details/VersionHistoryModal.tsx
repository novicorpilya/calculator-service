import React, { useEffect, useState } from 'react';
import { useServices } from '@/app/di/ServiceContainer';
import type { CalculationVersion } from '@/features/dashboard/manager/services/version.service';
import { 
    History, 
    X, 
    Download, 
    Copy, 
    AlertCircle 
} from 'lucide-react';
import { toast } from 'sonner';

interface VersionHistoryModalProps {
    calculationId: string;
    isOpen: boolean;
    onClose: () => void;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
    calculationId,
    isOpen,
    onClose,
}) => {
    const { versionService } = useServices();
    const [versions, setVersions] = useState<CalculationVersion[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedVersion, setSelectedVersion] = useState<CalculationVersion | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        
        let cancelled = false;
        
        const loadVersions = async () => {
            setLoading(true);
            const res = await versionService.getVersions(calculationId);
            if (!cancelled) {
                if (res.success) {
                    setVersions(res.data || []);
                } else {
                    toast.error('Ошибка загрузки версий');
                }
                setLoading(false);
            }
        };
        
        loadVersions();
        
        return () => { cancelled = true; };
    }, [isOpen, calculationId, versionService]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xl z-[200] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
            <div className="glass-card max-w-4xl w-full h-[80vh] flex flex-col overflow-hidden !p-0 border-primary/20 shadow-3xl">
                {/* Header */}
                <div className="p-8 border-b border-border-theme flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                            <History size={24} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black uppercase tracking-tight">История версий</h3>
                            <p className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.2em] mt-1">
                                Снимки расчетов и изменений
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-3 hover:bg-foreground/5 rounded-2xl transition-colors text-foreground/40 hover:text-foreground"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* List */}
                    <div className="w-1/3 border-r border-border-theme overflow-y-auto p-4 space-y-2 bg-foreground/[0.02]">
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : versions.length > 0 ? (
                            versions.map((v) => (
                                <button
                                    key={v.id}
                                    onClick={() => setSelectedVersion(v)}
                                    className={`w-full text-left p-4 rounded-2xl transition-all border ${
                                        selectedVersion?.id === v.id 
                                            ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' 
                                            : 'hover:bg-foreground/5 border-transparent'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${selectedVersion?.id === v.id ? 'text-white' : 'text-primary'}`}>
                                            v{v.version_number}
                                        </span>
                                        <span className={`text-[9px] font-bold ${selectedVersion?.id === v.id ? 'text-white/60' : 'text-foreground/30'}`}>
                                            {new Date(v.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-xs font-bold truncate">
                                        {v.change_reason || 'Без описания'}
                                    </p>
                                </button>
                            ))
                        ) : (
                            <div className="text-center py-20 opacity-20">
                                <AlertCircle size={40} className="mx-auto mb-4" />
                                <p className="text-[10px] font-black uppercase tracking-widest">Версии не найдены</p>
                            </div>
                        )}
                    </div>

                    {/* Viewer */}
                    <div className="flex-1 overflow-y-auto p-8">
                        {selectedVersion ? (
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xl font-black uppercase tracking-tight">Версия {selectedVersion.version_number}</h4>
                                    <div className="flex gap-2">
                                        <button className="p-2 bg-foreground/5 rounded-lg hover:bg-primary hover:text-white transition-all">
                                            <Download size={18} />
                                        </button>
                                        <button className="p-2 bg-foreground/5 rounded-lg hover:bg-primary hover:text-white transition-all text-primary">
                                            <Copy size={18} />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="p-6 bg-foreground/[0.03] rounded-3xl border border-border-theme">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-foreground/30 mb-4">Данные снимка</p>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <p className="text-[9px] font-black text-foreground/30 uppercase tracking-[0.2em]">Всего позиций</p>
                                                <p className="text-lg font-black">{selectedVersion.snapshot_data?.summary?.length || 0}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[9px] font-black text-foreground/30 uppercase tracking-[0.2em]">Итоговый бюджет</p>
                                                <p className="text-lg font-black text-primary">₽ {selectedVersion.snapshot_data?.totalAnnualBudget?.toLocaleString() || 0}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Summary Table Simplified */}
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-foreground/30">Краткий состав</p>
                                        <div className="space-y-2">
                                            {selectedVersion.snapshot_data?.summary?.slice(0, 5).map((item: { inventory?: string; quantity?: number }, i: number) => (
                                                <div key={i} className="flex items-center justify-between p-3 bg-foreground/[0.02] rounded-xl border border-border-theme/40 text-[11px]">
                                                    <span className="font-bold truncate max-w-[200px]">{item.inventory}</span>
                                                    <span className="font-black text-foreground/40">{item.quantity} шт.</span>
                                                </div>
                                            ))}
                                            {(selectedVersion.snapshot_data?.summary?.length || 0) > 5 && (
                                                <p className="text-center text-[9px] font-bold text-foreground/20 italic">
                                                    + еще {(selectedVersion.snapshot_data?.summary?.length || 0) - 5} поз.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                                <History size={80} className="mb-6" />
                                <h4 className="text-lg font-black uppercase tracking-widest">Выберите версию</h4>
                                <p className="text-sm mt-2">для просмотра подробностей</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
