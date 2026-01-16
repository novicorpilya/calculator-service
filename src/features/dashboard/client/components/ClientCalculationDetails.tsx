import React, { useState, useMemo, useEffect } from 'react';
import { useServices } from '@/core/di/ServiceContainer';
import { logger } from '@/core/logging';
import {
    AlertTriangle,
} from 'lucide-react';
import {
    type Calculation,
    type CalculationStatus,
    type CalculationResults,
} from '../../dashboard.types';
import { CalculationEntity } from '@/core/domain/CalculationEntity';
import { CalculationViewModel } from '@/features/dashboard/presentation/CalculationViewModel';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth';
import { ErrorBoundary } from '@/core/components/ErrorBoundary';

// Components
import { ProjectChatSection } from './ProjectChatSection';
import { ProductPickerModal } from './ProductPickerModal';
import { useProjectChat } from '@/features/chat/hooks/useProjectChat';
import { useProductSelection } from '@/features/dashboard/hooks/useProductSelection';
import { generateInvoicePDF } from '../../utils/pdfInvoiceGenerator';
import { PaymentStatusView } from './PaymentStatusView';

// Extracted Details Components
import { CalculationHeader } from './details/CalculationHeader';
import { CalculationStats } from './details/CalculationStats';
import { CalculationExpertiseInfo } from './details/CalculationExpertiseInfo';
import { AuditPricingPanel } from './details/AuditPricingPanel';
import { CalculationInventoryList } from './details/CalculationInventoryList';
import { CalculationZonesBreakdown } from './details/CalculationZonesBreakdown';

interface ClientCalculationDetailsProps {
    calculation: Calculation;
    onBack: () => void;
    onUpdateStatus: (
        id: number | string,
        status: CalculationStatus,
        additional?: Partial<Calculation>
    ) => void;
    onDelete: (id: number | string) => void;
    onEdit: (calc: Calculation) => void;
    onAssign?: (id: number | string) => void;
    onAdjustExpert?: (
        id: string | number,
        results: CalculationResults,
        adjustments: Record<string, unknown>,
        version: number
    ) => Promise<void>;
    displayId?: number;
}

