import { useState, useCallback, useEffect, useRef } from 'react';
import { useServices } from '@/app/di/ServiceContainer';

export interface Review {
    id: string;
    rating: number;
    comment?: string | null;
    createdAt: string;
    projectNumber: number;
}

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
    recentReviews: Review[];
}

const getKpiCacheKey = (managerId: string) => `kpi_data_${managerId}`;

export const useManagerKPI = (managerId: string) => {
    const { managerDashboardService } = useServices();

    const [data, setData] = useState<KPIData | null>(() => {
        const cached = localStorage.getItem(getKpiCacheKey(managerId));
        return cached ? JSON.parse(cached) : null;
    });

    const [loading, setLoading] = useState(!data);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const mountLock = useRef(false);

    const refreshData = useCallback(async (isManual = false) => {
        if (isManual) setIsRefreshing(true);

        try {
            const res = await managerDashboardService.getKPIData(managerId);
            if (res.success && res.data) {
                setData(res.data);
                localStorage.setItem(getKpiCacheKey(managerId), JSON.stringify(res.data));
            }
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, [managerId, managerDashboardService]);

    useEffect(() => {
        if (mountLock.current) return;
        mountLock.current = true;
        refreshData();
    }, [refreshData]);

    return {
        data,
        loading,
        isRefreshing,
        refreshData: () => refreshData(true)
    };
};
