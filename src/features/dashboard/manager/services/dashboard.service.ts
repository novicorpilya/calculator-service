import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { wrapError } from '@/core/utils/errors';
import type { ActionResult } from '@/core/types/results';

export const ManagerStatsSchema = z.object({
    activeProjects: z.number(),
    newLeads: z.number(),
    overdueProjects: z.number(),
    completedThisMonth: z.number(),
    statusDistribution: z.record(z.string(), z.number()),
    workloadByManager: z.record(z.string(), z.number()).optional(),
});

export type ManagerStats = z.infer<typeof ManagerStatsSchema>;

// Timeline event structure from audit_logs
export interface TimelineEvent {
    id: string;
    action: string;
    created_at: string;
    entity_id: string;
    user_id: string | null;
    details?: Record<string, unknown>;
    profiles?: { email?: string; first_name?: string; last_name?: string };
}

// KPI Data structure
export interface KPIData {
    totalProjects: number;
    allProjects: number;
    totalBudget: number;
    avgCheck: number;
    conversionRate: number;
    slaScore: number;
    avgRating: number;
    commission: number;
    ratingCount: number;
    recentReviews: {
        id: string;
        rating: number;
        comment: string | null;
        createdAt: string;
        projectNumber: number;
    }[];
}

export interface IManagerDashboardService {
    getStats(): Promise<ActionResult<ManagerStats>>;
    getProjectTimeline(calculationId: string): Promise<ActionResult<TimelineEvent[]>>;
    getKPIData(managerId: string): Promise<ActionResult<KPIData>>;
}

export class ManagerDashboardService implements IManagerDashboardService {
    private supabase: SupabaseClient;
    constructor(supabase: SupabaseClient) {
        this.supabase = supabase;
    }

    async getStats(): Promise<ActionResult<ManagerStats>> {
        try {
            const { data: { user } } = await this.supabase.auth.getUser();
            if (!user) return { success: false, error: { message: 'Not authenticated' } };

            // Only fetch calculations that are relevant to this user or role
            let query = this.supabase
                .from('calculations')
                .select('status, manager_id, sla_deadline, created_at')
                .neq('status', 'draft');

            // If it's a manager, only their relevant projects plus unassigned leads
            const { data: profile } = await this.supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            if (profile?.role === 'manager') {
                query = query.or(`manager_id.eq.${user.id},manager_id.is.null`);
            }

            const { data: calculations, error } = await query;

            if (error) return { success: false, error: wrapError(error) };

            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

            const stats: ManagerStats = {
                activeProjects: 0,
                newLeads: 0,
                overdueProjects: 0,
                completedThisMonth: 0,
                statusDistribution: {},
                workloadByManager: {},
            };

            calculations?.forEach((calc) => {
                // Status distribution
                stats.statusDistribution[calc.status] = (stats.statusDistribution[calc.status] || 0) + 1;

                // Active projects (yours)
                if (calc.manager_id === user.id && calc.status !== 'completed' && calc.status !== 'closed') {
                    stats.activeProjects++;
                }

                // New leads (unassigned and in 'sent' state)
                if (!calc.manager_id && calc.status === 'sent') {
                    stats.newLeads++;
                }

                // Overdue
                if (calc.sla_deadline && new Date(calc.sla_deadline) < now && calc.status !== 'completed' && calc.status !== 'closed') {
                    stats.overdueProjects++;
                }

                // Completed this month
                if (calc.status === 'completed' && new Date(calc.created_at) >= startOfMonth) {
                    stats.completedThisMonth++;
                }

                // Workload by manager
                if (calc.manager_id) {
                    stats.workloadByManager![calc.manager_id] = (stats.workloadByManager![calc.manager_id] || 0) + 1;
                }
            });

            return { success: true, data: stats };
        } catch (error) {
            return { success: false, error: wrapError(error) };
        }
    }

