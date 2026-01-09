import { z } from 'zod';
import { type SupabaseClient } from '@supabase/supabase-js';
import type { Calculation, CalculationStatus, CalculationResults, Zone, Interaction } from '../dashboard.types';
import { InfrastructureError } from '@/core/errors/AppErrors';
import { type ILogger } from '@/core/logging/LogManager';

// --- Zod Schemas for Runtime Validation ---

const ZoneSchema = z.object({
    id: z.custom<string | number>(), // Accept both to satisfy Zone type
    name: z.string(),
    area: z.number().or(z.string()).optional(),
    type: z.string().optional(),
    staffCount: z.number().or(z.string()).optional(),
    color: z.string().optional()
});

// NOTE: ManagerInfoSchema removed - manager info validated at DB level



export interface PaginationParams {
    page: number;
    pageSize: number;
    search?: string;
    sortBy?: 'created_at' | 'updated_at' | 'organization_name' | 'total_cost_value';
    sortOrder?: 'asc' | 'desc';
    status?: CalculationStatus;
    managerId?: string | null; // null = unassigned
}

export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export interface ICalculationRepository {
    getById(id: string | number): Promise<Calculation>;
    getByUserId(userId: string): Promise<Calculation[]>;
    getUnassigned(): Promise<Calculation[]>;
    getManagerWorkload(managerId: string): Promise<Calculation[]>;

    // Server-Side Pagination
    getPaginated(params: PaginationParams): Promise<PaginatedResult<Calculation>>;

    // CRUD
    create(calc: Partial<Calculation>, userId: string): Promise<Calculation>;
    updateContent(id: string | number, updates: Partial<Calculation>): Promise<Calculation>;
    delete(id: string | number): Promise<void>;

    executeAction(id: string | number, action: string, message?: string, payload?: Record<string, unknown>): Promise<Calculation>;
    adjustCalculationExpert(id: string | number, results: CalculationResults, adjustments: Record<string, any>, version: number): Promise<Calculation>;
}

// Internal DB Interface (Strictly Typed)
interface CalculationDB {
    id: number;
    user_id: string;
    manager_id?: string | null;
    organization_name: string;
    type?: string;
    status: string;
    zone_details?: z.infer<typeof ZoneSchema>[]; // JSONB array
    total_area: number;
    zones_count: number;
    staff_count: number;
    daily_visitors: number;
    sanitary_level: string;
    replacement_cycle: string;
    results: CalculationResults | null;
    history: Interaction[];
    created_at: string;
    updated_at: string;
    total_cost_value?: number;
    total_items_count?: number;
    version_number?: number;
    manager_adjustments?: Record<string, any>;
    locked_at?: string;
    final_snapshot?: CalculationResults;
    receipt_path?: string;
    manager_info?: {
        first_name?: string | null;
        last_name?: string | null;
        organization_name?: string | null;
    };
    client_info?: {
        first_name?: string | null;
        last_name?: string | null;
    };
    project_number?: number;
}

export class CalculationRepository implements ICalculationRepository {
    private client: SupabaseClient;
    private logger: ILogger;

    constructor(client: SupabaseClient, logger: ILogger) {
        this.client = client;
        this.logger = logger;
    }

    private mapToEntity(db: CalculationDB): Calculation {
        const results = db.results;
        const totalCost = db.total_cost_value || 0;

        const mInfo = db.manager_info;
        const managerData = Array.isArray(mInfo) ? mInfo[0] : mInfo;
        const cInfo = db.client_info;
        const clientData = Array.isArray(cInfo) ? cInfo[0] : cInfo;

        let managerName = 'Назначается';
        if (managerData) {
            const fullName = `${managerData.first_name || ''} ${managerData.last_name || ''}`.trim();
            managerName = fullName || 'Специалист';
        }

        const clientName = clientData ? clientData.first_name || 'Клиент' : 'Клиент';

        // 10/10 Validation: Ensure JSONB fields are valid
        const zonesParse = z.array(ZoneSchema).safeParse(db.zone_details || []);
        if (!zonesParse.success) {
            this.logger.warn(`Invalid zone_details for calculation ${db.id}`, zonesParse.error);
        }
        const validZones = zonesParse.success ? zonesParse.data : [];

        return {
            id: db.id,
            user_id: db.user_id,
            manager_id: db.manager_id || undefined,
            organizationName: db.organization_name,
            type: db.type,
            status: db.status as CalculationStatus,
            zones: validZones.map(z => z.name),
            zoneDetails: validZones as Zone[],
            totalArea: db.total_area,
            zonesCount: db.zones_count,
            staffCount: db.staff_count,
            dailyVisitors: db.daily_visitors, // Fixed mapping key
            sanitaryLevel: db.sanitary_level,
            replacementCycle: db.replacement_cycle,
            createdDate: db.created_at, // Return ISO string, let UI format it to avoid TZ issues
            manager: managerName,
            comments: [],
            unreadComments: 0,
            results: results,
            totalCost: totalCost,
            history: db.history || [],
            version_number: db.version_number || 1,
            manager_adjustments: db.manager_adjustments || {},
            locked_at: db.locked_at,
            final_snapshot: db.final_snapshot,
            receipt_path: db.receipt_path,
            client_name: clientName,
            project_number: db.project_number
        };
    }

