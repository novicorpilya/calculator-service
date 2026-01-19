import React, { useState, useMemo } from 'react';
import {
    History,
    FileText,
    ShieldCheck,
    Zap,
    Timer,
    Activity,
    CheckCircle2,
    ChevronDown,
    Package,
    Truck,
    Briefcase,
    AlertCircle,
    CheckCircle,
    X,
    Archive
} from 'lucide-react';
import { type Calculation, type CalculationStatus } from '../../../dashboard.types';
import { VersionHistoryModal } from './VersionHistoryModal';
import { ProjectTimeline } from './ProjectTimeline';
import { toast } from 'sonner';
import { useServices } from '@/app/di/ServiceContainer';
import { generateInvoicePDF, generateProposalPDF } from '../../../utils/pdfInvoiceGenerator';
import { CalculationEntity } from '@/core/domain/CalculationEntity';

interface ManagerProjectToolsProps {
    calculation: Calculation;
    onUpdateStatus: (id: string | number, status: CalculationStatus, additional?: Partial<Calculation>) => void;
    onAssign?: (id: string | number) => void;
    isAuditMode: boolean;
    setIsAuditMode: (val: boolean) => void;
    onDelete?: (id: string | number) => void;
    onEdit?: (calc: Calculation) => void;
    userId: string;
    userRole?: string; // Добавили роль для проверки
}

