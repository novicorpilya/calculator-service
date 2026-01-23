import React, { useState, useMemo, useEffect } from 'react';
import { useServices } from '@/app/di/ServiceContainer';
import { logger } from '@/core/logging/index.ts';
import { AlertTriangle, LayoutGrid, ListFilter, PieChart, MessageSquare } from 'lucide-react';
import {
    type Calculation,
    type CalculationStatus,
    type CalculationResults,
} from '../../../dashboard.types';
import { CalculationEntity } from '@/core/domain/CalculationEntity';
import { CalculationViewModel } from '@/features/dashboard/presentation/CalculationViewModel';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/index.ts';
import { ErrorBoundary } from '@/core/components/ErrorBoundary';

// Components
import { ProjectChatSection } from '../ProjectChatSection';
import { ProductPickerModal } from '../ProductPickerModal';
import { useProjectChat } from '@/features/chat/hooks/useProjectChat';
import { useProductSelection } from '@/features/dashboard/hooks/useProductSelection';
import { generateInvoicePDF } from '../../../utils/pdfInvoiceGenerator';
import { PaymentStatusView } from '../PaymentStatusView';

// Extracted Details Components
import { CalculationHeader } from './CalculationHeader';
import { CalculationStats } from './CalculationStats';
import { CalculationExpertiseInfo } from './CalculationExpertiseInfo';
import { AuditPricingPanel } from './AuditPricingPanel';
import { CalculationInventoryList } from './CalculationInventoryList';
import { CalculationZonesBreakdown } from './CalculationZonesBreakdown';
import { ManagerProjectTools } from '@/features/dashboard/manager/components/details/ManagerProjectTools';

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

type TabType = 'inventory' | 'zones' | 'analytics';

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
        const [activeTab, setActiveTab] = useState<TabType>('inventory');

        // Initialize Domain Entity and VM
        const entity = useMemo(() => new CalculationEntity(calculation), [calculation]);
        const vm = useMemo(() => new CalculationViewModel(entity), [entity]);

        const formattedDate = vm.formattedDate;

        // Use Entity business logic for totals and permissions
        const isFinancialStage = ['invoice', 'paid', 'shipping', 'completed', 'closed'].includes(
            entity.status
        );
        const canSeePrices = user?.role === 'manager' || user?.role === 'admin' || isFinancialStage;

        // Custom Hooks
        const { messages, loadingMessages, sendMessage, sendVoice, markAsRead } = useProjectChat(
            entity,
            user
        );

        useEffect(() => {
            if (
                messages.length > 0 &&
                messages.some((m) => !m.is_read && m.sender_id !== user?.id)
            ) {
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
            <div className="w-full max-w-[min(100%,1600px)] mx-auto space-y-8 animate-in fade-in duration-700 pb-20 px-2 sm:px-4">
                {/* Delete Confirmation Modal */}
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
                                    Это действие безвозвратно удалит расчет «
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
                                    className="w-full py-4 text-[10px] font-black uppercase tracking-[0.3em] text-foreground/50 hover:text-foreground transition-colors"
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

                <div className="flex flex-col lg:flex-row gap-8 items-start">
                    {/* --- MAIN CONTENT AREA --- */}
                    <div className="w-full lg:flex-1 space-y-8 min-w-0">
                        {(entity.canSubmitPayment() ||
                            entity.isPaymentSent() ||
                            (entity.isPaid() && calculation.receipt_path)) && (
                            <PaymentStatusView
                                calculation={calculation}
                                userRole={
                                    (user?.role ?? 'client') as 'client' | 'manager' | 'admin'
                                }
                                onUploadReceipt={async (file: File) => {
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
                            />
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <CalculationStats entity={vm} />
                        </div>

                        {/* TABS NAVIGATION */}
                        <div className="overflow-x-auto scrollbar-hide -mx-2 px-2">
                            <div className="flex items-center p-1.5 bg-foreground/5 rounded-2xl w-fit min-w-max">
                                {[
                                    { id: 'inventory', icon: ListFilter, label: 'Спецификация' },
                                    { id: 'zones', icon: LayoutGrid, label: 'Зоны' },
                                    { id: 'analytics', icon: PieChart, label: 'Аналитика' },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as TabType)}
                                        className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                                            activeTab === tab.id
                                                ? 'bg-card text-primary shadow-sm'
                                                : 'text-foreground/40 hover:text-foreground/60'
                                        }`}
                                    >
                                        <tab.icon size={14} />
                                        <span>{tab.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div
                            key={activeTab}
                            className="animate-in fade-in slide-in-from-top-2 duration-300"
                        >
                            {activeTab === 'inventory' && entity.results && (
                                <div className="space-y-6">
                                    {isAuditMode &&
                                        (user?.role === 'manager' || user?.role === 'admin') && (
                                            <AuditPricingPanel
                                                vm={vm}
                                                entity={entity}
                                                onUpdateAdjustments={handleUpdateAdjustments}
                                            />
                                        )}
                                    <CalculationInventoryList
                                        vm={vm}
                                        user={user}
                                        isAuditMode={isAuditMode}
                                        canSeePrices={canSeePrices}
                                        onSetAuditItemIndex={setAuditItemIndex}
                                        onRemoveItem={handleRemoveItem}
                                    />
                                </div>
                            )}

                            {activeTab === 'zones' && entity.results && (
                                <CalculationZonesBreakdown vm={vm} entity={entity} />
                            )}

                            {activeTab === 'analytics' && (
                                <div className="space-y-8">
                                    {(entity.status === 'expert' ||
                                        entity.status === 'revision') && (
                                        <CalculationExpertiseInfo />
                                    )}
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
                            )}
                        </div>
                    </div>

                    {/* --- STICKY MANAGER PANEL --- */}
                    {(user?.role === 'manager' || user?.role === 'admin') && (
                        <div className="w-full lg:w-[320px] shrink-0 sticky top-8">
                            <ManagerProjectTools
                                calculation={calculation}
                                onUpdateStatus={onUpdateStatus}
                                onAssign={onAssign}
                                isAuditMode={isAuditMode}
                                setIsAuditMode={setIsAuditMode}
                                onDelete={
                                    setShowDeleteConfirm
                                        ? () => setShowDeleteConfirm(true)
                                        : undefined
                                }
                                userId={user?.id || ''}
                            />

                            {/* Mobile only Chat hint */}
                            {activeTab !== 'analytics' && (
                                <button
                                    onClick={() => setActiveTab('analytics')}
                                    className="lg:hidden w-full mt-4 p-4 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest"
                                >
                                    <MessageSquare size={16} />
                                    Открыть обсуждение
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {auditItemIndex !== null && entity.results && (
                    <ProductPickerModal
                        isOpen={true}
                        onClose={() => setAuditItemIndex(null)}
                        onSelect={(master) => {
                            if (auditItemIndex === -1) handleAddItem(master);
                            else handleProductSelect(master);
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
