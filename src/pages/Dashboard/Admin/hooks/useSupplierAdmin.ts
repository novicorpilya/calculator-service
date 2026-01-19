import { useState, useEffect, useCallback } from 'react';
import { useServices } from '@/app/di/ServiceContainer';
import type { Supplier } from '@/features/dashboard/dashboard.types';
import { toast } from 'sonner';

export function useSupplierAdmin() {
    const { supplierService } = useServices();
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | undefined>(undefined);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await supplierService.getSuppliers();
            if (res.success && res.data) {
                setSuppliers(res.data);
            } else {
                toast.error(res.error?.message || 'Ошибка загрузки поставщиков');
            }
        } finally {
            setLoading(false);
        }
    }, [supplierService]);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Удалить поставщика "${name}"? Это действие необратимо.`)) return;
        
        const res = await supplierService.deleteSupplier(id);
        if (res.success) {
            toast.success(`Поставщик "${name}" удален`);
            loadData();
        } else {
            toast.error(res.error?.message || 'Ошибка удаления');
        }
    };


    const filteredSuppliers = suppliers.filter(s => 
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.description?.toLowerCase().includes(search.toLowerCase())
    );

    return {
        suppliers: filteredSuppliers,
        loading,
        search,
        setSearch,
        isModalOpen,
        setIsModalOpen,
        editingSupplier,
        setEditingSupplier,
        handleDelete,
        refresh: loadData
    };
}
