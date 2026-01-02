import React from 'react';
import type { CalculationStatus } from '../dashboard.types';
import { STATUS_UI_CONFIG } from '../constants/status.constants';

interface CalculationStatusBadgeProps {
    status: CalculationStatus;
    className?: string;
}

export const CalculationStatusBadge: React.FC<CalculationStatusBadgeProps> = ({ status, className = '' }) => {
    const config = STATUS_UI_CONFIG[status] || STATUS_UI_CONFIG.draft;
    const Icon = config.icon;

    return (
        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full ${config.bg} ${config.text} text-[10px] font-black uppercase tracking-widest border border-current border-opacity-10 ${className}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${config.dot} animate-pulse`} />
            <Icon className="w-3.5 h-3.5" />
            {config.label}
        </div>
    );
};
