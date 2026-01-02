import { supabase } from './supabase'
import type { Calculation, CalculationResults, Zone, CalculationStatus } from '@/features/dashboard/dashboard.types'

export interface CalculationDB {
    id: string;
    user_id: string;
    organization_name: string;
    type: string;
    status: CalculationStatus;
    zone_details: Zone[];
    total_area: number;
    zones_count: number;
    staff_count: number;
    daily_visitors: number;
    sanitary_level: string;
    replacement_cycle: string;
    results: CalculationResults | null;
    manager_id: string | null;
    created_at: string;
    updated_at: string;
    profiles?: {
        organization_name: string;
    },
    manager?: {
        organization_name: string;
    }
}

/**
 * Service for managing calculations and project pipeline.
 * Handles mapping between Database (snake_case) and Entity (camelCase) formats.
 */
export const calculationsService = {
    async getMyCalculations(): Promise<Calculation[]> {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('User not authenticated')

        const { data, error } = await supabase
            .from('calculations')
            .select('*, manager_info:profiles!manager_id(organization_name)')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        if (error) throw error

        return (data || []).map(db => this.mapToEntity(db))
    },

    async getUnassignedCalculations(): Promise<Calculation[]> {
        const { data, error } = await supabase
            .from('calculations')
            .select('*, manager_info:profiles!manager_id(organization_name)')
            .is('manager_id', null)
            .neq('status', 'draft')
            .order('created_at', { ascending: false })

        if (error) throw error
        return (data || []).map(db => this.mapToEntity(db))
    },

    async getManagerWorkload(): Promise<Calculation[]> {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('User not authenticated')

        const { data, error } = await supabase
            .from('calculations')
            .select('*, manager_info:profiles!manager_id(organization_name)')
            .eq('manager_id', user.id)
            .order('updated_at', { ascending: false })

        if (error) throw error
        return (data || []).map(db => this.mapToEntity(db))
    },

    async assignToMe(calculationId: string | number): Promise<Calculation> {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('User not authenticated')

        const { data, error } = await supabase
            .from('calculations')
            .update({
                manager_id: user.id,
                updated_at: new Date().toISOString()
            })
            .eq('id', calculationId)
            .select('*, manager_info:profiles!manager_id(organization_name)')
            .single()

        if (error) throw error
        return this.mapToEntity(data)
    },

    async createCalculation(calc: Partial<Calculation>): Promise<Calculation> {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('User not authenticated')

        const dbObject = {
            user_id: user.id,
            organization_name: calc.organizationName,
            type: calc.type,
            status: calc.status || 'draft',
            zone_details: calc.zoneDetails,
            total_area: calc.totalArea,
            zones_count: calc.zonesCount,
            staff_count: calc.staffCount,
            daily_visitors: calc.dailyVisitors,
            sanitary_level: calc.sanitaryLevel,
            replacement_cycle: calc.replacementCycle,
            results: calc.results,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }

        const { data, error } = await supabase
            .from('calculations')
            .insert(dbObject)
            .select('*, manager_info:profiles!manager_id(organization_name)')
            .single()

        if (error) throw error
        return this.mapToEntity(data)
    },

    async updateCalculation(id: string | number, updates: Partial<Calculation>): Promise<Calculation> {
        const dbUpdates: Record<string, unknown> = {
            updated_at: new Date().toISOString()
        }

        if (updates.organizationName) dbUpdates.organization_name = updates.organizationName
        if (updates.status) dbUpdates.status = updates.status
        if (updates.zoneDetails) {
            dbUpdates.zone_details = updates.zoneDetails
            dbUpdates.zones_count = updates.zoneDetails.length
        }
        if (updates.results) dbUpdates.results = updates.results
        if (updates.type) dbUpdates.type = updates.type
        if (updates.totalArea) dbUpdates.total_area = updates.totalArea
        if (updates.staffCount) dbUpdates.staff_count = updates.staffCount
        if (updates.dailyVisitors) dbUpdates.daily_visitors = updates.dailyVisitors
        if (updates.sanitaryLevel) dbUpdates.sanitary_level = updates.sanitaryLevel
        if (updates.replacementCycle) dbUpdates.replacement_cycle = updates.replacementCycle

        const { data, error } = await supabase
            .from('calculations')
            .update(dbUpdates)
            .eq('id', id)
            .select('*, manager_info:profiles!manager_id(organization_name)')
            .single()

        if (error) throw error
        return this.mapToEntity(data)
    },

    async deleteCalculation(id: string | number): Promise<void> {
        const { error } = await supabase
            .from('calculations')
            .delete()
            .eq('id', id)

        if (error) throw error
    },

    mapToEntity(db: any): Calculation {
        const results = db.results as CalculationResults | null;
        const totalCost = results?.summary?.reduce((sum: number, item: any) => sum + (item.total * item.price), 0) || 0;

        // Supabase might return joined data as an object or an array of one object
        const mInfo = db.manager_info;
        const managerData = Array.isArray(mInfo) ? mInfo[0] : mInfo;
        const managerName = managerData?.organization_name || 'Назначается';

        return {
            id: db.id,
            user_id: db.user_id,
            manager_id: db.manager_id || undefined,
            organizationName: db.organization_name,
            type: db.type,
            status: db.status,
            zones: (db.zone_details as Zone[] || []).map(z => z.name),
            zoneDetails: db.zone_details,
            totalArea: db.total_area,
            zonesCount: db.zones_count,
            staffCount: db.staff_count,
            dailyVisitors: db.daily_visitors,
            sanitaryLevel: db.sanitary_level,
            replacementCycle: db.replacement_cycle,
            createdDate: new Date(db.created_at).toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            }),
            manager: managerName,
            comments: [],
            unreadComments: 0,
            results: results,
            totalCost: totalCost
        }
    }
}
