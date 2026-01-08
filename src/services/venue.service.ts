import type { SupabaseClient } from '@supabase/supabase-js';

export interface Venue {
    id: string;
    owner_id: string;
    name: string;
    type: 'restaurant' | 'cafe' | 'bar' | 'hotel' | 'other';
    total_area: number;
    seating_capacity: number;
    staff_count: number;
    visitors_per_day: number;
    address?: string;
    created_at: string;
}

export type CreateVenueData = Omit<Venue, 'id' | 'owner_id' | 'created_at'>;

export interface IVenueService {
    getVenues(): Promise<Venue[]>;
    createVenue(data: CreateVenueData): Promise<Venue>;
    updateVenue(id: string, data: Partial<CreateVenueData>): Promise<Venue>;
    deleteVenue(id: string): Promise<void>;
}

export class VenueService implements IVenueService {
    private supabase: SupabaseClient;

    constructor(supabase: SupabaseClient) {
        this.supabase = supabase;
    }

    async getVenues(): Promise<Venue[]> {
        const { data, error } = await this.supabase
            .from('venues')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    async createVenue(data: CreateVenueData): Promise<Venue> {
        const { data: { user } } = await this.supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data: venue, error } = await this.supabase
            .from('venues')
            .insert({
                ...data,
                owner_id: user.id
            })
            .select()
            .single();

        if (error) throw error;
        return venue;
    }

    async updateVenue(id: string, data: Partial<CreateVenueData>): Promise<Venue> {
        const { data: venue, error } = await this.supabase
            .from('venues')
            .update(data)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return venue;
    }

    async deleteVenue(id: string): Promise<void> {
        const { error } = await this.supabase
            .from('venues')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
}
