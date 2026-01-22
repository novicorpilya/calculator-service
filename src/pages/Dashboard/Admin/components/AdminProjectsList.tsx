import React, { useState } from 'react';
import {
    Briefcase,
    FolderSearch,
    Search,
    Filter,
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
} from 'lucide-react';
import type { AdminCalculation } from '@/services/admin.service';
import type { User } from '@/features/auth/auth.types';
import { ProjectCard } from './Projects/ProjectCard';
import { BulkActionsBar } from './Projects/BulkActionsBar';

interface AdminProjectsListProps {
    projects: AdminCalculation[];
    managers: User[];
    onStatusReturn: (calcId: string, currentStatus: string) => void;
    onDelete: (calcId: string, orgName: string) => void;
    onAssignManager: (calcId: string, managerId: string | null) => void;
    onBulkDelete: (ids: string[]) => void;
    onBulkStatusUpdate: (ids: string[], status: string) => void;
    searchTerm: string;
    onSearchChange: (value: string) => void;
    statusFilter: string;
    onStatusFilterChange: (value: string) => void;
    currentPage: number;
    totalCount: number;
    onPageChange: (page: number) => void;
}

export const AdminProjectsList: React.FC<AdminProjectsListProps> = ({
    projects,
    managers,
    onStatusReturn,
    onDelete,
    onAssignManager,
    onBulkDelete,
    onBulkStatusUpdate,
    searchTerm,
    onSearchChange,
    statusFilter,
    onStatusFilterChange,
    currentPage,
    totalCount,
    onPageChange,
}) => {
    const statuses = [
        'all',
        'draft',
        'sent',
        'expert',
        'changes',
        'revision',
        'invoice',
        'payment_review',
        'paid',
        'processing',
        'sent_to_warehouse',
        'ready',
        'shipping',
        'completed',
        'closed',
    ];
    const pageSize = 12;
    const totalPages = Math.ceil(totalCount / pageSize);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const toggleSelectAll = () => {
        if (selectedIds.size === projects.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(projects.map((p) => p.id)));
        }
    };

    const toggleSelect = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 relative">
            {/* Header Section */}
            <div className="flex flex-col gap-6">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
                            <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                                <Briefcase size={24} />
                            </div>
                            Реестр Проектов
                        </h2>
                        <p className="text-muted-foreground mt-1 text-sm font-medium ml-1">
                            Управление всеми расчетами и статусами в системе
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative group flex-1">
                        <Search
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors"
                            size={20}
                        />
                        <input
                            type="text"
                            placeholder="Поиск по организации..."
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="w-full bg-card/50 border border-border-theme focus:border-primary/50 focus:ring-4 focus:ring-primary/5 rounded-2xl pl-12 pr-4 py-3.5 outline-none transition-all font-medium"
                        />
                    </div>
                    <div className="relative group min-w-[240px]">
                        <Filter
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors"
                            size={18}
                        />
                        <select
                            value={statusFilter}
                            onChange={(e) => onStatusFilterChange(e.target.value)}
                            className="w-full bg-card/50 border border-border-theme focus:border-primary/50 rounded-2xl pl-12 pr-10 py-3.5 outline-none transition-all font-bold text-sm appearance-none cursor-pointer"
                        >
                            {statuses.map((s) => (
                                <option key={s} value={s}>
                                    {s === 'all'
                                        ? 'Все статусы'
                                        : s.charAt(0).toUpperCase() + s.slice(1)}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <BulkActionsBar
                selectedCount={selectedIds.size}
                onClear={() => setSelectedIds(new Set())}
                onDelete={() => {
                    if (confirm(`Удалить ${selectedIds.size} проектов?`)) {
                        onBulkDelete(Array.from(selectedIds));
                        setSelectedIds(new Set());
                    }
                }}
                onStatusUpdate={(status) => {
                    onBulkStatusUpdate(Array.from(selectedIds), status);
                    setSelectedIds(new Set());
                }}
            />

            {/* Select All */}
            {projects.length > 0 && (
                <div
                    className="flex items-center gap-3 px-2 opacity-60 hover:opacity-100 transition-opacity w-fit cursor-pointer"
                    onClick={toggleSelectAll}
                >
                    <div
                        className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${selectedIds.size === projects.length ? 'bg-primary border-primary text-white' : 'border-muted-foreground/40 bg-card'}`}
                    >
                        {selectedIds.size === projects.length && (
                            <CheckCircle2 size={14} strokeWidth={4} />
                        )}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest select-none">
                        Выбрать все на странице
                    </span>
                </div>
            )}

            {/* Grid */}
            <div className="grid grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-6">
                {projects.length === 0 ? (
                    <div className="col-span-full py-24 flex flex-col items-center justify-center text-center opacity-40 border-2 border-dashed border-border-theme rounded-[3rem]">
                        <FolderSearch size={64} className="mb-6 text-muted-foreground" />
                        <p className="text-lg font-bold">Проектов не найдено</p>
                        <p className="text-sm">Попробуйте изменить параметры поиска</p>
                    </div>
                ) : (
                    projects.map((calc) => (
                        <ProjectCard
                            key={calc.id}
                            calc={calc}
                            managers={managers}
                            selected={selectedIds.has(calc.id)}
                            onToggleSelect={toggleSelect}
                            onStatusReturn={onStatusReturn}
                            onDelete={onDelete}
                            onAssignManager={onAssignManager}
                        />
                    ))
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-foreground/90 py-2.5 px-4 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-4 border border-white/10 text-background">
                    <button
                        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="p-1.5 hover:bg-white/20 rounded-full disabled:opacity-30 transition-all font-bold"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <span className="text-xs font-black uppercase tracking-widest">
                        {currentPage} / {totalPages}
                    </span>
                    <button
                        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="p-1.5 hover:bg-white/20 rounded-full disabled:opacity-30 transition-all font-bold"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            )}
        </div>
    );
};
