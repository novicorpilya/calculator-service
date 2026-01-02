import { FileText, Send, AlertCircle, CheckCircle, Download, type LucideIcon } from 'lucide-react';
import type { CalculationStatus } from '../dashboard.types';

export const STATUS_UI_CONFIG: Record<CalculationStatus | 'exported', { label: string; bg: string; text: string; dot: string; icon: LucideIcon }> = {
    draft: { label: 'Черновик', bg: 'bg-foreground/5', text: 'text-foreground/60', dot: 'bg-foreground/20', icon: FileText },
    sent: { label: 'Отправлен', bg: 'bg-primary/10', text: 'text-primary', dot: 'bg-primary', icon: Send },
    changes: { label: 'Правки', bg: 'bg-amber-500/10', text: 'text-amber-600', dot: 'bg-amber-500', icon: AlertCircle },
    approved: { label: 'Утвержден', bg: 'bg-emerald-500/10', text: 'text-emerald-600', dot: 'bg-emerald-500', icon: CheckCircle },
    exported: { label: 'Экспорт', bg: 'bg-indigo-500/10', text: 'text-indigo-600', dot: 'bg-indigo-500', icon: Download }
};
