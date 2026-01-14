import React from 'react';
import type { Calculation } from '../dashboard.types';
import { STATUS_UI_CONFIG } from '../constants/status.constants';

export const ModernStatusBadge = React.memo<{ status: Calculation['status'] }>(({ status }) => {
    const config = STATUS_UI_CONFIG[status];

    if (!config) return null;

    return (
        <div
            className={`px-3 py-1 rounded-full ${config.bg} ${config.text} text-[9px] font-black uppercase tracking-widest flex items-center gap-2 border border-current border-opacity-10`}
        >
            <config.icon size={12} className="opacity-70" />
            <span className={`w-1.5 h-1.5 rounded-full ${config.dot} animate-pulse`} />
            {config.label}
        </div>
    );
});