    async getProjectTimeline(calculationId: string): Promise<ActionResult<TimelineEvent[]>> {
        try {
            // Combine audit logs and messages for a full timeline
            const { data: logs, error: logsError } = await this.supabase
                .from('audit_logs')
                .select(`
                    *,
                    profiles:user_id (email, first_name, last_name)
                `)
                .eq('entity_id', calculationId)
                .order('created_at', { ascending: true });

            if (logsError) return { success: false, error: wrapError(logsError) };

            return { success: true, data: logs || [] };
        } catch (error) {
            return { success: false, error: wrapError(error) };
        }
    }

    async getKPIData(managerId: string): Promise<ActionResult<KPIData>> {
        try {
            // 1. Fetch manager's projects with SLA details
            const { data: managerProjects, error: projectsError } = await this.supabase
                .from('calculations')
                .select('id, results, status, project_number, sla_deadline, last_status_change_at, total_cost_value')
                .eq('manager_id', managerId);

            if (projectsError) throw projectsError;

            const projects = managerProjects || [];
            const validProjects = projects.filter(p => p.status !== 'draft');
            const successProjects = projects.filter(p => p.status === 'completed' || p.status === 'closed');
            
            const allProjectsCount = validProjects.length;
            const successProjectsCount = successProjects.length;
            const totalBudget = successProjects.reduce((sum: number, p: { results?: { totalAnnualBudget?: number; summary?: Array<{ calculation?: { annualBudget?: number } }> }; total_cost_value?: number }) => {
                const annual = p.results?.totalAnnualBudget || 
                               (p.results?.summary?.length ? p.results.summary.reduce((s: number, i: { calculation?: { annualBudget?: number } }) => s + (i.calculation?.annualBudget || 0), 0) : 0) || 
                               p.total_cost_value || 0;
                return sum + annual;
            }, 0);
            
            const avgCheck = successProjectsCount > 0 ? totalBudget / successProjectsCount : 0;
            const conversionRate = allProjectsCount > 0 ? (successProjectsCount / allProjectsCount) * 100 : 0;

            const managerProjectIds = projects.map(p => p.id);
            const projectMap = new Map();
            projects.forEach(p => projectMap.set(p.id, p.project_number));

            let managerReviews: { id: string; rating: number; comment: string | null; created_at: string; calculation_id: string }[] = [];
            if (managerProjectIds.length > 0) {
                const { data: reviews, error: reviewsError } = await this.supabase
                    .from('calculation_reviews')
                    .select('id, rating, comment, created_at, calculation_id')
                    .in('calculation_id', managerProjectIds)
                    .order('created_at', { ascending: false });
                
                if (reviewsError) throw reviewsError;
                managerReviews = reviews || [];
            }
            
            // 3. Real SLA Score Calculation
            // Count projects where SLA was met (not expired while active)
            const activeProjects = projects.filter(p => !['completed', 'closed'].includes(p.status));
            const overdueCount = activeProjects.filter(p => 
                p.sla_deadline && new Date(p.sla_deadline) < new Date()
            ).length;
            
            const slaScore = activeProjects.length > 0 
                ? Math.round(((activeProjects.length - overdueCount) / activeProjects.length) * 100)
                : 100; // If no active projects, SLA is perfect

            const avgRating = managerReviews.length 
                ? managerReviews.reduce((sum, r) => sum + r.rating, 0) / managerReviews.length 
                : 0;

            return {
                success: true,
                data: {
                    totalProjects: successProjectsCount,
                    allProjects: allProjectsCount,
                    totalBudget,
                    avgCheck,
                    conversionRate,
                    slaScore,
                    avgRating,
                    commission: totalBudget * 0.01,
                    ratingCount: managerReviews.length,
                    recentReviews: managerReviews.slice(0, 5).map(r => ({
                        id: r.id,
                        rating: r.rating,
                        comment: r.comment,
                        createdAt: r.created_at,
                        projectNumber: projectMap.get(r.calculation_id) || 0
                    }))
                }
            };
        } catch (error) {
            return { success: false, error: wrapError(error) };
        }
    }
}
