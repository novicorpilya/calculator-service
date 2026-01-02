/**
 * Current lifecycle stage of a calculation project.
 */
export type CalculationStatus = 'draft' | 'sent' | 'changes' | 'revision' | 'approved';

export type SyncEventType = 'UPDATE' | 'INSERT' | 'DELETE';

export interface SyncPayload {
    id: string;
    type: SyncEventType;
    ts: number;
    isSignal?: boolean;
}

export interface Comment {
    author: string;
    text: string;
    date: string;
}

export type InteractionType = 'created' | 'submitted' | 'comment' | 'revision' | 'approved';

/**
 * Represents a single interaction/event in the project history trail.
 */
export interface Interaction {
    id: number | string;
    type: InteractionType;
    user: string;
    timestamp: string;
    text: string;
    badge?: string;
    avatar?: string;
}

export const OBJECT_TYPES = [
    { value: 'hotel', label: '🏨 Отель' },
    { value: 'restaurant', label: '🍽️ Кафе/Ресторан' },
    { value: 'production_food', label: '🏭 Производство (пищевое)' },
    { value: 'production_nonfood', label: '⚙️ Производство (непищевое)' },
    { value: 'beauty', label: '💅 Салон красоты' },
    { value: 'mall', label: '🏬 ТЦ/Общественное пространство' },
    { value: 'other', label: '📍 Другое' }
];

export const SANITARY_LEVELS = [
    { value: 'low', label: 'Низкий (офис, магазин)', coeff: 1.0 },
    { value: 'medium', label: 'Средний (кафе, ресторан)', coeff: 1.3 },
    { value: 'high', label: 'Высокий (пищевое производство)', coeff: 1.8 },
    { value: 'sterile', label: 'Стерильный (клиника, аптека)', coeff: 2.5 }
];

export const REPLACEMENT_CYCLES = [
    { value: 'daily', label: 'Ежедневно', coeff: 1.0 },
    { value: 'weekly', label: 'Еженедельно', coeff: 0.3 },
    { value: 'monthly', label: 'Ежемесячно', coeff: 0.1 }
];

export interface InventoryItem {
    inventory: string;
    color: string;
    quantity: number;
    price: number;
    total: number;
    norms?: {
        area: number;
        personnel: number;
        intensity: number;
    };
}

export interface ZoneResult {
    zoneName: string;
    area: string;
    type: string;
    color: string;
    items: InventoryItem[];
}

export interface CalculationResults {
    byZone: ZoneResult[];
    summary: InventoryItem[];
}

/**
 * Main project entity containing all research parameters and results.
 */
export interface Calculation {
    id: number | string;
    organizationName: string;
    type?: string;
    status: CalculationStatus;
    zones: string[];
    zoneDetails?: Zone[]; // Source of truth for editing
    totalArea: number;
    zonesCount: number;
    staffCount: number;
    dailyVisitors: number;
    sanitaryLevel: string;
    replacementCycle: string;
    createdDate: string;
    manager: string;
    comments: Comment[];
    unreadComments: number;
    totalCost?: number;
    user_id?: string;
    manager_id?: string;
    results: CalculationResults | null;
    history?: Interaction[];
}

export interface Zone {
    id: number | string;
    name: string;
    type: string;
    area: string;
    staffCount: string;
    color: string;
}

export const STATUS_CONFIG: Record<CalculationStatus, { label: string; color: string }> = {
    draft: { label: 'Черновик', color: 'bg-gray-100 text-gray-800' },
    sent: { label: 'Отправлен', color: 'bg-blue-100 text-blue-800' },
    changes: { label: 'Требует изменений', color: 'bg-orange-100 text-orange-800' },
    revision: { label: 'Правки внесены', color: 'bg-purple-100 text-purple-800' },
    approved: { label: 'Утверждено', color: 'bg-green-100 text-green-800' }
};

export const ZONE_TYPES = [
    { value: 'kitchen', label: 'Кухня', color: '#ef4444' },
    { value: 'hall', label: 'Зал', color: '#3b82f6' },
    { value: 'bar', label: 'Бар', color: '#8b5cf6' },
    { value: 'bathroom', label: 'Санузел', color: '#22c55e' },
    { value: 'storage', label: 'Склад', color: '#f59e0b' },
    { value: 'service', label: 'Служебная', color: '#6b7280' }
];


