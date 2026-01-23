import type { ICalculationRepository } from '../repositories/CalculationRepository';
import { type PaginationParams, type PaginatedResult } from '@/core/types/pagination';
import type { Calculation, CalculationResults } from '@/core/types/calculation';
import { CALCULATION_STATUS, CALCULATION_ACTION } from '@/core/constants/calculation.constants';
import { type DashboardStats } from '../dashboard.types';
import { PriceCalculator } from '@/core/domain/PriceCalculator';
import { CalculationEntity } from '@/core/domain/CalculationEntity';
import type { ActionResult, VoidResult } from '@/core/types/results';
import { type IVersionService } from '@/features/dashboard/manager/services/version.service';
import { type IConfigService } from '@/services/config.service';

export interface ICalculationService {
    getMyCalculations(userId: string): Promise<ActionResult<Calculation[]>>;
    getCalculation(id: string | number): Promise<ActionResult<Calculation>>;
    getUnassigned(): Promise<ActionResult<Calculation[]>>;
    getManagerWorkload(managerId: string): Promise<ActionResult<Calculation[]>>;
    getPaginated(
        params: PaginationParams & {
            status?: string;
            excludeStatus?: string;
            search?: string;
            managerId?: string | null;
            sortBy?: string;
            sortOrder?: 'asc' | 'desc';
        }
    ): Promise<ActionResult<PaginatedResult<Calculation>>>;
    create(calc: Partial<Calculation>, userId: string): Promise<ActionResult<Calculation>>;
    update(id: string | number, updates: Partial<Calculation>): Promise<ActionResult<Calculation>>;
    delete(id: string | number): Promise<VoidResult>;
    assignToMe(id: string | number, managerId: string): Promise<ActionResult<Calculation>>;
    adjustExpert(
        id: string | number,
        results: CalculationResults,
        adjustments: Record<string, unknown>,
        version: number
    ): Promise<ActionResult<Calculation>>;
    uploadReceipt(id: string | number, file: File, userId: string): Promise<ActionResult<string>>;
    getSignedReceiptUrl(path: string): Promise<ActionResult<string>>;
    acquireLock(id: string | number): Promise<ActionResult<Calculation>>;
    releaseLock(id: string | number): Promise<ActionResult<Calculation>>;
    getVersionHistory(id: string | number): Promise<ActionResult<Record<string, unknown>[]>>;
    getDashboardStats(userId: string, venueId?: string): Promise<ActionResult<DashboardStats>>;
    smartReorder(id: string | number): Promise<ActionResult<Calculation>>;
    clearVersionHistory(id: string | number): Promise<VoidResult>;
}

export class CalculationService implements ICalculationService {
    private repository: ICalculationRepository;
    private versionService: IVersionService;
    private configService: IConfigService;

    constructor(
        repository: ICalculationRepository,
        versionService: IVersionService,
        configService: IConfigService
    ) {
        this.repository = repository;
        this.versionService = versionService;
        this.configService = configService;
    }

    private wrapError(error: unknown): { message: string } {
        return { message: error instanceof Error ? error.message : String(error) };
    }

    async getMyCalculations(userId: string): Promise<ActionResult<Calculation[]>> {
        return this.repository.getByUserId(userId);
    }

    async getCalculation(id: string | number): Promise<ActionResult<Calculation>> {
        return this.repository.getById(id);
    }

    async getUnassigned(): Promise<ActionResult<Calculation[]>> {
        return this.repository.getUnassigned();
    }

    async getManagerWorkload(managerId: string): Promise<ActionResult<Calculation[]>> {
        return this.repository.getManagerWorkload(managerId);
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
        return this.repository.getPaginated(params);
    }

    async create(calc: Partial<Calculation>, userId: string): Promise<ActionResult<Calculation>> {
        const rules = await this.configService.getBusinessRules();
        const totalCost = PriceCalculator.calculateFinalTotal(
            calc.results?.summary || [],
            calc.manager_adjustments,
            rules
        );
        return this.repository.create({ ...calc, totalCost }, userId);
    }

