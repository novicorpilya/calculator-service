import {
    FileText,
    Clock,
    Search,
    AlertCircle,
    RefreshCcw,
    Receipt,
    Wallet,
    CheckCircle2,
    Package,
    Truck,
    Archive,
    History,
    type LucideIcon,
} from 'lucide-react';
import type { CalculationStatus } from '../dashboard.types';

export interface StatusUI {
    label: string;
    bg: string;
    text: string;
    dot: string;
    icon: LucideIcon;
    description?: string;
}

export const STATUS_UI_CONFIG: Record<CalculationStatus | 'exported', StatusUI> = {
    draft: {
        label: 'Черновик',
        bg: 'bg-slate-500/10',
        text: 'text-slate-600',
        dot: 'bg-slate-400',
        icon: FileText,
        description: 'Расчет сохранен как черновик и еще не отправлен менеджеру.',
    },
    sent: {
        label: 'Ожидает проверки',
        bg: 'bg-blue-500/10',
        text: 'text-blue-600',
        dot: 'bg-blue-500',
        icon: Clock,
        description: 'Заказ отправлен менеджеру и ожидает начала проверки.',
    },
    expert: {
        label: 'На экспертизе',
        bg: 'bg-indigo-500/10',
        text: 'text-indigo-600',
        dot: 'bg-indigo-500',
        icon: Search,
        description: 'Менеджер проводит аудит и уточняет детали заказа.',
    },
    changes: {
        label: 'Требуют правок',
        bg: 'bg-orange-500/10',
        text: 'text-orange-600',
        dot: 'bg-orange-500',
        icon: AlertCircle,
        description: 'Менеджер вернул заказ на доработку. Проверьте комментарии.',
    },
    revision: {
        label: 'Правки внесены',
        bg: 'bg-purple-500/10',
        text: 'text-purple-600',
        dot: 'bg-purple-500',
        icon: RefreshCcw,
        description: 'Вы внесли правки в расчёт, менеджер скоро проверит их.',
    },
    invoice: {
        label: 'Ожидает оплаты',
        bg: 'bg-cyan-500/10',
        text: 'text-cyan-600',
        dot: 'bg-cyan-500',
        icon: Receipt,
        description: 'Счет сформирован. Пожалуйста, произведите оплату по реквизитам.',
    },
    payment_review: {
        label: 'Оплата отправлена',
        bg: 'bg-yellow-500/10',
        text: 'text-yellow-700',
        dot: 'bg-yellow-500',
        icon: Wallet,
        description: 'Вы подтвердили оплату. Менеджер проверяет поступление средств.',
    },
    payment_rejected: {
        label: 'Оплата отклонена',
        bg: 'bg-red-500/10',
        text: 'text-red-600',
        dot: 'bg-red-500',
        icon: AlertCircle,
        description: 'Менеджер отклонил подтверждение оплаты. Пожалуйста, проверьте чек и загрузите его повторно.',
    },
    paid: {
        label: 'Оплата подтверждена',
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-600',
        dot: 'bg-emerald-500',
        icon: CheckCircle2,
        description: 'Оплата успешно подтверждена менеджером.',
    },
    processing: {
        label: 'Собираем заказ',
        bg: 'bg-sky-500/10',
        text: 'text-sky-600',
        dot: 'bg-sky-500',
        icon: Package,
        description: 'Собираем все товары по накладной для отправки.',
    },
    sent_to_warehouse: {
        label: 'Отправлен на склад',
        bg: 'bg-violet-500/10',
        text: 'text-violet-600',
        dot: 'bg-violet-500',
        icon: Truck,
        description: 'Ваш заказ отправлен на склад для финальной подготовки.',
    },
    ready: {
        label: 'Готово к отгрузке',
        bg: 'bg-green-500/10',
        text: 'text-green-600',
        dot: 'bg-green-500',
        icon: History,
        description: 'Заказ полностью упакован и ожидает курьера/машину.',
    },
    shipping: {
        label: 'Доставка',
        bg: 'bg-amber-500/10',
        text: 'text-amber-600',
        dot: 'bg-amber-500',
        icon: Truck,
        description: 'Ваш заказ находится в пути.',
    },
    completed: {
        label: 'Выполнен',
        bg: 'bg-teal-500/10',
        text: 'text-teal-600',
        dot: 'bg-teal-500',
        icon: CheckCircle2,
        description: 'Заказ успешно доставлен и проект завершен.',
    },
    closed: {
        label: 'Архив',
        bg: 'bg-slate-500/10',
        text: 'text-slate-600',
        dot: 'bg-slate-500',
        icon: Archive,
        description: 'Проект закрыт и перемещен в архив.',
    },
    exported: {
        label: 'Экспорт',
        bg: 'bg-indigo-500/10',
        text: 'text-indigo-600',
        dot: 'bg-indigo-500',
        icon: History,
    },
};
