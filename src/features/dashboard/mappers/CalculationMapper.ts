import type { Calculation, CalculationStatus, CalculationResults, Zone } from '../dashboard.types';
import { type RawDBCalculation } from '../dashboard.validation';

export class CalculationMapper {
    /**
     * Maps raw database row (snake_case) to frontend entity (camelCase)
     * Performance Optimized: Avoids heavy validation in high-frequency loops.
     */
    static mapToEntity(dbRaw: unknown): Calculation {
        const db = dbRaw as RawDBCalculation;

        const mInfo = db.manager_info;
        const managerData = Array.isArray(mInfo) ? mInfo[0] : mInfo || null;
        const cInfo = db.client_info;
        const clientData = Array.isArray(cInfo) ? cInfo[0] : cInfo || null;

        const validZones = (db.zone_details || []) as Zone[];

        return {
            id: db.id,
            user_id: db.user_id,
            manager_id: db.manager_id || undefined,
            organizationName: db.organization_name,
            type: db.type || undefined,
            status: db.status as CalculationStatus,
            zones: validZones.map((z) => z.name || 'Zone'),
            zoneDetails: validZones as Zone[],
            totalArea: db.total_area,
            zonesCount: db.zones_count,
            staffCount: db.staff_count,
            dailyVisitors: db.daily_visitors,
            sanitaryLevel: db.sanitary_level,
            intensityLevel: db.intensity_level || undefined,
            replacementCycle: db.replacement_cycle,
            totalCost: db.total_cost_value || 0,
            results: db.results as CalculationResults | null,
            createdDate: db.created_at,
            updated_at: db.updated_at,

            // Raw data for names, to be formatted in ViewModel
            manager: '', // Will be handled by Presentation logic
            manager_data: managerData || undefined,

            comments: [],
            unreadComments: 0,
            project_number: db.project_number ?? undefined,
            version_number: db.version_number,
            receipt_path: db.receipt_path ?? undefined,
            manager_adjustments: db.manager_adjustments,
            locked_at: db.locked_at ?? undefined,
            locked_by: db.locked_by ?? undefined,
            lock_expires_at: db.lock_expires_at ?? undefined,
            final_snapshot: db.final_snapshot || undefined,
            calculator_config_snapshot: db.calculator_config_snapshot || undefined,

            client_name: clientData ? clientData.first_name : undefined,
            client_inn: clientData?.inn || undefined,
            client_address: clientData?.address || undefined,
            client_organization_name: clientData?.organization_name || undefined,

            venue_id: db.venue_id ?? undefined,
            source_id: db.source_id ?? undefined,
            sla_deadline: db.sla_deadline ?? undefined,
        };
    }
}