export const ManagerProjectTools: React.FC<ManagerProjectToolsProps> = ({
    calculation,
    onUpdateStatus,
    onAssign,
    isAuditMode,
    setIsAuditMode,
    onDelete,
    userId,
    userRole
}) => {
    const { versionService, documentService } = useServices();
    const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
    const [isTimelineOpen, setIsTimelineOpen] = useState(false);
    const [showValidationDetails, setShowValidationDetails] = useState(false);
    const [generatingDoc, setGeneratingDoc] = useState<string | null>(null);

    const entity = useMemo(() => new CalculationEntity(calculation), [calculation]);
    const report = useMemo(() => entity.getValidationReport(), [entity]);
    const deadline = entity.slaDeadline;
    const isOverdue = deadline && deadline < new Date();

    const currentStatus = calculation.status;
    const isAssigned = entity.isAssignedTo(userId);
    const isAdmin = userRole === 'admin';

    const handleCreateSnapshot = async () => {
        const res = await versionService.createSnapshot(
            String(calculation.id),
            calculation.results as unknown as Record<string, unknown>,
            'Ручной снимок перед обновлением статуса'
        );
        if (res.success) {
            toast.success('Снимок создан');
        } else {
            toast.error('Ошибка создания');
        }
    };

    const handleGenerateDoc = async (type: 'kp' | 'invoice') => {
        setGeneratingDoc(type);
        try {
            if (type === 'invoice') {
                await generateInvoicePDF(entity);
            } else {
                await generateProposalPDF(entity);
            }

            const res = await documentService.registerDocument({
                calculation_id: String(calculation.id),
                type,
                file_name: `${type.toUpperCase()}_${calculation.project_number}.pdf`,
                file_path: `/storage/docs/${type}/${calculation.id}.pdf`,
                metadata: { generatedAt: new Date().toISOString() }
            });

            if (res.success) {
                toast.success(`${type.toUpperCase()} готов`);
            }
        } catch (error) {
            console.error('PDF Generation Error', error);
            toast.error(`Ошибка PDF`);
        }
        setGeneratingDoc(null);
    };

    const statusColors = {
        success: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
        warning: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
        error: 'text-red-500 bg-red-500/10 border-red-500/20',
    };

    return (
        <div className="flex flex-col gap-4 w-full sticky top-4 animate-in fade-in slide-in-from-right-4 duration-500">
            {/* --- COMPACT STATUS BAR --- */}
            <div className="grid grid-cols-2 gap-3">
                <div className={`p-4 rounded-3xl border bg-card/40 backdrop-blur-sm relative overflow-hidden transition-all ${isOverdue ? 'border-red-500/30 ring-1 ring-red-500/10' : 'border-border-theme'}`}>
                    <div className="flex items-center gap-2 mb-2">
                        <Timer size={14} className={isOverdue ? 'text-red-500 animate-pulse' : 'text-primary'} />
                        <span className="text-[9px] font-black uppercase tracking-widest text-foreground/40">SLA</span>
                    </div>
                    <p className={`text-xs font-black uppercase italic ${isOverdue ? 'text-red-500' : 'text-emerald-500'}`}>
                        {isOverdue ? 'Истек' : 'Ок'}
                    </p>
                </div>

                <div className="p-4 rounded-3xl border border-border-theme bg-card/40 backdrop-blur-sm relative overflow-hidden">
                    <div className="flex items-center gap-2 mb-2">
                        <ShieldCheck size={14} className="text-indigo-500" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-foreground/40">Аудит</span>
                    </div>
                    <p className={`text-xs font-black italic ${statusColors[report.status].split(' ')[0]}`}>
                        {report.score}%
                    </p>
                </div>
            </div>

            {/* --- CORE LIFECYCLE ACTIONS --- */}
            <div className="glass-card !p-5 space-y-4">
                <div className="flex items-center justify-between">
                    <p className="text-[9px] font-black uppercase tracking-widest text-foreground/30 italic">Этап проекта</p>
                    {report.messages.length > 0 && (
                        <button
                            onClick={() => setShowValidationDetails(!showValidationDetails)}
                            className="flex items-center gap-1.5 text-[8px] font-black uppercase text-amber-500 hover:text-amber-500/80 transition-all bg-amber-500/5 px-2 py-1 rounded-full border border-amber-500/10"
                        >
                            <ShieldCheck size={10} />
                            <span>Замечаний: {report.messages.length}</span>
                        </button>
                    )}
                </div>

                <div className="flex flex-col gap-2">
                    {/* 1. Assignment */}
                    {entity.canBeAssigned() && onAssign && (
                        <button
                            onClick={() => onAssign(calculation.id)}
                            className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl bg-primary text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-primary/20 transition-all active:scale-95"
                        >
                            <Briefcase size={16} />
                            <span>Принять в работу</span>
                        </button>
                    )}

                    {isAssigned && (
                        <div className="space-y-2">
                            {/* Expert Mode */}
                            {entity.canManageInventory() && (
                                <button
                                    onClick={() => setIsAuditMode(!isAuditMode)}
                                    className={`w-full flex items-center justify-between p-4 rounded-2xl border font-black text-[10px] uppercase tracking-widest transition-all ${isAuditMode ? 'bg-primary/10 border-primary text-primary shadow-[0_0_20px_rgba(var(--primary),0.1)]' : 'bg-card border-border-theme hover:border-primary/40'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <ShieldCheck size={16} />
                                        <span>{isAuditMode ? 'Стоп Аудит' : 'Аудит сметы'}</span>
                                    </div>
                                    {isAuditMode && <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
                                </button>
                            )}

                            {/* Transitions */}
                            <div className="pt-2 flex flex-col gap-2">
                                {entity.canRequestChanges() && (
                                    <button
                                        onClick={() => onUpdateStatus(calculation.id, 'changes')}
                                        className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-orange-500/10 text-orange-500 border border-orange-500/20 font-black text-[10px] uppercase tracking-widest hover:bg-orange-500/20 transition-all"
                                    >
                                        <AlertCircle size={16} />
                                        <span>На доработку</span>
                                    </button>
                                )}

                                {entity.canMoveToInvoice() && (
                                    <button
                                        disabled={!report.isValid || currentStatus === 'changes'}
                                        onClick={() => onUpdateStatus(calculation.id, 'invoice')}
                                        className={`w-full flex items-center gap-3 p-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${currentStatus === 'changes'
                                            ? 'bg-foreground/5 text-foreground/30 cursor-not-allowed border border-foreground/10'
                                            : 'bg-emerald-500 text-white hover:shadow-lg hover:shadow-emerald-500/20 disabled:opacity-50'
                                            }`}
                                    >
                                        {currentStatus === 'changes' ? <Timer size={16} /> : <CheckCircle size={16} />}
                                        <span>{currentStatus === 'changes' ? 'Ждем клиента' : 'Выставить счет'}</span>
                                    </button>
                                )}

                                {entity.isPaymentSent() && (
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => onUpdateStatus(calculation.id, 'paid')}
                                            className="flex items-center justify-center gap-2 p-3.5 rounded-xl bg-emerald-600 text-white font-black text-[9px] uppercase tracking-widest hover:bg-emerald-700 transition-all"
                                        >
                                            <CheckCircle2 size={14} /> Оплата OK
                                        </button>
                                        <button
                                            onClick={() => onUpdateStatus(calculation.id, 'payment_rejected')}
                                            className="flex items-center justify-center gap-2 p-3.5 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 font-black text-[9px] uppercase tracking-widest hover:bg-red-500/20 transition-all"
                                        >
                                            <X size={14} /> Нет
                                        </button>
                                    </div>
                                )}

                                {currentStatus === 'paid' && (
                                    <button
                                        onClick={() => onUpdateStatus(calculation.id, 'processing')}
                                        className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest hover:shadow-lg hover:shadow-blue-500/20 transition-all"
                                    >
                                        <Package size={16} />
                                        <span>Комплектация</span>
                                    </button>
                                )}

                                {currentStatus === 'processing' && (
                                    <button
                                        onClick={() => onUpdateStatus(calculation.id, 'sent_to_warehouse')}
                                        className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-violet-600 text-white font-black text-[10px] uppercase tracking-widest hover:shadow-lg hover:shadow-violet-500/20 transition-all"
                                    >
                                        <Package size={16} />
                                        <span>На склад</span>
                                    </button>
                                )}

                                {currentStatus === 'sent_to_warehouse' && (
                                    <button
                                        onClick={() => onUpdateStatus(calculation.id, 'ready')}
                                        className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest hover:shadow-lg hover:shadow-indigo-500/20 transition-all"
                                    >
                                        <CheckCircle size={16} />
                                        <span>Готов к отгрузке</span>
                                    </button>
                                )}

                                {currentStatus === 'ready' && (
                                    <button
                                        onClick={() => onUpdateStatus(calculation.id, 'shipping')}
                                        className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-amber-600 text-white font-black text-[10px] uppercase tracking-widest hover:shadow-lg hover:shadow-amber-500/20 transition-all"
                                    >
                                        <Truck size={16} />
                                        <span>В доставку</span>
                                    </button>
                                )}

                                {currentStatus === 'shipping' && (
                                    <button
                                        onClick={() => onUpdateStatus(calculation.id, 'completed')}
                                        className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest hover:shadow-lg hover:shadow-emerald-500/20 transition-all"
                                    >
                                        <ShieldCheck size={16} />
                                        <span>Завершить проект</span>
                                    </button>
                                )}

                                {currentStatus === 'completed' && (
                                    <button
                                        onClick={() => onUpdateStatus(calculation.id, 'closed')}
                                        className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all shadow-sm"
                                    >
                                        <Archive size={16} />
                                        <span>Переместить в архив</span>
                                    </button>
                                )}

                                {currentStatus === 'closed' && userRole === 'admin' && (
                                    <button
                                        onClick={() => onUpdateStatus(calculation.id, 'completed')}
                                        className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 font-black text-[10px] uppercase tracking-widest hover:bg-amber-500/20 transition-all shadow-sm"
                                    >
                                        <History size={16} />
                                        <span>Восстановить из архива</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {showValidationDetails && (
                    <div className="p-4 bg-red-500/5 rounded-2xl border border-red-500/10 space-y-2 animate-in slide-in-from-top-2 duration-300">
                        {report.messages.map((msg, i) => (
                            <div key={i} className="flex gap-2 items-start">
                                <div className={`w-1 h-1 rounded-full shrink-0 mt-1.5 ${msg.type === 'error' ? 'bg-red-500' : 'bg-amber-500'}`} />
                                <p className="text-[9px] font-bold text-foreground/50 uppercase leading-relaxed">{msg.text}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* --- UTILITIES GRID --- */}
            <div className="grid grid-cols-2 gap-2">
                <button
                    onClick={handleCreateSnapshot}
                    className="group p-4 rounded-2xl bg-card border border-border-theme hover:border-primary/40 transition-all text-left space-y-2"
                >
                    <History size={14} className="text-primary group-hover:rotate-12 transition-transform" />
                    <p className="text-[8px] font-black text-foreground/40 uppercase tracking-widest leading-none">Snapshot</p>
                </button>

                <button
                    onClick={() => setIsVersionModalOpen(true)}
                    className="group p-4 rounded-2xl bg-card border border-border-theme hover:border-indigo-500/40 transition-all text-left space-y-2"
                >
                    <Zap size={14} className="text-indigo-500 group-hover:-rotate-12 transition-transform" />
                    <p className="text-[8px] font-black text-foreground/40 uppercase tracking-widest leading-none">History</p>
                </button>

                <button
                    disabled={generatingDoc === 'kp'}
                    onClick={() => handleGenerateDoc('kp')}
                    className="group p-4 rounded-2xl bg-card border border-border-theme hover:border-amber-500/40 transition-all text-left space-y-2 disabled:opacity-50"
                >
                    <FileText size={14} className="text-amber-500" />
                    <p className="text-[8px] font-black text-foreground/40 uppercase tracking-widest leading-none italic">КП (PDF)</p>
                </button>

                <button
                    disabled={generatingDoc === 'invoice'}
                    onClick={() => handleGenerateDoc('invoice')}
                    className="group p-4 rounded-2xl bg-card border border-border-theme hover:border-blue-500/40 transition-all text-left space-y-2 disabled:opacity-50"
                >
                    <FileText size={14} className="text-blue-500" />
                    <p className="text-[8px] font-black text-foreground/40 uppercase tracking-widest leading-none italic">Счет (PDF)</p>
                </button>
            </div>

            {/* --- TIMELINE COMPACT --- */}
            <button
                onClick={() => setIsTimelineOpen(!isTimelineOpen)}
                className="flex items-center justify-between w-full py-3 px-4 bg-foreground/[0.02] border border-border-theme rounded-2xl hover:bg-foreground/[0.04] transition-all group"
            >
                <div className="flex items-center gap-2 text-foreground/40 group-hover:text-primary transition-colors">
                    <Activity size={14} />
                    <span className="text-[9px] font-black uppercase tracking-widest">События</span>
                </div>
                <ChevronDown size={14} className={`transition-transform duration-300 text-foreground/20 ${isTimelineOpen ? 'rotate-180' : ''}`} />
            </button>

            {isTimelineOpen && (
                <div className="max-h-60 overflow-y-auto custom-scrollbar p-6 bg-foreground/[0.02] rounded-3xl border border-border-theme animate-in zoom-in-95 duration-300">
                    <ProjectTimeline calculationId={String(calculation.id)} />
                </div>
            )}

            {/* DELETE ONLY FOR ADIMN */}
            {onDelete && isAdmin && (
                <button
                    onClick={() => onDelete(calculation.id)}
                    className="w-full py-3 rounded-xl text-red-500/30 hover:text-red-500 transition-all text-[8px] font-black uppercase tracking-widest"
                >
                    Удалить проект
                </button>
            )}

            <VersionHistoryModal
                calculationId={String(calculation.id)}
                isOpen={isVersionModalOpen}
                onClose={() => setIsVersionModalOpen(false)}
            />
        </div>
    );
};
