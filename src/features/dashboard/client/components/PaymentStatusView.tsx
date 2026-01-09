import React, { useState, useCallback, useRef } from 'react';
import {
    Clock, CheckCircle2, AlertTriangle, Upload, Copy, FileText,
    Download, MessageSquare, X, Loader2, File, ChevronDown, ChevronUp, RefreshCcw
} from 'lucide-react';
import { toast } from 'sonner';
import { type Calculation, COMPANY_REQUISITES } from '../../dashboard.types';
import { generateInvoicePDF } from '../../utils/pdfInvoiceGenerator';
import { CalculationEntity } from '@/core/domain/CalculationEntity';
import { useServices } from '@/core/di/ServiceContainer';

type PaymentStatus = 'awaiting_payment' | 'receipt_uploaded' | 'overdue' | 'confirmed';

interface PaymentStatusViewProps {
    calculation: Calculation;
    onUploadReceipt: (file: File) => Promise<void>;
    onContactManager?: () => void;
    userRole?: 'client' | 'manager' | 'admin';
}

// Status configuration
const STATUS_CONFIG: Record<PaymentStatus, {
    label: string;
    color: string;
    bgColor: string;
    icon: React.ElementType;
}> = {
    awaiting_payment: {
        label: 'Ожидает оплаты',
        color: 'text-amber-600',
        bgColor: 'bg-amber-50 border-amber-200',
        icon: Clock
    },
    receipt_uploaded: {
        label: 'Чек на проверке',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50 border-blue-200',
        icon: Loader2
    },
    overdue: {
        label: 'Срок оплаты истёк',
        color: 'text-red-600',
        bgColor: 'bg-red-50 border-red-200',
        icon: AlertTriangle
    },
    confirmed: {
        label: 'Оплата подтверждена',
        color: 'text-green-600',
        bgColor: 'bg-green-50 border-green-200',
        icon: CheckCircle2
    }
};

