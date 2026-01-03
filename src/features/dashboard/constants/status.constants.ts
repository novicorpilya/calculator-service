import {
    FileText, Send, AlertCircle, CheckCircle, Download,
    RefreshCcw, Users, Receipt, CreditCard, Truck,
    CheckCircle2, Lock, type LucideIcon
} from 'lucide-react';
import type { CalculationStatus } from '../dashboard.types';

export const STATUS_UI_CONFIG: Record<CalculationStatus | 'exported', { label: string; bg: string; text: string; dot: string; icon: LucideIcon }> = {
    draft: { label: 'Черновик', bg: 'bg-foreground/5', text: 'text-foreground/60', dot: 'bg-foreground/20', icon: FileText },
    sent: { label: 'Отправлен', bg: 'bg-primary/10', text: 'text-primary', dot: 'bg-primary', icon: Send },
    changes: { label: 'Правки', bg: 'bg-amber-500/10', text: 'text-amber-600', dot: 'bg-amber-500', icon: AlertCircle },
    revision: { label: 'Правки внесены', bg: 'bg-purple-100', text: 'text-purple-600', dot: 'bg-purple-500', icon: RefreshCcw },
    approved: { label: 'Утвержден', bg: 'bg-emerald-500/10', text: 'text-emerald-600', dot: 'bg-emerald-500', icon: CheckCircle },
    suppliers: { label: 'Поставщики', bg: 'bg-indigo-100', text: 'text-indigo-600', dot: 'bg-indigo-500', icon: Users },
    invoice: { label: 'Счет', bg: 'bg-cyan-100', text: 'text-cyan-600', dot: 'bg-cyan-500', icon: Receipt },
    paid: { label: 'Оплачено', bg: 'bg-emerald-100', text: 'text-emerald-600', dot: 'bg-emerald-500', icon: CreditCard },
    shipping: { label: 'Доставка', bg: 'bg-amber-100', text: 'text-amber-600', dot: 'bg-amber-500', icon: Truck },
    completed: { label: 'Завершено', bg: 'bg-teal-100', text: 'text-teal-600', dot: 'bg-teal-500', icon: CheckCircle2 },
    closed: { label: 'Закрыт', bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-500', icon: Lock },
    exported: { label: 'Экспорт', bg: 'bg-indigo-500/10', text: 'text-indigo-600', dot: 'bg-indigo-500', icon: Download }
};
