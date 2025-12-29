export type CalculationStatus = 'draft' | 'sent' | 'changes' | 'approved';

export interface Comment {
    author: string;
    text: string;
    date: string;
}

export type InteractionType = 'created' | 'submitted' | 'comment' | 'revision' | 'approved';

export interface Interaction {
    id: number;
    type: InteractionType;
    user: string;
    timestamp: string;
    text: string;
    badge?: string;
    avatar?: string;
}

export const OBJECT_TYPES = [
    { value: 'restaurant', label: 'Ресторан' },
    { value: 'cafe', label: 'Кофейня' },
    { value: 'bar', label: 'Бар' },
    { value: 'hostel', label: 'Хостел' }
];

export interface InventoryItem {
    inventory: string;
    color: string;
    quantity: number;
    price: number;
    total: number;
}

export interface ZoneResult {
    zoneName: string;
    area: string;
    color: string;
    items: InventoryItem[];
}

export interface CalculationResults {
    byZone: ZoneResult[];
    summary: InventoryItem[];
}

export interface Calculation {
    id: number;
    organizationName: string;
    type?: string;
    status: CalculationStatus;
    zones: string[];
    totalArea: number;
    zonesCount: number;
    createdDate: string;
    manager: string;
    comments: Comment[];
    unreadComments: number;
    totalCost?: number;
    results: CalculationResults | null;
    history?: Interaction[];
}

export interface Zone {
    id: number;
    name: string;
    type: string;
    area: string;
    color: string;
}

export const STATUS_CONFIG: Record<CalculationStatus, { label: string; color: string }> = {
    draft: { label: 'Черновик', color: 'bg-gray-100 text-gray-800' },
    sent: { label: 'Отправлен', color: 'bg-blue-100 text-blue-800' },
    changes: { label: 'Требует изменений', color: 'bg-orange-100 text-orange-800' },
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

export const INVENTORY_ITEMS = [
    { id: 1, name: 'Швабры', color: '#ef4444', price: 500, norms: { kitchen: 15, hall: 25, bar: 20, bathroom: 10, storage: 30, service: 25 } },
    { id: 2, name: 'Швабры', color: '#3b82f6', price: 500, norms: { kitchen: 15, hall: 25, bar: 20, bathroom: 10, storage: 30, service: 25 } },
    { id: 3, name: 'Швабры', color: '#22c55e', price: 500, norms: { kitchen: 15, hall: 25, bar: 20, bathroom: 10, storage: 30, service: 25 } },
    { id: 4, name: 'Тряпки', color: '#ef4444', price: 35, norms: { kitchen: 40, hall: 60, bar: 50, bathroom: 30, storage: 80, service: 60 } },
    { id: 5, name: 'Тряпки', color: '#3b82f6', price: 35, norms: { kitchen: 40, hall: 60, bar: 50, bathroom: 30, storage: 80, service: 60 } },
    { id: 6, name: 'Ведра', color: '#ef4444', price: 280, norms: { kitchen: 50, hall: 80, bar: 60, bathroom: 40, storage: 100, service: 80 } },
    { id: 7, name: 'Ведра', color: '#3b82f6', price: 280, norms: { kitchen: 50, hall: 80, bar: 60, bathroom: 40, storage: 100, service: 80 } },
];
