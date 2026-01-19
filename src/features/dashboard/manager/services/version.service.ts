import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { wrapError } from '@/core/utils/errors';
import type { ActionResult } from '@/core/types/results';

const SnapshotDataSchema = z.object({
    summary: z.array(z.object({
        inventory: z.string().optional(),
        quantity: z.number().optional(),
    })).optional(),
    totalAnnualBudget: z.number().optional(),
}).catchall(z.unknown());

export const CalculationVersionSchema = z.object({
    id: z.string().uuid(),
    calculation_id: z.string().uuid(),
    version_number: z.number(),
    snapshot_data: SnapshotDataSchema,
    created_at: z.string(),
    created_by: z.string().uuid().nullable(),
    change_reason: z.string().nullable().optional(),
});

export type CalculationVersion = z.infer<typeof CalculationVersionSchema>;

export interface IVersionService {
    createSnapshot(
        calculationId: string,
        data: Record<string, unknown>,
        reason?: string
    ): Promise<ActionResult<CalculationVersion>>;
    getVersions(calculationId: string): Promise<ActionResult<CalculationVersion[]>>;
    getVersion(versionId: string): Promise<ActionResult<CalculationVersion>>;
}

export class VersionService implements IVersionService {
    private supabase: SupabaseClient;
    constructor(supabase: SupabaseClient) {
        this.supabase = supabase;
    }

    async createSnapshot(
        calculationId: string,
        data: Record<string, unknown>,
        reason?: string
    ): Promise<ActionResult<CalculationVersion>> {
        try {
            const {
                data: { user },
            } = await this.supabase.auth.getUser();

            // Find current max version number
            const { data: latestVersion } = await this.supabase
                .from('calculation_versions')
                .select('version_number')
                .eq('calculation_id', calculationId)
                .order('version_number', { ascending: false })
                .limit(1)
                .maybeSingle();

            const nextVersion = (latestVersion?.version_number || 0) + 1;

            const { data: newVersion, error } = await this.supabase
                .from('calculation_versions')
                .insert({
                    calculation_id: calculationId,
                    version_number: nextVersion,
                    snapshot_data: data,
                    created_by: user?.id,
                    change_reason: reason,
                })
                .select()
                .single();

            if (error) return { success: false, error: wrapError(error) };

            return { success: true, data: newVersion as CalculationVersion };
        } catch (error) {
            return { success: false, error: wrapError(error) };
        }
    }

    async getVersions(calculationId: string): Promise<ActionResult<CalculationVersion[]>> {
        try {
            const { data, error } = await this.supabase
                .from('calculation_versions')
                .select('*')
                .eq('calculation_id', calculationId)
                .order('version_number', { ascending: false });

            if (error) return { success: false, error: wrapError(error) };

            return { success: true, data: data as CalculationVersion[] };
        } catch (error) {
            return { success: false, error: wrapError(error) };
        }
    }

    async getVersion(versionId: string): Promise<ActionResult<CalculationVersion>> {
        try {
            const { data, error } = await this.supabase
                .from('calculation_versions')
                .select('*')
                .eq('id', versionId)
                .single();

            if (error) return { success: false, error: wrapError(error) };

            return { success: true, data: data as CalculationVersion };
        } catch (error) {
            return { success: false, error: wrapError(error) };
        }
    }
}
