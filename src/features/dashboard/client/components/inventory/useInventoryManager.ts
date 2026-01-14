import { useState, useMemo } from 'react';
import { type Calculation, type InventoryItem } from '@/features/dashboard/dashboard.types';
import { type Venue } from '@/services/venue.service';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useGlobalInventory } from '@/hooks/useGlobalInventory';

interface UseInventoryManagerProps {
    calculations: Calculation[];
    venues: Venue[];
}

export function useInventoryManager({ calculations, venues }: UseInventoryManagerProps) {
    // Tabs
    const [activeTab, setActiveTab] = useState<'procurement' | 'catalog'>('procurement');

    // Pagination & Data State (Catalog)
    const [page, setPage] = useState(1);
    const [pageSize] = useState(12);

    // Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedVenue, setSelectedVenue] = useState<string>('all');
    const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    const categories = [
        'Кухонная химия',
        'Общая химия',
        'Санитария',
        'Оборудование',
        'Инвентарь',
        'Расходные материалы',
        'Системы',
        'Бумага',
        'Гигиена',
    ];

    // React Query Hooks
    const { data: suppliers = [] } = useSuppliers();
    const { 
        data: inventoryData, 
        isLoading, 
        refetch: fetchCatalog 
    } = useGlobalInventory({
        page,
        pageSize,
        search: searchQuery,
        supplierId: selectedSupplier === 'all' ? undefined : selectedSupplier,
        category: selectedCategory === 'all' ? undefined : selectedCategory
    });

    const catalogItems = inventoryData?.data || [];
    const totalItems = inventoryData?.count || 0;
    const totalPages = inventoryData?.totalPages || 0;

    // Summary calculation based on approved projects (Local Logic)
    const procurementData = useMemo(() => {
        const filteredCalcs = calculations.filter((c) => {
            if (c.status !== 'invoice') return false;
            if (selectedVenue === 'all') return true;
            const venue = venues.find((v) => v.id === selectedVenue);
            return c.organizationName === venue?.name;
        });

        const aggregated = filteredCalcs
            .flatMap((c) => c.results?.summary || [])
            .reduce(
                (acc, item) => {
                    const key = `${item.inventory}-${item.color}-${item.supplier_id || 'no-supplier'}`;
                    if (!acc[key]) {
                        acc[key] = { ...item, quantity: 0, total: 0 };
                    }
                    acc[key].quantity += item.quantity;
                    acc[key].total += item.quantity * item.price;
                    return acc;
                },
                {} as Record<string, InventoryItem>
            );

        return Object.values(aggregated).filter((item) =>
            item.inventory.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [calculations, selectedVenue, venues, searchQuery]);

    const totalBudget = useMemo(
        () => procurementData.reduce((sum, item) => sum + item.total, 0),
        [procurementData]
    );

    const handlePageChange = (p: number) => {
        if (p >= 1 && p <= totalPages) {
            setPage(p);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return {
        activeTab,
        setActiveTab,
        catalogItems,
        totalItems,
        totalPages,
        page,
        setPage,
        suppliers,
        isLoading,
        searchQuery,
        setSearchQuery,
        selectedVenue,
        setSelectedVenue,
        selectedSupplier,
        setSelectedSupplier,
        selectedCategory,
        setSelectedCategory,
        categories,
        procurementData,
        totalBudget,
        handlePageChange,
        fetchCatalog,
    };
}
