import React, { useState } from 'react';
import { Plus, Search, Eye, Edit2, MoreVertical, Clock, User, MessageSquare, FileText } from 'lucide-react';
import { type Calculation, OBJECT_TYPES } from '../../dashboard.types';
import { CalculationStatusBadge } from '../../components/CalculationStatusBadge';

interface ClientCalculationsListProps {
    calculations: Calculation[];
    onSelect: (calc: Calculation) => void;
    onNewCalculation: () => void;
}

export const ClientCalculationsList: React.FC<ClientCalculationsListProps> = ({
    calculations,
    onSelect,
    onNewCalculation
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    const filteredCalculations = calculations.filter(calc => {
        const matchesSearch = calc.organizationName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filterStatus === 'all' || calc.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-1">Мои расчёты</h1>
                    <p className="text-gray-600">Управляйте расчётами инвентаря и отслеживайте статусы</p>
                </div>
                <button
                    onClick={onNewCalculation}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2 w-full md:w-auto"
                >
                    <Plus className="w-5 h-5" />
                    Новый расчёт
                </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Поиск по названию..."
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                </div>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white flex items-center gap-2"
                >
                    <option value="all">Все статусы</option>
                    <option value="draft">Черновик</option>
                    <option value="sent">Отправлен</option>
                    <option value="changes">Требует изменений</option>
                    <option value="approved">Утверждено</option>
                </select>
            </div>

            {filteredCalculations.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-300">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium">Расчёты не найдены</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredCalculations.map(calc => {
                        const unreadBadge = calc.unreadComments > 0 ? (
                            <span className="inline-block w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center ml-2">
                                {calc.unreadComments}
                            </span>
                        ) : null;

                        return (
                            <div
                                key={calc.id}
                                onClick={() => onSelect(calc)}
                                className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
                            >
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                                {calc.organizationName}
                                            </h3>
                                            <CalculationStatusBadge status={calc.status} />
                                            {unreadBadge}
                                        </div>
                                        <p className="text-sm text-gray-600 mb-3">
                                            {OBJECT_TYPES.find(t => t.value === calc.type)?.label || 'Не указан'} • {calc.totalArea} м² • {calc.zonesCount} зон
                                        </p>
                                        <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3.5 h-3.5" />
                                                Создан: {calc.createdDate}
                                            </span>
                                            {calc.manager && (
                                                <span className="flex items-center gap-1">
                                                    <User className="w-3.5 h-3.5" />
                                                    Менеджер: {calc.manager}
                                                </span>
                                            )}
                                            {calc.comments.length > 0 && (
                                                <span className="flex items-center gap-1">
                                                    <MessageSquare className="w-3.5 h-3.5" />
                                                    {calc.comments.length} {calc.comments.length === 1 ? 'комментарий' : 'комментариев'}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex gap-2 md:ml-4">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onSelect(calc);
                                            }}
                                            className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
                                        >
                                            <Eye className="w-4 h-4" />
                                            <span className="hidden sm:inline">Открыть</span>
                                        </button>
                                        {calc.status === 'draft' && (
                                            <button className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5">
                                                <Edit2 className="w-4 h-4" />
                                                <span className="hidden sm:inline">Редактировать</span>
                                            </button>
                                        )}
                                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600">
                                            <MoreVertical className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