export const ClientCalculationDetails = React.memo<ClientCalculationDetailsProps>(
    ({
        calculation,
        onBack,
        onUpdateStatus,
        onDelete,
        onEdit,
        onAssign,
        onAdjustExpert,
        displayId,
    }) => {
        const { user } = useAuth();
        const { calculationService } = useServices();

        // Initialize Domain Entity and VM
        const entity = useMemo(() => new CalculationEntity(calculation), [calculation]);
        const vm = useMemo(() => new CalculationViewModel(entity), [entity]);

        const formattedDate = vm.formattedDate;

        // Use Entity business logic for totals and permissions
        const isFinancialStage = ['invoice', 'paid', 'shipping', 'completed', 'closed'].includes(
            entity.status
        );
        const canSeePrices = user?.role === 'manager' || user?.role === 'admin' || isFinancialStage;

        // Metrics
        const totalCost = entity.totalCost;
        const totalUnits = entity.totalItems;

        // Custom Hooks
        const { messages, loadingMessages, sendMessage, sendVoice, markAsRead } =
            useProjectChat(entity, user);

        // Mark as read when messages change or project is opened
        useEffect(() => {
            if (messages.length > 0 && messages.some(m => !m.is_read && m.sender_id !== user?.id)) {
                markAsRead();
            }
        }, [messages, markAsRead, user?.id]);

        const {
            isAuditMode,
            setIsAuditMode,
            auditItemIndex,
            setAuditItemIndex,
            catalog,
            handleProductSelect,
            handleAddItem,
            handleRemoveItem,
            handleUpdateAdjustments,
        } = useProductSelection({ user, entity, onUpdateStatus, onAdjustExpert });

        // Local State
        const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

        const handleDownloadPDF = () => {
            try {
                generateInvoicePDF(entity);
                toast.success('Счет сформирован (PDF)');
            } catch (error) {
                logger.error('PDF Error', { error });
                toast.error('Ошибка генерации PDF');
            }
        };

        return (
            <div className="w-full max-w-[min(100%,1300px)] mx-auto space-y-[clamp(1.5rem,5vh,3.5rem)] animate-in fade-in duration-700 pb-20">
                {showDeleteConfirm && (
                    <div className="fixed inset-0 bg-background/80 backdrop-blur-xl z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                        <div className="glass-card max-w-md w-full !p-10 text-center space-y-8 shadow-3xl border-primary/20">
                            <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                                <AlertTriangle size={36} />
                            </div>
                            <div className="space-y-3">
                                <h3 className="text-2xl font-black tracking-tight">
                                    Удалить проект?
                                </h3>
                                <p className="text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] leading-relaxed italic">
                                    Это действие безвозвратно удалит все данные расчета «
                                    {entity.organizationName}»
                                </p>
                            </div>
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => onDelete(entity.id)}
                                    className="btn-premium !bg-red-500 !text-white border-none"
                                >
                                    Удалить
                                </button>
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="w-full py-4 text-[10px] font-black uppercase tracking-[0.3em] text-foreground/30 hover:text-foreground transition-colors"
                                >
                                    Отмена
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <CalculationHeader 
                    vm={vm}
                    entity={entity}
                    calculation={calculation}
                    user={user}
                    displayId={displayId}
                    formattedDate={formattedDate}
                    onBack={onBack}
                    onDelete={onDelete}
                    onEdit={onEdit}
                    onUpdateStatus={onUpdateStatus}
                    onDownloadPDF={handleDownloadPDF}
                    onAssign={onAssign}
                    isAuditMode={isAuditMode}
                    setIsAuditMode={setIsAuditMode}
                    setShowDeleteConfirm={setShowDeleteConfirm}
                />

                {(entity.canSubmitPayment() ||
                    entity.isPaymentSent() ||
                    (entity.isPaid() && calculation.receipt_path)) && (
                    <PaymentStatusView
                        calculation={calculation}
                        userRole={(user?.role ?? 'client') as 'client' | 'manager' | 'admin'}
                        onUploadReceipt={async (file) => {
                            const res = await calculationService.uploadReceipt(
                                entity.id,
                                file,
                                entity.userId || user?.id || ''
                            );
                            if (res.success && res.data) {
                                await onUpdateStatus(entity.id, 'payment_review', {
                                    receipt_path: res.data,
                                });
                            } else {
                                toast.error(res.error?.message || 'Ошибка загрузки чека');
                            }
                        }}
                        onContactManager={() => {
                            toast.info('Откройте раздел "Обсуждение" ниже');
                        }}
                    />
                )}

                {(entity.status === 'expert' || entity.status === 'revision') && (
                    <CalculationExpertiseInfo />
                )}

                {isAuditMode && (user?.role === 'manager' || user?.role === 'admin') && (
                    <AuditPricingPanel 
                        vm={vm}
                        entity={entity} 
                        onUpdateAdjustments={handleUpdateAdjustments} 
                    />
                )}

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 lg:gap-12">
                    <div className="xl:col-span-8 space-y-12">
                        <CalculationStats entity={vm} />

                        {entity.results && (
                            <>
                                <CalculationInventoryList 
                                    vm={vm}
                                    user={user}
                                    isAuditMode={isAuditMode}
                                    canSeePrices={canSeePrices}
                                    totalCost={totalCost}
                                    totalUnits={totalUnits}
                                    onSetAuditItemIndex={setAuditItemIndex}
                                    onRemoveItem={handleRemoveItem}
                                />
                                <CalculationZonesBreakdown vm={vm} entity={entity} />
                            </>
                        )}
                    </div>

                    <div className="xl:col-span-4 space-y-8">
                        <ErrorBoundary
                            fallback={
                                <div className="glass-card p-12 text-center opacity-40 uppercase font-black tracking-widest text-[10px]">
                                    Чат временно недоступен
                                </div>
                            }
                        >
                            <ProjectChatSection
                                messages={messages}
                                loadingMessages={loadingMessages}
                                user={user}
                                onSendMessage={sendMessage}
                                onSendVoice={sendVoice}
                            />
                        </ErrorBoundary>
                    </div>
                </div>

                {auditItemIndex !== null && entity.results && (
                    <ProductPickerModal
                        isOpen={true}
                        onClose={() => setAuditItemIndex(null)}
                        onSelect={(master) => {
                            if (auditItemIndex === -1) {
                                handleAddItem(master);
                            } else {
                                handleProductSelect(master);
                            }
                        }}
                        catalog={catalog}
                        currentItem={
                            auditItemIndex === -1
                                ? undefined
                                : entity.results.summary[auditItemIndex]
                        }
                    />
                )}
            </div>
        );
    }
);