export const PaymentStatusView: React.FC<PaymentStatusViewProps> = ({
    calculation,
    onUploadReceipt,
    onContactManager,
    userRole = 'client'
}) => {
    const { calculationService } = useServices();
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [showRequisites, setShowRequisites] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { id, totalCost, status, receipt_path } = calculation;

    const handleDownloadReceipt = useCallback(async () => {
        if (!receipt_path) return;

        try {
            const url = await calculationService.getSignedReceiptUrl(receipt_path);
            window.open(url, '_blank');
        } catch {
            toast.error('Ошибка при получении ссылки на файл');
        }
    }, [receipt_path, calculationService]);

    // Determine payment status based on calculation status
    const getPaymentStatus = (): PaymentStatus => {
        if (status === 'paid' || status === 'processing' || status === 'ready' || status === 'shipping' || status === 'completed') {
            return 'confirmed';
        }
        if (status === 'payment_review') {
            return 'receipt_uploaded';
        }
        // Check if overdue (mock: assume deadline is 7 days from now for demo)
        // In real app, you'd check calculation.paymentDeadline
        return 'awaiting_payment';
    };

    const paymentStatus = getPaymentStatus();
    const config = STATUS_CONFIG[paymentStatus];
    const StatusIcon = config.icon;

    // Invoice details
    const invoiceNumber = `И-${String(id).slice(0, 8).toUpperCase()}`;
    const invoiceDate = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
    const paymentDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Mock: 7 days from now
    const daysRemaining = Math.ceil((paymentDeadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    const paymentPurpose = `Оплата по счету ${invoiceNumber} от ${invoiceDate}, без НДС`;

    // Copy handlers
    const handleCopyAll = useCallback(() => {
        const text = `Получатель: ${COMPANY_REQUISITES.name}
ИНН: ${COMPANY_REQUISITES.inn}
КПП: ${COMPANY_REQUISITES.kpp}
Расчётный счёт: ${COMPANY_REQUISITES.account}
Банк: ${COMPANY_REQUISITES.bank}
БИК: ${COMPANY_REQUISITES.bik}
Корр. счёт: ${COMPANY_REQUISITES.corrAccount}
Назначение: ${paymentPurpose}`;
        navigator.clipboard.writeText(text);
        toast.success('Все реквизиты скопированы');
    }, [paymentPurpose]);

    const handleCopyPurpose = useCallback(() => {
        navigator.clipboard.writeText(paymentPurpose);
        toast.success('Назначение платежа скопировано');
    }, [paymentPurpose]);

    // File upload handlers
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback(() => {
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    }, []);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    }, []);

    const handleFile = async (file: File) => {
        const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
        const maxSize = 10 * 1024 * 1024; // 10MB

        if (!validTypes.includes(file.type)) {
            toast.error('Неверный формат файла. Загрузите PDF, JPG или PNG');
            return;
        }

        if (file.size > maxSize) {
            toast.error('Файл слишком большой. Максимум 10 МБ');
            return;
        }

        setUploadedFile(file);
        setIsUploading(true);

        try {
            await onUploadReceipt(file);
            toast.success('Чек загружен! Мы проверим его в течение 1 рабочего дня');
        } catch {
            toast.error('Ошибка загрузки. Попробуйте ещё раз');
            setUploadedFile(null);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDownloadPDF = useCallback(() => {
        const entity = new CalculationEntity(calculation);
        generateInvoicePDF(entity);
    }, [calculation]);

    const handleRemoveFile = useCallback(() => {
        setUploadedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, []);

    const handleReplaceFile = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        handleRemoveFile();
        setTimeout(() => {
            fileInputRef.current?.click();
        }, 100);
    }, [handleRemoveFile]);

    return (
        <div className="max-w-2xl mx-auto">
            {/* Header with Invoice Number */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-medium text-foreground/60">
                    Счёт {invoiceNumber}
                </h2>
            </div>

            {/* Status Hero Block */}
            <div className={`rounded-2xl border-2 p-8 mb-6 ${config.bgColor}`}>
                {/* Status Badge */}
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium mb-6 ${config.color} bg-white/80`}>
                    <StatusIcon size={16} className={paymentStatus === 'receipt_uploaded' ? 'animate-spin' : ''} />
                    {config.label}
                </div>

                {/* Amount */}
                <div className="text-center mb-6">
                    <p className="text-5xl font-black text-foreground tracking-tight">
                        {totalCost?.toLocaleString('ru-RU')} ₽
                    </p>
                </div>

                {/* Deadline Progress (only for awaiting_payment) */}
                {paymentStatus === 'awaiting_payment' && (
                    <div className="text-center">
                        <p className="text-foreground/60 mb-2">
                            Оплатить до {paymentDeadline.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                        <div className="flex items-center justify-center gap-3">
                            <div className="flex-1 max-w-xs h-2 bg-white/60 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-amber-500 rounded-full transition-all"
                                    style={{ width: `${Math.max(0, Math.min(100, ((7 - daysRemaining) / 7) * 100))}%` }}
                                />
                            </div>
                            <span className="text-sm font-medium text-foreground/80">
                                осталось {daysRemaining} {daysRemaining === 1 ? 'день' : daysRemaining < 5 ? 'дня' : 'дней'}
                            </span>
                        </div>
                    </div>
                )}

                {/* Receipt Uploaded Message */}
                {paymentStatus === 'receipt_uploaded' && (
                    <p className="text-center text-foreground/70">
                        Мы проверяем ваш платёж. Обычно это занимает до 1 рабочего дня.<br />
                        Мы уведомим вас, когда оплата будет подтверждена.
                    </p>
                )}

                {/* Rejected Message (if in invoice status but has receipt_path) */}
                {status === 'invoice' && receipt_path && (
                    <div className="flex flex-col items-center animate-in fade-in slide-in-from-top-2">
                        <p className="text-center text-red-600 font-bold mb-2">
                            Оплата не принята
                        </p>
                        <p className="text-center text-foreground/70 text-sm">
                            Менеджер не смог подтвердить ваш платёж.<br />
                            Пожалуйста, проверьте реквизиты и загрузите корректный чек.
                        </p>
                    </div>
                )}

                {/* Confirmed Message */}
                {paymentStatus === 'confirmed' && (
                    <p className="text-center text-foreground/70">
                        Спасибо! Оплата получена.<br />
                        Мы начали подготовку вашего заказа.
                    </p>
                )}

                {/* Overdue Warning */}
                {paymentStatus === 'overdue' && (
                    <div className="text-center">
                        <p className="text-foreground/70 mb-4">
                            Если вы уже оплатили — загрузите чек.<br />
                            Если нет — свяжитесь с вашим менеджером для продления срока.
                        </p>
                        {onContactManager && (
                            <button
                                onClick={onContactManager}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-foreground rounded-xl hover:bg-foreground/5 transition-colors border border-foreground/10"
                            >
                                <MessageSquare size={16} />
                                Написать менеджеру
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Requisites Section - Only for Client */}
            {userRole === 'client' && (paymentStatus === 'awaiting_payment' || paymentStatus === 'overdue') && (
                <div className="bg-card rounded-2xl border border-border-theme p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-foreground/40">
                            Реквизиты для перевода
                        </h3>
                        <button
                            onClick={handleCopyAll}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/5 rounded-lg transition-colors"
                        >
                            <Copy size={14} />
                            Копировать всё
                        </button>
                    </div>

                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between py-2 border-b border-border-theme">
                            <span className="text-foreground/50">Получатель</span>
                            <span className="font-medium">{COMPANY_REQUISITES.name}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-border-theme">
                            <span className="text-foreground/50">ИНН</span>
                            <span className="font-medium">{COMPANY_REQUISITES.inn}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-border-theme">
                            <span className="text-foreground/50">Расчётный счёт</span>
                            <span className="font-medium font-mono">{COMPANY_REQUISITES.account}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-border-theme">
                            <span className="text-foreground/50">Банк</span>
                            <span className="font-medium">{COMPANY_REQUISITES.bank}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-border-theme">
                            <span className="text-foreground/50">БИК</span>
                            <span className="font-medium font-mono">{COMPANY_REQUISITES.bik}</span>
                        </div>
                    </div>

                    {/* Payment Purpose */}
                    <div className="mt-6">
                        <p className="text-xs text-foreground/40 mb-2">Назначение платежа:</p>
                        <div
                            onClick={handleCopyPurpose}
                            className="flex items-center justify-between p-4 bg-foreground/5 rounded-xl cursor-pointer hover:bg-foreground/10 transition-colors group"
                        >
                            <p className="text-sm font-medium pr-4">{paymentPurpose}</p>
                            <Copy size={16} className="text-foreground/30 group-hover:text-primary shrink-0" />
                        </div>
                        <p className="text-xs text-foreground/40 mt-2">
                            💡 Укажите это назначение при переводе — так платёж пройдёт быстрее
                        </p>
                    </div>

                    {/* Download PDF */}
                    <button
                        onClick={handleDownloadPDF}
                        className="flex items-center gap-2 mt-6 px-4 py-3 w-full justify-center text-sm font-medium text-foreground/70 hover:text-foreground bg-foreground/5 hover:bg-foreground/10 rounded-xl transition-colors"
                    >
                        <Download size={16} />
                        Скачать счёт PDF
                    </button>
                </div>
            )}

            {/* Collapsed Requisites for receipt_uploaded */}
            {paymentStatus === 'receipt_uploaded' && (
                <div className="bg-card rounded-2xl border border-border-theme mb-6 overflow-hidden">
                    <button
                        onClick={() => setShowRequisites(!showRequisites)}
                        className="flex items-center justify-between w-full p-4 text-left hover:bg-foreground/5 transition-colors"
                    >
                        <span className="text-sm font-medium text-foreground/60">
                            📋 Реквизиты для справки
                        </span>
                        {showRequisites ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    {showRequisites && (
                        <div className="px-4 pb-4 pt-0 text-xs text-foreground/50 space-y-1">
                            <p>{COMPANY_REQUISITES.name} · ИНН {COMPANY_REQUISITES.inn}</p>
                            <p>Счёт: {COMPANY_REQUISITES.account} · {COMPANY_REQUISITES.bank}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Upload Section - Only for Client */}
            {userRole === 'client' && (paymentStatus === 'awaiting_payment' || paymentStatus === 'overdue') && (
                <div className="bg-card rounded-2xl border border-border-theme p-6">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-foreground/40 mb-2">
                        Шаг 2: Загрузите чек
                    </h3>
                    <p className="text-sm text-foreground/60 mb-6">
                        После перевода прикрепите файл. Он будет <span className="text-primary font-bold">автоматически</span> отправлен менеджеру на проверку.
                    </p>

                    {/* Uploaded File Preview */}
                    {uploadedFile && (
                        <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-xl mb-4">
                            <div className="flex items-center gap-3">
                                <File size={20} className="text-green-600" />
                                <div>
                                    <p className="text-sm font-medium text-green-800">{uploadedFile.name}</p>
                                    <p className="text-xs text-green-600">
                                        {isUploading ? 'Загрузка...' : 'Готов к отправке'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleRemoveFile}
                                className="p-1 hover:bg-green-100 rounded-lg transition-colors"
                            >
                                <X size={16} className="text-green-600" />
                            </button>
                        </div>
                    )}

                    {/* Drop Zone */}
                    {!uploadedFile && (
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => !isUploading && fileInputRef.current?.click()}
                            className={`
                                relative flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed transition-all
                                ${isUploading ? 'opacity-50 cursor-wait' : 'cursor-pointer hover:border-foreground/40 hover:bg-foreground/5'}
                                ${isDragOver ? 'border-primary bg-primary/5' : 'border-foreground/20'}
                            `}
                        >
                            {isUploading ? (
                                <div className="flex flex-col items-center">
                                    <Loader2 size={32} className="mb-3 text-primary animate-spin" />
                                    <p className="text-sm font-bold text-primary">Отправляем менеджеру...</p>
                                </div>
                            ) : (
                                <>
                                    <Upload size={32} className={`mb-3 ${isDragOver ? 'text-primary' : 'text-foreground/30'}`} />
                                    <p className="text-sm font-medium text-foreground/70 mb-1">
                                        Перетащите файл сюда или нажмите для выбора
                                    </p>
                                    <p className="text-xs text-foreground/40">
                                        PDF, JPG или PNG · до 10 МБ
                                    </p>
                                </>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={handleFileSelect}
                                className="hidden"
                                disabled={isUploading}
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Uploaded File Section - Show if we have a path or in review */}
            {(receipt_path || status === 'payment_review') && (
                <div className={`bg-card rounded-2xl border p-6 ${status === 'invoice' && receipt_path ? 'border-red-500/30 bg-red-500/[0.02]' : status === 'payment_review' ? 'border-blue-500/30 bg-blue-500/[0.02] shadow-lg shadow-blue-500/5' : 'border-border-theme'}`}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-foreground/40">
                            {status === 'paid' ? 'Архивный чек' : status === 'invoice' ? 'Отклонённый чек' : 'Подтверждение платежа'}
                        </h3>
                        {userRole === 'manager' && status === 'payment_review' && (
                            <span className="px-2 py-1 bg-blue-500 text-white text-[8px] font-black uppercase rounded animate-pulse">Требует проверки</span>
                        )}
                        {status === 'invoice' && receipt_path && (
                            <span className="px-2 py-1 bg-red-500 text-white text-[8px] font-black uppercase rounded">Оплата отклонена</span>
                        )}
                    </div>

                    {!receipt_path && status === 'payment_review' && !uploadedFile ? (
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
                            <p className="font-bold mb-1">Файл не найден</p>
                            <p>Похоже, файл был загружен некорректно. Пожалуйста, {userRole === 'client' ? 'загрузите его повторно' : 'попросите клиента загрузить чек повторно'}.</p>
                            {userRole === 'client' && (
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="mt-2 text-primary font-black uppercase tracking-widest py-1 border-b border-primary/20"
                                >
                                    Выбрать файл
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-xl">
                            <div
                                onClick={receipt_path ? handleDownloadReceipt : undefined}
                                className={`flex items-center gap-3 ${receipt_path ? 'cursor-pointer hover:opacity-70 transition-opacity active:scale-[0.98]' : ''}`}
                            >
                                <FileText size={20} className="text-blue-600" />
                                <div>
                                    <p className="text-sm font-medium text-blue-800">
                                        {receipt_path ? receipt_path.split('/').pop() : uploadedFile?.name || 'payment_receipt.pdf'}
                                    </p>
                                    <p className="text-xs text-blue-600">
                                        {receipt_path ? 'Нажмите, чтобы просмотреть файл' : 'Файл загружен, сохраняем данные...'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                {receipt_path && (
                                    <button
                                        onClick={handleDownloadReceipt}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors"
                                    >
                                        <Download size={14} /> Открыть
                                    </button>
                                )}
                                {userRole === 'client' && status === 'invoice' && receipt_path && (
                                    <button
                                        onClick={handleReplaceFile}
                                        className="text-xs font-black uppercase tracking-widest text-red-600 hover:text-red-800 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-100/50 flex items-center gap-1.5"
                                    >
                                        <RefreshCcw size={12} className="animate-spin-slow" />
                                        Исправить
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
