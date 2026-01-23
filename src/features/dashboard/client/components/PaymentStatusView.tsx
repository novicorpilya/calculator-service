import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
    Clock,
    CheckCircle2,
    AlertTriangle,
    FileText,
    Download,
    Loader2,
    Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import { type Calculation } from '../../dashboard.types';
import { generateInvoicePDF } from '../../utils/pdfInvoiceGenerator';
import { CalculationEntity } from '@/core/domain/CalculationEntity';
import { useServices } from '@/app/di/ServiceContainer';
import { logger } from '@/core/logging/index';

type PaymentStatus = 'awaiting_payment' | 'receipt_uploaded' | 'overdue' | 'confirmed' | 'rejected';

interface PaymentStatusViewProps {
    calculation: Calculation;
    onUploadReceipt: (file: File) => Promise<void>;
    userRole?: 'client' | 'manager' | 'admin';
}

const STATUS_CONFIG: Record<
    PaymentStatus,
    {
        label: string;
        color: string;
        bgColor: string;
        icon: React.ElementType;
    }
> = {
    awaiting_payment: {
        label: 'Ожидает оплаты',
        color: 'text-amber-600 dark:text-amber-400',
        bgColor: 'bg-amber-500/10 border-amber-500/20',
        icon: Clock,
    },
    receipt_uploaded: {
        label: 'Чек на проверке',
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-500/10 border-blue-500/20',
        icon: Loader2,
    },
    overdue: {
        label: 'Срок оплаты истёк',
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-500/10 border-red-500/20',
        icon: AlertTriangle,
    },
    rejected: {
        label: 'Оплата отклонена',
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-500/15 border-red-500/30',
        icon: AlertTriangle,
    },
    confirmed: {
        label: 'Оплата подтверждена',
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-emerald-500/10 border-emerald-500/20',
        icon: CheckCircle2,
    },
};

export const PaymentStatusView: React.FC<PaymentStatusViewProps> = ({
    calculation,
    onUploadReceipt,
    userRole = 'client',
}) => {
    const { calculationService } = useServices();
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const entity = useMemo(() => new CalculationEntity(calculation), [calculation]);
    const { id, status, receipt_path } = calculation;
    const totalCost = entity.totalCost;

    const handleDownloadReceipt = useCallback(async () => {
        if (!receipt_path) return;
        try {
            const res = await calculationService.getSignedReceiptUrl(receipt_path);
            if (res.success && res.data) window.open(res.data, '_blank');
        } catch (error) {
            logger.error('Failed to get signed URL', error);
        }
    }, [receipt_path, calculationService]);

    const getPaymentStatus = (): PaymentStatus => {
        if (['paid', 'processing', 'ready', 'shipping', 'completed'].includes(status))
            return 'confirmed';
        if (status === 'payment_review') return 'receipt_uploaded';
        if (status === 'payment_rejected') return 'rejected';
        return 'awaiting_payment';
    };

    const paymentStatus = getPaymentStatus();
    const config = STATUS_CONFIG[paymentStatus];
    const StatusIcon = config.icon;

    const invoiceNumber = `И-${String(id).slice(0, 8).toUpperCase()}`;
    const paymentDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const handleFileSelect = useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setIsUploading(true);
            try {
                await onUploadReceipt(file);
                toast.success('Чек отправлен на проверку');
            } catch {
                toast.error('Ошибка загрузки');
            } finally {
                setIsUploading(false);
            }
        },
        [onUploadReceipt]
    );

    return (
        <div className="w-full animate-in fade-in slide-in-from-top-4 duration-500 space-y-3">
            {/* COMPACT HORIZONTAL BANNER */}
            <div
                className={`p-4 rounded-[2rem] border flex flex-col lg:flex-row lg:items-center justify-between gap-6 transition-all ${config.bgColor}`}
            >
                <div className="flex items-center gap-5">
                    <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 bg-background/50 backdrop-blur-sm border border-border-theme/10 ${config.color}`}
                    >
                        <StatusIcon
                            size={24}
                            className={paymentStatus === 'receipt_uploaded' ? 'animate-spin' : ''}
                        />
                    </div>

                    <div>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black uppercase tracking-widest text-foreground/40 leading-none italic">
                                Счёт {invoiceNumber}
                            </span>
                            <span
                                className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter text-white ${paymentStatus === 'confirmed' ? 'bg-emerald-500' : paymentStatus === 'rejected' || paymentStatus === 'overdue' ? 'bg-red-500' : 'bg-amber-500'}`}
                            >
                                {config.label}
                            </span>
                        </div>
                        <p className="text-2xl font-[1000] text-foreground mt-1 italic tracking-tighter">
                            {totalCost?.toLocaleString('ru-RU')} ₽
                        </p>
                    </div>

                    {paymentStatus === 'awaiting_payment' && (
                        <div className="hidden md:block h-10 w-px bg-foreground/10 mx-2" />
                    )}

                    {paymentStatus === 'awaiting_payment' && (
                        <div className="hidden md:flex flex-col justify-center">
                            <p className="text-[9px] font-black uppercase tracking-widest text-foreground/50 mb-2">
                                Оплата до{' '}
                                {paymentDeadline.toLocaleDateString('ru-RU', {
                                    day: 'numeric',
                                    month: 'short',
                                })}
                            </p>
                            <div className="h-1 w-32 bg-foreground/5 rounded-full overflow-hidden">
                                <div className="h-full bg-amber-500/50 w-1/3" />
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Actions */}
                    <button
                        onClick={() => generateInvoicePDF(entity)}
                        className="flex-1 md:flex-none flex items-center justify-center shadow-lg gap-2 px-6 py-3 rounded-xl bg-card border border-border-theme hover:border-primary/60 text-[10px] font-black uppercase tracking-widest text-foreground transition-all hover:scale-[1.02] active:scale-95 shadow-primary/5"
                    >
                        <FileText size={16} className="text-primary" />
                        Счёт на оплату
                    </button>

                    {userRole === 'client' &&
                        (paymentStatus === 'awaiting_payment' ||
                            paymentStatus === 'overdue' ||
                            paymentStatus === 'rejected') && (
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="flex-1 md:flex-none flex items-center shadow-md justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-black text-[9px] uppercase tracking-[0.15em] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                            >
                                {isUploading ? (
                                    <Loader2 size={14} className="animate-spin" />
                                ) : (
                                    <Plus size={14} />
                                )}
                                {paymentStatus === 'rejected'
                                    ? 'Загрузить новый чек'
                                    : 'Загрузить чек'}
                            </button>
                        )}

                    {receipt_path && (
                        <button
                            onClick={handleDownloadReceipt}
                            className="flex-1 md:flex-none flex items-center shadow-sm justify-center gap-2 px-5 py-3 rounded-xl bg-card border border-border-theme hover:border-blue-500/40 text-[9px] font-black uppercase tracking-widest text-blue-500 transition-all font-mono"
                        >
                            <Download size={14} /> Чек об оплате
                        </button>
                    )}

                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileSelect}
                    />
                </div>
            </div>
        </div>
    );
};
