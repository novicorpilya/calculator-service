/**
 * Core types for Calculations, shared across features and domain layers.
 * Preventing circular dependencies by moving from features to core.
 */

export type CalculationStatus =
    | 'draft'
    | 'sent'
    | 'expert'
    | 'changes'
    | 'revision'
    | 'invoice'
    | 'payment_review'
    | 'payment_rejected'
    | 'paid'
    | 'processing'
    | 'sent_to_warehouse'
    | 'ready'
    | 'shipping'
    | 'completed'
    | 'closed';

export interface Comment {
    author: string;
    text: string;
    date: string;
}

export interface Zone {
    id: string;
    name: string;
    type: string;
    area: string;
    staffCount: string;
    color: string;
}

export interface InventoryItem {
    inventory: string;
    sku?: string;
    color: string;
    quantity: number;
    price: number;
    stock: number;
    unit?: string;
    supplier_id?: string;
    category?: string;
    norm_area: number;
    total: number;
    calculation?: {
        qArea: number;
        qStaff: number;
        qVisitors: number;
        qBase: number;
        kZone: number;
        kIntensity: number;
        kReserve: number;
        monthlyOrder: number;
        annualConsumption: number;
        annualBudget: number;
        reorderPoint?: number;
        safetyStock?: number;
        formula?: string;
        breakdown?: string;
    };
    norms?: {
        area: number;
        personnel: number;
        intensity?: number;
        replacementCycle?: number;
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
    totalGoods?: number;
    totalDelivery?: number;
    totalVat?: number;
    grandTotal?: number;
}

export interface Interaction {
    id: number | string;
    type: string;
    user: string;
    timestamp: string;
    text: string;
    badge?: string;
    avatar?: string;
}

export interface Calculation {
    id: number | string;
    organizationName: string;
    type?: string;
    status: CalculationStatus;
    zones: string[];
    zoneDetails?: Zone[];
    totalArea: number;
    zonesCount: number;
    staffCount: number;
    dailyVisitors: number;
    sanitaryLevel: string;
    intensityLevel?: string;
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
    version_number?: number;
    manager_adjustments?: Record<string, unknown>;
    locked_at?: string;
    locked_by?: string;
    lock_expires_at?: string;
    final_snapshot?: CalculationResults;
    calculator_config_snapshot?: unknown;
    receipt_path?: string;
    client_name?: string;
    project_number?: number;
    updated_at?: string;
    sla_deadline?: string;
    last_status_change_at?: string;
    client_inn?: string;
    client_address?: string;
    client_organization_name?: string;
    venue_id?: string;
    source_id?: string;
    manager_data?: {
        first_name?: string;
        last_name?: string;
        organization_name?: string;
    };
}
