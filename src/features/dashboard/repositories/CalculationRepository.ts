import { type SupabaseClient } from '@supabase/supabase-js';
import type { Calculation, CalculationResults } from '../dashboard.types';
import { type ILogger } from '@/core/logging/LogManager';
import { CalculationMapper } from '../mappers/CalculationMapper';
import {
    type PaginationParams,
    type PaginatedResult,
    calculateOffset,
    createPaginatedResult,
} from '@/core/types/pagination';

export type { PaginationParams, PaginatedResult };
import type { ActionResult, VoidResult } from '@/core/types/results';

export interface ICalculationRepository {
    getById(id: string | number): Promise<ActionResult<Calculation>>;
    getByUserId(userId: string): Promise<ActionResult<Calculation[]>>;
    getUnassigned(): Promise<ActionResult<Calculation[]>>;
    getManagerWorkload(managerId: string): Promise<ActionResult<Calculation[]>>;

    // Server-Side Pagination
    getPaginated(
        params: PaginationParams & {
            status?: string;
            search?: string;
            managerId?: string | null;
            sortBy?: string;
            sortOrder?: 'asc' | 'desc';
        }
    ): Promise<ActionResult<PaginatedResult<Calculation>>>;

    // CRUD
    create(calc: Partial<Calculation>, userId: string): Promise<ActionResult<Calculation>>;
    updateContent(
        id: string | number,
        updates: Partial<Calculation>
    ): Promise<ActionResult<Calculation>>;
    delete(id: string | number): Promise<VoidResult>;

    executeAction(
        id: string | number,
        action: string,
        message?: string,
        payload?: Record<string, unknown>
    ): Promise<ActionResult<Calculation>>;
    adjustCalculationExpert(
        id: string | number,
        results: CalculationResults,
        adjustments: Record<string, unknown>,
        version: number
    ): Promise<ActionResult<Calculation>>;
    acquireLock(id: string | number): Promise<ActionResult<Calculation>>;
    releaseLock(id: string | number): Promise<ActionResult<Calculation>>;
    uploadFile(path: string, file: File | Blob, bucket: string): Promise<VoidResult>;
    createSignedUrl(path: string, bucket: string, expiresIn: number): Promise<ActionResult<string>>;
}

export class CalculationRepository implements ICalculationRepository {
    private client: SupabaseClient;
    private logger: ILogger;

    constructor(client: SupabaseClient, logger: ILogger) {
        this.client = client;
        this.logger = logger;
    }

    private readonly PROJECT_SELECT =
        '*, manager_info:profiles!manager_id(organization_name, first_name, last_name), client_info:profiles!user_id(organization_name, first_name, last_name, inn, address)';

    private wrapError(error: unknown): { message: string } {
        return { message: error instanceof Error ? error.message : String(error) };
    }

    async getById(id: string | number): Promise<ActionResult<Calculation>> {
        try {
            const { data, error } = await this.client
                .from('calculations')
                .select(this.PROJECT_SELECT)
                .eq('id', id)
                .single();

            if (error) return { success: false, error: this.wrapError(error) };
            return { success: true, data: CalculationMapper.mapToEntity(data) };
        } catch (error) {
            return { success: false, error: this.wrapError(error) };
        }
    }

