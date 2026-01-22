import { DEFAULT_BUSINESS_RULES, type BusinessRules } from '../config/business.config';
import type { InventoryItem } from '@/core/types/calculation';

export class PriceCalculator {
    /**
     * Calculate net total with items and manager adjustments
     */
    static calculateNetTotal(
        items: InventoryItem[],
        adjustments: { global_margin?: number; delivery_cost?: number; service_cost?: number } = {}
    ): number {
        const baseCost = items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
        const margin = Number(adjustments.global_margin) || 1.0;
        const delivery = Number(adjustments.delivery_cost) || 0;
        const service = Number(adjustments.service_cost) || 0;

        return baseCost * margin + delivery + service;
    }

    /**
     * Calculate final total including TAX (VAT)
     */
    static calculateFinalTotal(
        items: InventoryItem[],
        adjustments: Record<string, unknown> = {},
        rules: BusinessRules = DEFAULT_BUSINESS_RULES
    ): number {
        const netTotal = this.calculateNetTotal(items, adjustments);
        return Math.round(netTotal * rules.TAX_RATE);
    }

    /**
     * Calculate delivery cost based on business logic:
     * Base 2500 RUB + 2% of total goods value, minimum 3000 RUB.
     */
    static calculateStandardDelivery(totalGoods: number): number {
        if (totalGoods <= 0) return 0;

        const baseDelivery = 2500;
        const variableDelivery = totalGoods * 0.02;
        return Math.max(3000, Math.ceil(baseDelivery + variableDelivery));
    }

    /**
     * Calculate delivery cost based on distance/rules (Placeholder for extension)
     */
    static calculateDeliveryCost(distance: number, baseRate: number = 500): number {
        return distance > 0 ? baseRate + distance * 10 : 0;
    }
}
