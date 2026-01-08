/**
 * @deprecated This service is deprecated in favor of Server-Side Audit Generation.
 * See `scripts/20260105_fix_audit_architecture.sql` and `CalculationRepository.executeAction`.
 * 
 * Do NOT use this to create history entries on the client.
 * The Database is now the source of truth for all Audit Trails.
 */
import type { Interaction, InteractionType } from '@/features/dashboard/dashboard.types';

export interface IAuditService {
    createEntry(type: InteractionType, user: string, text: string, badge?: string): Interaction;
}

export class AuditService implements IAuditService {
    createEntry(type: InteractionType, user: string, text: string, badge?: string): Interaction {
        // Fallback for legacy tests or display simulation only
        return {
            id: Math.random().toString(36).substr(2, 9),
            type,
            user,
            timestamp: new Date().toISOString(),
            text,
            badge
        };
    }
}
