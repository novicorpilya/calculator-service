import React from 'react';
import { FileText, Send, AlertCircle, CheckCircle, Download } from 'lucide-react';
import type { CalculationStatus } from '../dashboard.types';

export const STATUS_UI_CONFIG: Record<CalculationStatus | 'exported', { label: string; color: string; textColor: string; icon: any; badgeColor: string }> = {
    draft: { label: 'Черновик', color: 'bg-gray-100', textColor: 'text-gray-700', icon: FileText, badgeColor: 'bg-gray-200' },
    sent: { label: 'Отправлен', color: 'bg-blue-100', textColor: 'text-blue-700', icon: Send, badgeColor: 'bg-blue-200' },
    changes: { label: 'Требует изменений', color: 'bg-amber-100', textColor: 'text-amber-700', icon: AlertCircle, badgeColor: 'bg-amber-200' },
    approved: { label: 'Утверждено', color: 'bg-green-100', textColor: 'text-green-700', icon: CheckCircle, badgeColor: 'bg-green-200' },
    exported: { label: 'Экспортировано', color: 'bg-emerald-100', textColor: 'text-emerald-700', icon: Download, badgeColor: 'bg-emerald-200' }
};

interface CalculationStatusBadgeProps {
    status: CalculationStatus;
    className?: string;
}

export const CalculationStatusBadge: React.FC<CalculationStatusBadgeProps> = ({ status, className = '' }) => {
    const config = STATUS_UI_CONFIG[status] || STATUS_UI_CONFIG.draft;
    const Icon = config.icon;

    return (
        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${config.color} ${config.textColor} text-xs font-semibold ${className}`}>
            <Icon className="w-3.5 h-3.5" />
            {config.label}
        </div>
    );
};
