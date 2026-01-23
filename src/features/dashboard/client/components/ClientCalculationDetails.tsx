import React, { useState, useMemo, useEffect } from 'react';
import { useServices } from '@/app/di/ServiceContainer';
import { logger } from '@/core/logging/index';
import { AlertTriangle } from 'lucide-react';
import {
    type Calculation,
    type CalculationStatus,
    type CalculationResults,
} from '../../dashboard.types';
import { CalculationEntity } from '@/core/domain/CalculationEntity';
import { CalculationViewModel } from '@/features/dashboard/presentation/CalculationViewModel';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/index';
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
import { CalculationHistory } from './details/CalculationHistory';
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

        // Custom Hooks
        const { messages, loadingMessages, sendMessage, sendVoice, markAsRead } = useProjectChat(
            entity,
            user
        );

        // Mark as read when messages change or project is opened
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
        const [activeTab, setActiveTab] = useState<'items' | 'zones' | 'history'>('items');

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
            <div className="w-full max-w-[min(100%,1300px)] mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
                {/* Delete Confirmation Modal */}
                {showDeleteConfirm && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                        <div className="glass-card max-w-md w-full !p-10 text-center space-y-8 shadow-3xl border-white/10">
                            <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-3xl flex items-center justify-center mx-auto">
                                <AlertTriangle size={36} />
                            </div>
                            <div className="space-y-3">
                                <h3 className="text-2xl font-black">Удалить проект?</h3>
                                <p className="text-xs font-bold text-foreground/40 leading-relaxed italic">
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
                                    className="py-2 text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity"
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

                {/* Top Metrics Bento */}
                <div className="animate-in fade-in slide-in-from-top-4 duration-1000">
                    <CalculationStats entity={vm} />
                </div>

                {/* Status Banners Area */}
                <div className="space-y-6">
                    {(entity.canSubmitPayment() ||
                        entity.isPaymentSent() ||
                        entity.isPaymentRejected() ||
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
                        />
                    )}

                    {user?.role === 'client' &&
                        (entity.status === 'expert' || entity.status === 'revision') && (
                            <CalculationExpertiseInfo />
                        )}

                    {isAuditMode && (user?.role === 'manager' || user?.role === 'admin') && (
                        <AuditPricingPanel
                            vm={vm}
                            entity={entity}
                            onUpdateAdjustments={handleUpdateAdjustments}
                        />
                    )}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 lg:gap-12 items-start">
                    {/* Main Content Area with Tabs */}
                    <div className="xl:col-span-8 space-y-8">
                        {/* Tab Navigation */}
                        <div className="flex items-center gap-2 p-1 bg-white/[0.03] border border-white/5 rounded-2xl w-fit">
                            <button
                                onClick={() => setActiveTab('items')}
                                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                    activeTab === 'items'
                                        ? 'bg-primary text-background shadow-lg'
                                        : 'text-foreground/40 hover:text-foreground hover:bg-white/5'
                                }`}
                            >
                                План снабжения
                            </button>
                            <button
                                onClick={() => setActiveTab('history')}
                                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                    activeTab === 'history'
                                        ? 'bg-primary text-background shadow-lg'
                                        : 'text-foreground/40 hover:text-foreground hover:bg-white/5'
                                }`}
                            >
                                История
                            </button>
                        </div>

                        {/* Tab Content Panels */}
                        <div className="min-h-[400px]">
                            {activeTab === 'items' && entity.results && (
                                <div className="animate-in fade-in slide-in-from-left-4 duration-500">
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
                                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                                    <CalculationZonesBreakdown vm={vm} entity={entity} />
                                </div>
                            )}

                            {activeTab === 'history' && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <CalculationHistory calculation={calculation} user={user} />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Side Tools & Chat Panels (Sticky) */}
                    <div className="xl:col-span-4 space-y-6 sticky top-10">
                        {/* Personal Expert Banner for Client */}
                        {user?.role === 'client' &&
                            (entity.status === 'expert' || entity.status === 'revision') && (
                                <div className="p-4 rounded-2xl border space-y-3 shadow-sm bg-indigo-500/10 border-indigo-500/20 animate-in fade-in slide-in-from-right-4 duration-500">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl overflow-hidden border border-border-theme">
                                            <div className="w-full h-full bg-indigo-500 flex items-center justify-center text-white font-bold text-xs uppercase shadow-inner">
                                                EXP
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                                                Персональный эксперт
                                            </div>
                                            <div className="text-[12px] font-bold text-foreground">
                                                Линия аудита открыта
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                        {(user?.role === 'manager' || user?.role === 'admin') && (
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
                                userRole={user?.role}
                            />
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
                </div>

                {/* Overlays */}
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
