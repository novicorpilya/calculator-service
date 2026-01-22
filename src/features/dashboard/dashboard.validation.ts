import { z } from 'zod';

/**
 * Zod schema for Inventory Item Breakdown Calculation
 */
export const inventoryCalculationSchema = z.object({
    qArea: z.number().catch(0),
    qStaff: z.number().catch(0),
    qVisitors: z.number().catch(0),
    qBase: z.number().catch(0),
    qBaseSelected: z.number().optional(),
    kZone: z.number().catch(1),
    kIntensity: z.number().catch(1),
    kReserve: z.number().catch(0),
    monthlyOrder: z.number().catch(0),
    annualConsumption: z.number().catch(0),
    annualBudget: z.number().catch(0),
    reorderPoint: z.number().catch(0),
    safetyStock: z.number().catch(0),
    formula: z.string().catch(''),
    breakdown: z.string().catch(''),
});

/**
 * Zod schema for Inventory Item
 */
export const inventoryItemSchema = z.object({
    inventory: z.string(),
    sku: z.string().optional(),
    color: z.string().catch('white'),
    quantity: z.number().catch(0),
    price: z.number().catch(0),
    stock: z.number().catch(0),
    unit: z.string().optional(),
    supplier_id: z.string().optional(),
    norm_area: z.number().catch(0),
    total: z.number().catch(0),
    category: z.string().optional(),
    tier: z.number().optional(),
    durability: z.number().optional(),
    series: z.string().optional(),
    compliance_level: z.string().optional(),
    calculation: inventoryCalculationSchema.optional(),
});

/**
 * Zod schema for Zone Result
 */
export const zoneResultSchema = z.object({
    zoneName: z.string(),
    area: z.union([z.string(), z.number()]).transform((v) => String(v)),
    type: z.string(),
    color: z.string(),
    items: z.array(inventoryItemSchema).catch([]),
});

/**
 * Zod schema for Calculation Results (JSONB in DB)
 */
export const calculationResultsSchema = z.object({
    byZone: z.array(zoneResultSchema).catch([]),
    summary: z.array(inventoryItemSchema).catch([]),
});

/**
 * Zod schema for the RAW database row (snake_case)
 */
export const rawDBCalculationSchema = z.object({
    id: z.union([z.string(), z.number()]),
    user_id: z.string(),
    manager_id: z.string().nullable().optional(),
    organization_name: z.string(),
    type: z.string().optional(),
    status: z.string(),
    zone_details: z.array(z.any()).catch([]),
    total_area: z.number().catch(0),
    zones_count: z.number().catch(0),
    staff_count: z.number().catch(0),
    daily_visitors: z.number().catch(0),
    sanitary_level: z.string(),
    intensity_level: z.string().optional(),
    replacement_cycle: z.string(),
    results: calculationResultsSchema.nullable().catch(null),
    history: z.array(z.any()).catch([]),
    created_at: z.string(),
    updated_at: z.string(),
    total_cost_value: z.number().optional().catch(0),
    total_items_count: z.number().optional().catch(0),
    version_number: z.number().optional().default(1),
    manager_adjustments: z.record(z.string(), z.any()).catch({}).optional(),
    locked_at: z.string().nullable().optional(),
    locked_by: z.string().nullable().optional(),
    lock_expires_at: z.string().nullable().optional(),
    final_snapshot: calculationResultsSchema.nullable().optional().catch(null),
    calculator_config_snapshot: z.any().nullable().optional(),
    receipt_path: z.string().nullable().optional(),
    project_number: z.number().nullable().optional(),
    manager_info: z.any().optional(), // Joined data
    client_info: z.any().optional(), // Joined data
    venue_id: z.string().nullable().optional(),
    source_id: z.string().nullable().optional(),
    sla_deadline: z.string().nullable().optional(),
});

export type RawDBCalculation = z.infer<typeof rawDBCalculationSchema>;
