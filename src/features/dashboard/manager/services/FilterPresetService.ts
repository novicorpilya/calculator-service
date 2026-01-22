import { type FilterPreset } from '../manager.types';
import { type IFilterPresetRepository } from '../repositories/FilterPresetRepository';
import { type ActionResult, type VoidResult } from '@/core/types/results';

export interface IFilterPresetService {
    getPresets(userId: string): Promise<ActionResult<FilterPreset[]>>;
    savePreset(preset: Partial<FilterPreset>): Promise<ActionResult<FilterPreset>>;
    deletePreset(id: string): Promise<VoidResult>;
    getCachedPresets(userId: string): FilterPreset[];
}

export class FilterPresetService implements IFilterPresetService {
    private repository: IFilterPresetRepository;

    constructor(repository: IFilterPresetRepository) {
        this.repository = repository;
    }

    async getPresets(userId: string): Promise<ActionResult<FilterPreset[]>> {
        const result = await this.repository.getPresets(userId);
        if (result.success && result.data) {
            // Sync to localStorage as cache
            localStorage.setItem(`filter_presets_${userId}`, JSON.stringify(result.data));
        }
        return result;
    }

    async savePreset(preset: Partial<FilterPreset>): Promise<ActionResult<FilterPreset>> {
        if (preset.id) {
            return this.repository.updatePreset(preset.id, preset);
        }
        return this.repository.createPreset(preset);
    }

    async deletePreset(id: string): Promise<VoidResult> {
        return this.repository.deletePreset(id);
    }

    /**
     * Get cached presets from localStorage for immediate UI load
     */
    getCachedPresets(userId: string): FilterPreset[] {
        const cached = localStorage.getItem(`filter_presets_${userId}`);
        if (cached) {
            try {
                return JSON.parse(cached);
            } catch {
                return [];
            }
        }
        return [];
    }
}