    async update(
        id: string | number,
        updates: Partial<Calculation>
    ): Promise<ActionResult<Calculation>> {
        try {
            const rules = await this.configService.getBusinessRules();
            const currentRes = await this.repository.getById(id);
            if (!currentRes.success || !currentRes.data) return currentRes;
            const entity = new CalculationEntity(currentRes.data, rules);

            // 1. Validate Status Transition
            if (updates.status && updates.status !== entity.status) {
                if (!entity.canTransitionTo(updates.status)) {
                    return {
                        success: false,
                        error: {
                            message: `Invalid status transition: ${entity.status} -> ${updates.status}`,
                        },
                    };
                }
            }

            // 2. Automated Snapshotting on Critical Transitions
            if (updates.status && updates.status !== entity.status) {
                const snapshotStatuses: string[] = [
                    CALCULATION_STATUS.INVOICE,
                    CALCULATION_STATUS.PAID,
                    CALCULATION_STATUS.COMPLETED,
                ];
                if (snapshotStatuses.includes(updates.status)) {
                    await this.versionService.createSnapshot(
                        String(id),
                        {
                            results: updates.results || entity.results,
                            adjustments: updates.manager_adjustments || entity.managerAdjustments,
                        },
                        `Status change to ${updates.status}`
                    );
                }
            }

            // 3. Prepare Updates
            const finalUpdates = { ...updates };
            if (updates.results?.summary || updates.manager_adjustments) {
                finalUpdates.totalCost = PriceCalculator.calculateFinalTotal(
                    updates.results?.summary || entity.results?.summary || [],
                    updates.manager_adjustments || entity.managerAdjustments,
                    rules
                );
            }

            // 4. Special Handling for Assignment
            // If the project is unassigned and we are setting a manager, 
            // we MUST use the 'assign' action to bypass RLS restrictions on direct UPDATE.
            const isFirstAssignment = finalUpdates.manager_id && !entity.managerId;
            if (isFirstAssignment) {
                await this.repository.executeAction(id, 'assign', undefined, {
                    manager_id: finalUpdates.manager_id,
                });
                // After assignment, update the local entity state so we don't try to re-assign or fail status check
                const refreshed = await this.repository.getById(id);
                if (!refreshed.success || !refreshed.data) return refreshed;
            }

            // 5. Status Action Mapping
            if (updates.status && updates.status !== entity.status) {
                const action = this.mapStatusToAction(updates.status, entity.status);

                const contentOnly = { ...finalUpdates };
                delete contentOnly.status;
                // If it was first assignment, we already did it via action, so remote it from content update
                if (isFirstAssignment) delete contentOnly.manager_id;

                if (Object.keys(contentOnly).length > 0) {
                    await this.repository.updateContent(id, contentOnly);
                }

                return this.repository.executeAction(id, action, undefined, {
                    manager_id: finalUpdates.manager_id,
                });
            }

            // 6. Content Only Update
            const contentOnly = { ...finalUpdates };
            if (isFirstAssignment) delete contentOnly.manager_id;
            
            if (Object.keys(contentOnly).length > 0) {
                return this.repository.updateContent(id, contentOnly);
            }

            // If only manager was updated (via action), return refreshed project
            return this.repository.getById(id);
        } catch (error) {
            return { success: false, error: this.wrapError(error) };
        }
    }

    async delete(id: string | number): Promise<VoidResult> {
        return this.repository.delete(id);
    }

    private mapStatusToAction(newStatus: string, oldStatus: string): string {
        if (oldStatus === 'closed') return CALCULATION_ACTION.RESTORE;

        const map: Record<string, string> = {
            [CALCULATION_STATUS.SENT]: CALCULATION_ACTION.SUBMIT,
            [CALCULATION_STATUS.EXPERT]: CALCULATION_ACTION.START_EXPERT,
            [CALCULATION_STATUS.INVOICE]: CALCULATION_ACTION.APPROVE,
            [CALCULATION_STATUS.CHANGES]: CALCULATION_ACTION.REJECT,
            [CALCULATION_STATUS.REVISION]: CALCULATION_ACTION.RESOLVE,
            [CALCULATION_STATUS.PAYMENT_REVIEW]: CALCULATION_ACTION.SUBMIT_PAYMENT,
            [CALCULATION_STATUS.PAID]: CALCULATION_ACTION.ACCEPT_PAYMENT,
            [CALCULATION_STATUS.PROCESSING]: CALCULATION_ACTION.START_PROCESSING,
            [CALCULATION_STATUS.COMPLETED]: CALCULATION_ACTION.FINISH_PROJECT,
            [CALCULATION_STATUS.CLOSED]: CALCULATION_ACTION.ARCHIVE,
        };
        return map[newStatus] || newStatus;
    }

    async assignToMe(id: string | number, managerId: string): Promise<ActionResult<Calculation>> {
        return this.repository.executeAction(id, 'assign', undefined, { manager_id: managerId });
    }

    async adjustExpert(
        id: string | number,
        results: CalculationResults,
        adjustments: Record<string, unknown>,
        version: number
    ): Promise<ActionResult<Calculation>> {
        return this.repository.adjustCalculationExpert(id, results, adjustments, version);
    }

    async uploadReceipt(
        id: string | number,
        file: File,
        userId: string
    ): Promise<ActionResult<string>> {
        const path = `${userId}/${id}/receipt_${Date.now()}.${file.name.split('.').pop()}`;
        const res = await this.repository.uploadFile(path, file, 'receipts');
        return res.success ? { success: true, data: path } : { success: false, error: res.error };
    }

    async getSignedReceiptUrl(path: string): Promise<ActionResult<string>> {
        return this.repository.createSignedUrl(path, 'receipts', 3600);
    }

    async acquireLock(id: string | number): Promise<ActionResult<Calculation>> {
        return this.repository.acquireLock(id);
    }
    async releaseLock(id: string | number): Promise<ActionResult<Calculation>> {
        return this.repository.releaseLock(id);
    }
    async getVersionHistory(id: string | number): Promise<ActionResult<Record<string, unknown>[]>> {
        return this.repository.getVersions(id);
    }
    async getDashboardStats(
        userId: string,
        venueId?: string
    ): Promise<ActionResult<DashboardStats>> {
        return this.repository.getDashboardStats(userId, venueId);
    }
    async smartReorder(id: string | number): Promise<ActionResult<Calculation>> {
        return this.repository.smartReorder(id);
    }
    async clearVersionHistory(id: string | number): Promise<VoidResult> {
        return this.repository.clearVersions(id);
    }
}
