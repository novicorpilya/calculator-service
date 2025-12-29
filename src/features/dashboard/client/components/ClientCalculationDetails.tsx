import React, { useState } from 'react';
import { ChevronLeft, Download, Send } from 'lucide-react';
import * as XLSX from 'xlsx';
import { type Calculation, STATUS_CONFIG } from '../../dashboard.types';

interface ClientCalculationDetailsProps {
    calculation: Calculation;
    onBack: () => void;
}

export const ClientCalculationDetails: React.FC<ClientCalculationDetailsProps> = ({ calculation, onBack }) => {
    const [newComment, setNewComment] = useState('');

    const totalCost = calculation.results?.summary.reduce((sum, item) => sum + (item.total * item.price), 0) || 0;

    const exportToExcel = (calc: Calculation) => {
        if (!calc.results) return;
        const wb = XLSX.utils.book_new();

        const zoneData: (string | number)[][] = [];
        calc.results.byZone.forEach(zone => {
            zoneData.push([zone.zoneName, '', '', '']);
            zoneData.push(['Инвентарь', 'Количество', 'Цена', 'Сумма']);
            zone.items.forEach(item => {
                zoneData.push([item.inventory, `${item.quantity} шт`, `${item.price}₽`, `${item.total}₽`]);
            });
            zoneData.push(['', '', '', '']);
        });

        const ws1 = XLSX.utils.aoa_to_sheet(zoneData);
        XLSX.utils.book_append_sheet(wb, ws1, 'Расчет по зонам');

        XLSX.writeFile(wb, `Расчет_${calc.organizationName}.xlsx`);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 mb-2">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm"
                >
                    <ChevronLeft className="w-4 h-4" /> Назад
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Детали расчета</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">{calculation.organizationName}</h2>
                                <p className="text-gray-500 text-sm mt-1 font-medium">Создано: {calculation.createdDate}</p>
                            </div>
                            <span className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider ${STATUS_CONFIG[calculation.status].color}`}>
                                {STATUS_CONFIG[calculation.status].label}
                            </span>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <div>
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">Зон</p>
                                <p className="text-2xl font-bold text-gray-900">{calculation.zonesCount}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">Площадь</p>
                                <p className="text-2xl font-bold text-gray-900">{calculation.totalArea} м²</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">Менеджер</p>
                                <p className="text-lg font-bold text-gray-900">{calculation.manager}</p>
                            </div>
                        </div>

                        <div className="mb-6">
                            <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide">Зоны расчета</h3>
                            <div className="flex flex-wrap gap-2">
                                {calculation.zones.map((zone, idx) => (
                                    <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-semibold border border-blue-100">
                                        {zone}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {calculation.results && (
                            <>
                                <h3 className="font-bold text-gray-900 mb-4 mt-8 text-sm uppercase tracking-wide">Результаты расчета</h3>
                                <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white mb-6 shadow-xl shadow-blue-200">
                                    <div className="grid grid-cols-2 gap-3 mb-6">
                                        {calculation.results.summary.map((item, i) => (
                                            <div key={i} className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 hover:bg-white/20 transition-colors">
                                                <div className="text-sm text-blue-100 mb-2 font-medium">{item.inventory}</div>
                                                <div className="flex items-baseline gap-1">
                                                    <div className="text-2xl font-bold">{item.total}</div>
                                                    <div className="text-sm text-blue-200">шт</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="border-t border-white/20 pt-4 mt-4">
                                        <div className="bg-white/20 backdrop-blur-md rounded-xl p-5 border border-white/20">
                                            <div className="text-sm text-blue-100 mb-1 font-medium">Общая стоимость</div>
                                            <div className="text-3xl font-bold">{totalCost.toLocaleString()} ₽</div>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => exportToExcel(calculation)}
                                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95"
                                >
                                    <Download className="w-4 h-4" /> Скачать расчет (XLSX)
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide">Менеджер</h3>
                        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-200">
                                {calculation.manager[0]}
                            </div>
                            <div>
                                <p className="font-bold text-gray-900">{calculation.manager}</p>
                                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Ответственный</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col h-[500px]">
                        <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide">Комментарии</h3>

                        <div className="space-y-4 mb-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            {calculation.comments.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                                    Нет комментариев
                                </div>
                            ) : (
                                calculation.comments.map((comment, idx) => (
                                    <div key={idx} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="font-bold text-gray-900 text-sm">{comment.author}</p>
                                            <p className="text-xs text-gray-500 font-medium">{comment.date}</p>
                                        </div>
                                        <p className="text-gray-700 text-sm leading-relaxed">{comment.text}</p>
                                    </div>
                                ))
                            )}
                        </div>

                        {(calculation.status === 'sent' || calculation.status === 'changes') && (
                            <div className="flex gap-2 mt-auto pt-4 border-t border-gray-100">
                                <input
                                    type="text"
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="Ваш ответ..."
                                />
                                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md shadow-blue-200">
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