    async getByUserId(userId: string): Promise<ActionResult<Calculation[]>> {
        try {
            const { data, error } = await this.client
                .from('calculations')
                .select(this.PROJECT_SELECT)
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) return { success: false, error: this.wrapError(error) };
            return { success: true, data: (data || []).map((d) => CalculationMapper.mapToEntity(d)) };
        } catch (error) {
            return { success: false, error: this.wrapError(error) };
        }
    }

    async getUnassigned(): Promise<ActionResult<Calculation[]>> {
        try {
            const { data, error } = await this.client
                .from('calculations')
                .select(this.PROJECT_SELECT)
                .is('manager_id', null)
                .order('created_at', { ascending: false });

            if (error) return { success: false, error: this.wrapError(error) };
            return { success: true, data: (data || []).map((d) => CalculationMapper.mapToEntity(d)) };
        } catch (error) {
            return { success: false, error: this.wrapError(error) };
        }
    }

    async getManagerWorkload(managerId: string): Promise<ActionResult<Calculation[]>> {
        try {
            const { data, error } = await this.client
                .from('calculations')
                .select(this.PROJECT_SELECT)
                .eq('manager_id', managerId)
                .order('created_at', { ascending: false });

            if (error) return { success: false, error: this.wrapError(error) };
            return { success: true, data: (data || []).map((d) => CalculationMapper.mapToEntity(d)) };
        } catch (error) {
            return { success: false, error: this.wrapError(error) };
        }
    }

    async getPaginated(
        params: PaginationParams & {
            status?: string;
            excludeStatus?: string;
            search?: string;
            managerId?: string | null;
            sortBy?: string;
            sortOrder?: 'asc' | 'desc';
        }
    ): Promise<ActionResult<PaginatedResult<Calculation>>> {
        try {
            const { from, to } = calculateOffset(params);

            let query = this.client
                .from('calculations')
                .select(this.PROJECT_SELECT, { count: 'exact' });

            if (params.search) {
                const isNumericSearch = /^\d+$/.test(params.search.replace('#', ''));
                if (isNumericSearch) {
                    const projectNum = parseInt(params.search.replace('#', ''), 10);
                    query = query.or(`project_number.eq.${projectNum},organization_name.ilike.%${params.search}%`);
                } else {
                    query = query.ilike('organization_name', `%${params.search}%`);
                }
            }
            if (params.status) {
                query = query.eq('status', params.status);
            } else if (params.excludeStatus) {
                query = query.neq('status', params.excludeStatus);
            }
            if (params.managerId === null) {
                query = query.is('manager_id', null);
            } else if (params.managerId) {
                query = query.eq('manager_id', params.managerId);
            }

            const { data, error, count } = await query
                .order(params.sortBy || 'created_at', { ascending: params.sortOrder === 'asc' })
                .range(from, to);

            if (error) return { success: false, error: this.wrapError(error) };

            const total = count || 0;
            const mappedData = (data || []).map((d) => CalculationMapper.mapToEntity(d));
            return {
                success: true,
                data: createPaginatedResult(mappedData, params, total),
            };
        } catch (error) {
            return { success: false, error: this.wrapError(error) };
        }
    }

    async create(calc: Partial<Calculation>, userId: string): Promise<ActionResult<Calculation>> {
        try {
            const { data, error } = await this.client
                .from('calculations')
                .insert({
                    user_id: userId,
                    organization_name: calc.organizationName,
                    type: calc.type,
                    total_area: calc.totalArea,
                    staff_count: calc.staffCount,
                    daily_visitors: calc.dailyVisitors,
                    sanitary_level: calc.sanitaryLevel,
                    intensity_level: calc.intensityLevel,
                    replacement_cycle: calc.replacementCycle,
                    zone_details: calc.zoneDetails,
                    results: calc.results,
                    total_cost_value: calc.totalCost,
                    status: calc.status || 'draft',
                    calculator_config_snapshot: calc.calculator_config_snapshot,
                })
                .select(this.PROJECT_SELECT)
                .single();

            if (error) return { success: false, error: this.wrapError(error) };
            return { success: true, data: CalculationMapper.mapToEntity(data) };
        } catch (error) {
            return { success: false, error: this.wrapError(error) };
        }
    }

    async updateContent(
        id: string | number,
        updates: Partial<Calculation>
    ): Promise<ActionResult<Calculation>> {
        try {
            const dbUpdates: Record<string, unknown> = {};
            if (updates.organizationName) dbUpdates.organization_name = updates.organizationName;
            if (updates.type) dbUpdates.type = updates.type;
            if (updates.totalArea) dbUpdates.total_area = updates.totalArea;
            if (updates.staffCount) dbUpdates.staff_count = updates.staffCount;
            if (updates.dailyVisitors) dbUpdates.daily_visitors = updates.dailyVisitors;
            if (updates.sanitaryLevel) dbUpdates.sanitary_level = updates.sanitaryLevel;
            if (updates.intensityLevel) dbUpdates.intensity_level = updates.intensityLevel;
            if (updates.replacementCycle) dbUpdates.replacement_cycle = updates.replacementCycle;
            if (updates.zoneDetails) dbUpdates.zone_details = updates.zoneDetails;
            if (updates.results) dbUpdates.results = updates.results;
            if (updates.totalCost !== undefined) dbUpdates.total_cost_value = updates.totalCost;
            if (updates.receipt_path !== undefined) dbUpdates.receipt_path = updates.receipt_path;
            if (updates.calculator_config_snapshot !== undefined) dbUpdates.calculator_config_snapshot = updates.calculator_config_snapshot;

            const { data, error } = await this.client
                .from('calculations')
                .update(dbUpdates)
                .eq('id', id)
                .select(this.PROJECT_SELECT)
                .single();

            if (error) return { success: false, error: this.wrapError(error) };
            return { success: true, data: CalculationMapper.mapToEntity(data) };
        } catch (error) {
            return { success: false, error: this.wrapError(error) };
        }
    }

    async delete(id: string | number): Promise<VoidResult> {
        try {
            const { error } = await this.client.from('calculations').delete().eq('id', id);

            if (error) return { success: false, error: this.wrapError(error) };
            return { success: true };
        } catch (error) {
            return { success: false, error: this.wrapError(error) };
        }
    }

    async executeAction(
        id: string | number,
        action: string,
        message?: string,
        payload?: Record<string, unknown>
    ): Promise<ActionResult<Calculation>> {
        try {
            this.logger.info('Calling perform_calculation_action', {
                p_calculation_id: id,
                p_action_type: action,
                p_message: message || '',
                p_payload: payload || {},
            });

            const { data, error } = await this.client.rpc('perform_calculation_action', {
                p_calculation_id: id,
                p_action_type: action,
                p_message: message || '',
                p_payload: payload || {},
            });

            if (error) return { success: false, error: this.wrapError(error) };
            if (!data || data.length === 0) return { success: false, error: { message: 'Unexpected empty response from server' } };

            return { success: true, data: CalculationMapper.mapToEntity(data[0]) };
        } catch (error) {
            return { success: false, error: this.wrapError(error) };
        }
    }

    async adjustCalculationExpert(
        id: string | number,
        results: CalculationResults,
        adjustments: Record<string, unknown>,
        version: number
    ): Promise<ActionResult<Calculation>> {
        try {
            const { data, error } = await this.client.rpc('adjust_calculation_expert', {
                p_calculation_id: id,
                p_results: results,
                p_adjustments: adjustments,
                p_current_version: version,
            });

            if (error) return { success: false, error: this.wrapError(error) };
            if (!data || data.length === 0) return { success: false, error: { message: 'Failed to adjust: No data returned' } };
            
            return { success: true, data: CalculationMapper.mapToEntity(data[0]) };
        } catch (error) {
            return { success: false, error: this.wrapError(error) };
        }
    }

    async acquireLock(id: string | number): Promise<ActionResult<Calculation>> {
        try {
            const { data, error } = await this.client.rpc('acquire_calculation_lock', {
                p_calculation_id: id,
            });
            if (error) return { success: false, error: this.wrapError(error) };
            if (!data || data.length === 0) return { success: false, error: { message: 'Failed to acquire lock' } };

            return { success: true, data: CalculationMapper.mapToEntity(data[0]) };
        } catch (error) {
            return { success: false, error: this.wrapError(error) };
        }
    }

    async releaseLock(id: string | number): Promise<ActionResult<Calculation>> {
        try {
            const { data, error } = await this.client.rpc('release_calculation_lock', {
                p_calculation_id: id,
            });
            if (error) return { success: false, error: this.wrapError(error) };
            if (!data || data.length === 0) return { success: false, error: { message: 'Failed to release lock' } };

            return { success: true, data: CalculationMapper.mapToEntity(data[0]) };
        } catch (error) {
            return { success: false, error: this.wrapError(error) };
        }
    }

    async uploadFile(path: string, file: File | Blob, bucket: string): Promise<VoidResult> {
        try {
            const { error } = await this.client.storage
                .from(bucket)
                .upload(path, file, { cacheControl: '3600', upsert: true });

            if (error) return { success: false, error: this.wrapError(error) };
            return { success: true };
        } catch (error) {
            return { success: false, error: this.wrapError(error) };
        }
    }

    async createSignedUrl(
        path: string,
        bucket: string,
        expiresIn: number
    ): Promise<ActionResult<string>> {
        try {
            const { data, error } = await this.client.storage
                .from(bucket)
                .createSignedUrl(path, expiresIn);

            if (error) return { success: false, error: this.wrapError(error) };
            return { success: true, data: data.signedUrl };
        } catch (error) {
            return { success: false, error: this.wrapError(error) };
        }
    }
}