    async getById(id: string | number): Promise<Calculation> {
        const { data, error } = await this.client
            .from('calculations')
            .select('*, manager_info:profiles!manager_id(first_name, last_name, organization_name), client_info:profiles!user_id(first_name, last_name)')
            .eq('id', id)
            .single();

        if (error) {
            this.logger.error('Failed to get calculation', { id }, error);
            throw new InfrastructureError('FETCH_CALCULATION_FAILED', error);
        }
        return this.mapToEntity(data as CalculationDB);
    }

    async getByUserId(userId: string): Promise<Calculation[]> {
        const { data, error } = await this.client
            .from('calculations')
            .select('*, manager_info:profiles!manager_id(organization_name, first_name, last_name), client_info:profiles!user_id(first_name, last_name)')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            this.logger.error('Failed to get user calculations', { userId }, error);
            throw new InfrastructureError('FETCH_MY_CALCULATIONS_FAILED', error);
        }
        return (data || []).map((db: CalculationDB) => this.mapToEntity(db));
    }

    async getUnassigned(): Promise<Calculation[]> {
        const { data, error } = await this.client
            .from('calculations')
            .select('*, manager_info:profiles!manager_id(organization_name, first_name, last_name)')
            .is('manager_id', null)
            .neq('status', 'draft')
            .order('created_at', { ascending: false });

        if (error) {
            this.logger.error('Failed to get unassigned calculations', null, error);
            throw new InfrastructureError('FETCH_UNASSIGNED_FAILED', error);
        }
        return (data || []).map((db: CalculationDB) => this.mapToEntity(db));
    }

    async getManagerWorkload(managerId: string): Promise<Calculation[]> {
        const { data, error } = await this.client
            .from('calculations')
            .select('*, manager_info:profiles!manager_id(organization_name, first_name, last_name)')
            .eq('manager_id', managerId)
            .order('updated_at', { ascending: false });

        if (error) {
            this.logger.error('Failed to get manager workload', { managerId }, error);
            throw new InfrastructureError('FETCH_WORKLOAD_FAILED', error);
        }
        return (data || []).map((db: CalculationDB) => this.mapToEntity(db));
    }

    /**
     * Server-Side Paginated Query
     * Supports: search, filter by status/manager, sort, pagination
     */
    async getPaginated(params: PaginationParams): Promise<PaginatedResult<Calculation>> {
        const { page, pageSize, search, sortBy = 'created_at', sortOrder = 'desc', status, managerId } = params;
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        // Build query
        let query = this.client
            .from('calculations')
            .select('*, manager_info:profiles!manager_id(organization_name, first_name, last_name), client_info:profiles!user_id(first_name, last_name)', { count: 'exact' });

        // Filter by manager
        if (managerId === null) {
            query = query.is('manager_id', null).neq('status', 'draft');
        } else if (managerId) {
            query = query.eq('manager_id', managerId);
        }

        // Filter by status
        if (status) {
            query = query.eq('status', status);
        }

        // Search by organization name
        if (search && search.trim()) {
            query = query.ilike('organization_name', `%${search.trim()}%`);
        }

        // Order
        query = query.order(sortBy, { ascending: sortOrder === 'asc' });

        // Pagination
        query = query.range(from, to);

        const { data, error, count } = await query;

        if (error) {
            this.logger.error('Failed to get paginated calculations', params, error);
            throw new InfrastructureError('FETCH_PAGINATED_FAILED', error);
        }

        const total = count || 0;
        return {
            data: (data || []).map((db: CalculationDB) => this.mapToEntity(db)),
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize)
        };
    }

    // ATOMIC CREATE IMPLEMENTATION
    async create(calc: Partial<Calculation>, userId: string): Promise<Calculation> {
        // Use the Atomic RPC instead of raw INSERT
        const { data, error } = await this.client.rpc('create_calculation_atomic', {
            p_payload: {
                ...calc,
                status: calc.status || 'draft'
            }
        });

        if (error) {
            this.logger.error('Failed to create calculation atomically', { userId }, error);
            throw new InfrastructureError('CREATE_CALCULATION_FAILED', error);
        }

        // RPC returns the created row
        // We might need to fetch manager info if RPC doesn't return joined data
        // For efficiency, map what we have, and UI can refetch if needed, or we fetch here.
        // Given 'create', manager is usually null/system.

        return this.mapToEntity(data as CalculationDB);
    }

    async updateContent(id: string | number, updates: Partial<Calculation>): Promise<Calculation> {
        const dbUpdates: Partial<CalculationDB> = {};
        if (updates.organizationName !== undefined) dbUpdates.organization_name = updates.organizationName;
        if (updates.type !== undefined) dbUpdates.type = updates.type;
        if (updates.zoneDetails !== undefined) {
            dbUpdates.zone_details = updates.zoneDetails as unknown as CalculationDB['zone_details']; // Align with DB schema
            dbUpdates.zones_count = updates.zoneDetails.length;
        }
        if (updates.totalArea !== undefined) dbUpdates.total_area = updates.totalArea;
        if (updates.staffCount !== undefined) dbUpdates.staff_count = updates.staffCount;
        if (updates.dailyVisitors !== undefined) dbUpdates.daily_visitors = updates.dailyVisitors;
        if (updates.sanitaryLevel !== undefined) dbUpdates.sanitary_level = updates.sanitaryLevel;
        if (updates.replacementCycle !== undefined) dbUpdates.replacement_cycle = updates.replacementCycle;
        if (updates.results !== undefined) {
            dbUpdates.results = updates.results;
            // Pre-calculate metrics for analytics columns
            const summary = updates.results?.summary || [];
            dbUpdates.total_cost_value = summary.reduce((acc, item) => acc + (Number(item.total) || (Number(item.price) * Number(item.quantity) || 0)), 0);
            dbUpdates.total_items_count = summary.length;
        }
        if (updates.receipt_path !== undefined) {
            dbUpdates.receipt_path = updates.receipt_path;
        }

        dbUpdates.updated_at = new Date().toISOString();

        const { data, error } = await this.client
            .from('calculations')
            .update(dbUpdates)
            .eq('id', id)
            .select('*, manager_info:profiles!manager_id(organization_name, first_name, last_name)')
            .single();

        if (error) {
            this.logger.error('Failed to update calculation content', { id }, error);
            throw new InfrastructureError('UPDATE_CALCULATION_FAILED', error);
        }
        return this.mapToEntity(data as CalculationDB);
    }

    async executeAction(id: string | number, action: string, message?: string, payload: Record<string, unknown> = {}): Promise<Calculation> {
        const { data, error } = await this.client.rpc('perform_calculation_action', {
            p_calculation_id: id,
            p_action_type: action,
            p_message: message,
            p_payload: payload
        });

        if (error) {
            this.logger.error('Failed to execute calculation action', { id, action }, error);
            throw new InfrastructureError('EXECUTE_ACTION_FAILED', error);
        }
        return this.mapToEntity(data as CalculationDB);
    }



    async delete(id: string | number): Promise<void> {
        const { error } = await this.client.from('calculations').delete().eq('id', id);
        if (error) {
            this.logger.error('Failed to delete calculation', { id }, error);
            throw new InfrastructureError('DELETE_CALCULATION_FAILED', error);
        }
    }

    async adjustCalculationExpert(id: string | number, results: CalculationResults, adjustments: Record<string, any>, version: number): Promise<Calculation> {
        const { data, error } = await this.client.rpc('adjust_calculation_expert', {
            p_calculation_id: id,
            p_results: results,
            p_adjustments: adjustments,
            p_current_version: version
        });

        if (error) {
            console.error('❌ Supabase RPC Error Details:', {
                message: error.message,
                code: error.code,
                details: error.details,
                hint: error.hint
            });
            throw new InfrastructureError('EXECUTE_ACTION_FAILED', error);
        }

        return this.mapToEntity(data as CalculationDB);
    }
}
