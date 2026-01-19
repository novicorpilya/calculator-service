import { useState, useEffect, useCallback } from 'react';
import { useServices } from '@/app/di/ServiceContainer';
import type { AdminInventoryItem } from '@/services/inventory-admin.service';
import { toast } from 'sonner';

export function useInventoryAdmin(pageSize: number = 12) {
    const { inventoryAdminService } = useServices();
    const [items, setItems] = useState<AdminInventoryItem[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<AdminInventoryItem | undefined>(undefined);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await inventoryAdminService.getInventory(page, pageSize, search);
            if (res.success && res.data) {
                setItems(res.data.data);
                setTotal(res.data.total);
            } else {
                toast.error(res.error?.message || 'Ошибка загрузки реестра');
            }
        } finally {
            setLoading(false);
        }
    }, [inventoryAdminService, page, pageSize, search]);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Вы действительно хотите удалить "${name}"? Это действие необратимо.`)) return;
        
        const res = await inventoryAdminService.deleteItem(id);
        if (res.success) {
            toast.success(`Товар "${name}" удален`);
            loadData();
        } else {
            toast.error(res.error?.message || 'Ошибка удаления');
        }
    };


    return {
        items,
        total,
        page,
        setPage,
        search,
        setSearch,
        loading,
        isModalOpen,
        setIsModalOpen,
        editingItem,
        setEditingItem,
        handleDelete,
        refresh: loadData
    };
}
