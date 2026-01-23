import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import type { ActionResult, VoidResult } from '@/core/types/results';
import { logger } from '@/core/logging/index.ts';

export const VenueSchema = z.object({
    id: z.string().uuid(),
    user_id: z.string().uuid(),
    name: z.string().min(1, 'Название обязательно'),
    type: z.enum([
        'restaurant',
        'cafe',
        'bar',
        'hotel',
        'production_food',
        'production_nonfood',
        'beauty',
        'mall',
        'other',
    ]),
    total_area: z.number().nonnegative(),
    seating_capacity: z.number().int().nonnegative().optional(),
    staff_count: z.number().int().nonnegative(),
    daily_visitors: z.number().int().nonnegative(),
    address: z.string().optional().nullable(),
    sanitary_level: z.string().optional(),
    intensity_level: z.string().optional(),
    created_at: z.string(),
});

export type Venue = z.infer<typeof VenueSchema>;

export type CreateVenueData = Omit<Venue, 'id' | 'user_id' | 'created_at'>;

export interface IVenueService {
    getVenues(): Promise<ActionResult<Venue[]>>;
    createVenue(data: CreateVenueData): Promise<ActionResult<Venue>>;
    updateVenue(id: string, data: Partial<CreateVenueData>): Promise<ActionResult<Venue>>;
    deleteVenue(id: string): Promise<VoidResult>;
}

export class VenueService implements IVenueService {
    private supabase: SupabaseClient;

    constructor(supabase: SupabaseClient) {
        this.supabase = supabase;
    }

    private wrapError(error: unknown): { message: string } {
        return { message: error instanceof Error ? error.message : String(error) };
    }

    async getVenues(): Promise<ActionResult<Venue[]>> {
        try {
            const { data, error } = await this.supabase
                .from('venues')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) return { success: false, error: this.wrapError(error) };

            const validated = z.array(VenueSchema).safeParse(data);
            if (!validated.success) {
                logger.error('[VenueService:Validation:Error]', { error: validated.error });
                return { success: false, error: { message: 'Data format error in venues list' } };
            }

            return { success: true, data: validated.data };
        } catch (error) {
            return { success: false, error: this.wrapError(error) };
        }
    }

    async createVenue(data: CreateVenueData): Promise<ActionResult<Venue>> {
        try {
            const {
                data: { user },
            } = await this.supabase.auth.getUser();
            if (!user) return { success: false, error: { message: 'Not authenticated' } };

            const { data: venue, error } = await this.supabase
                .from('venues')
                .insert({
                    ...data,
                    user_id: user.id,
                })
                .select()
                .single();

            if (error) return { success: false, error: this.wrapError(error) };

            const validated = VenueSchema.safeParse(venue);
            if (!validated.success) {
                logger.error('[VenueService:Create:Validation:Error]', { error: validated.error });
                return { success: false, error: { message: 'Invalid data format after creation' } };
            }

            return { success: true, data: validated.data };
        } catch (error) {
            return { success: false, error: this.wrapError(error) };
        }
    }

    async updateVenue(id: string, data: Partial<CreateVenueData>): Promise<ActionResult<Venue>> {
        try {
            const { data: venue, error } = await this.supabase
                .from('venues')
                .update(data)
                .eq('id', id)
                .select()
                .single();

            if (error) return { success: false, error: this.wrapError(error) };

            const validated = VenueSchema.safeParse(venue);
            if (!validated.success) {
                logger.error('[VenueService:Update:Validation:Error]', { error: validated.error });
                return { success: false, error: { message: 'Invalid data format after update' } };
            }

            return { success: true, data: validated.data };
        } catch (error) {
            return { success: false, error: this.wrapError(error) };
        }
    }

    async deleteVenue(id: string): Promise<VoidResult> {
        try {
            const { error } = await this.supabase.from('venues').delete().eq('id', id);

            if (error) return { success: false, error: this.wrapError(error) };
            return { success: true };
        } catch (error) {
            return { success: false, error: this.wrapError(error) };
        }
    }
}
