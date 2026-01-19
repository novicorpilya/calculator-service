export type { CalculationStatus, Calculation } from '@/core/types/calculation';

export type SyncEventType = 'UPDATE' | 'INSERT' | 'DELETE';

export interface SyncPayload {
    id: string;
    type: SyncEventType;
    ts: number;
    isSignal?: boolean;
}

export interface Supplier {
    id: string;
    name: string;
    description?: string;
    logo?: string;
    rating?: number;
    contacts?: {
        phone?: string;
        email?: string;
        website?: string;
        address?: string;
    };
    integration_type: 'internal' | 'api_1c' | 'api_custom';
    status: 'active' | 'inactive';
    created_at?: string;
    updated_at?: string;
}

export type { Comment, Zone, Interaction, CalculationResults, ZoneResult, InventoryItem, InventoryItem as DashboardInventoryItem } from '@/core/types/calculation';

export type InteractionType =
    | 'created'
    | 'submitted'
    | 'comment'
    | 'revision'
    | 'invoice'
    | 'error';


/**
 * Represents a single interaction/event in the project history trail.
 */

export const OBJECT_TYPES = [
    { value: 'hotel', label: '🏨 Отель' },
    { value: 'restaurant', label: '🍽️ Кафе/Ресторан' },
    { value: 'production_food', label: '🏭 Производство (пищевое)' },
    { value: 'production_nonfood', label: '⚙️ Производство (непищевое)' },
    { value: 'beauty', label: '💅 Салон красоты' },
    { value: 'mall', label: '🏬 ТЦ/Общественное пространство' },
    { value: 'other', label: '📍 Другое' },
];

export const SANITARY_LEVELS = [
    { value: 'low', label: 'Низкий (офис, магазин)', coeff: 1.0 },
    { value: 'medium', label: 'Средний (кафе, ресторан)', coeff: 1.3 },
    { value: 'high', label: 'Высокий (пищевое производство)', coeff: 1.8 },
    { value: 'sterile', label: 'Стерильный (клиника, аптека)', coeff: 2.5 },
];

export const REPLACEMENT_CYCLES = [
    { value: 'daily', label: 'Ежедневно', coeff: 1.0 },
    { value: 'weekly', label: 'Еженедельно', coeff: 0.3 },
    { value: 'monthly', label: 'Ежемесячно', coeff: 0.1 },
];

export const INTENSITY_LEVELS = [
    { value: 'low', label: 'Низкая', coeff: 0.8 },
    { value: 'medium', label: 'Средняя', coeff: 1.0 },
    { value: 'high', label: 'Высокая', coeff: 1.2 },
    { value: 'very_high', label: 'Очень высокая', coeff: 1.3 },
    { value: 'critical', label: 'Критическая', coeff: 1.5 },
];

export const RESERVE_COEFFS = {
    medium: 0.15,
    high: 0.2,
    very_high: 0.2,
    critical: 0.25,
    default: 0.1,
};

export const ZONE_COEFFS: Record<string, number> = {
    '#ef4444': 1.25, // RED
    '#facc15': 1.15, // YELLOW
    '#22c55e': 1.0, // GREEN
    '#3b82f6': 0.85, // BLUE
    '#ec4899': 1.3, // PINK
    '#f97316': 1.4, // ORANGE
    '#78350f': 1.05, // BROWN
    '#f8fafc': 0.95, // WHITE
};

// Exported via core types above

export const ZONE_TYPES = [
    { value: 'red_zone', label: '🔴 RED — Санузлы (Риск)', color: '#ef4444' },
    { value: 'yellow_zone', label: '🟡 YELLOW — Ванные (Поверхности)', color: '#facc15' },
    { value: 'green_zone', label: '🟢 GREEN — Кухня / Бар', color: '#22c55e' },
    { value: 'blue_zone', label: '🔵 BLUE — Общие зоны / Офис', color: '#3b82f6' },
    { value: 'pink_zone', label: '💗 PINK — Спец. санузлы', color: '#ec4899' },
    { value: 'orange_zone', label: '🟠 ORANGE — Аллергены', color: '#f97316' },
    { value: 'brown_zone', label: '🟤 BROWN — Готовое мясо', color: '#78350f' },
    { value: 'white_zone', label: '⚪ WHITE — Молочные продукты', color: '#f8fafc' },
];

export const COMPANY_REQUISITES = {
    name: 'ООО "НОВИКОРП"',
    inn: '7700012345',
    kpp: '770101001',
    account: '40702810000000012345',
    bank: 'АО "ТИНЬКОФФ БАНК"',
    bik: '044525974',
    corrAccount: '30101810300000000974',
    address: 'г. Москва, ул. Примерная, д. 10, оф. 5',
};
