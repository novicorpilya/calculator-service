import { supabase } from './supabase'

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

/**
 * Service for managing user venues/locations.
 */
export const venueService = {
    async getVenues(): Promise<Venue[]> {
        const { data, error } = await supabase
            .from('venues')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async createVenue(data: CreateVenueData): Promise<Venue> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data: venue, error } = await supabase
            .from('venues')
            .insert({
                ...data,
                owner_id: user.id
            })
            .select()
            .single();

        if (error) throw error;
        return venue;
    },

    async updateVenue(id: string, data: Partial<CreateVenueData>): Promise<Venue> {
        const { data: venue, error } = await supabase
            .from('venues')
            .update(data)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return venue;
    },

    async deleteVenue(id: string): Promise<void> {
        const { error } = await supabase
            .from('venues')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
}
