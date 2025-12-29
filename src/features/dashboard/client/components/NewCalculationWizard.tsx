import React, { useState } from 'react';
import { ChevronLeft, Plus, Trash2, AlertCircle } from 'lucide-react';
import {
    type Calculation,
    type CalculationResults,
    type Zone,
    ZONE_TYPES,
    INVENTORY_ITEMS,
    type ZoneResult,
    type InventoryItem
} from '../../dashboard.types';

interface NewCalculationWizardProps {
    onCancel: () => void;
    onComplete: (calculation: Calculation) => void;
}

export const NewCalculationWizard: React.FC<NewCalculationWizardProps> = ({ onCancel, onComplete }) => {
    const [step, setStep] = useState(1);
    const [objectData, setObjectData] = useState({ name: '', type: '', totalArea: '' });
    const [zones, setZones] = useState<Zone[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [currentZone, setCurrentZone] = useState({ type: '', area: '', color: '' });
    const [results, setResults] = useState<CalculationResults | null>(null);

    const totalZonesArea = zones.reduce((sum, zone) => sum + parseFloat(zone.area || '0'), 0);
    const hasAreaWarning = objectData.totalArea && totalZonesArea > parseFloat(objectData.totalArea);

    const handleAddZone = () => {
        if (currentZone.type && currentZone.area && currentZone.color) {
            const zoneName = ZONE_TYPES.find(t => t.value === currentZone.type)?.label || '';
            setZones([...zones, {
                ...currentZone,
                name: zoneName,
                id: Date.now(),
                type: currentZone.type,
                area: currentZone.area,
                color: currentZone.color
            }]);
            setCurrentZone({ type: '', area: '', color: '' });
            setShowModal(false);
        }
    };

    const handleDeleteZone = (id: number) => {
        setZones(zones.filter(zone => zone.id !== id));
    };

    const calculateInventory = () => {
        const zoneResults: ZoneResult[] = [];
        const aggregated: Record<string, InventoryItem> = {};

        zones.forEach(zone => {
            const zoneItems: InventoryItem[] = [];
            INVENTORY_ITEMS.forEach(item => {
                if (item.color === zone.color) {
                    // @ts-ignore - Types need detailed definition for norms keys, assuming match
                    const norm = item.norms[zone.type as any] || 0;
                    const quantity = Math.ceil(parseFloat(zone.area) / norm);

                    const newItem = {
                        inventory: item.name,
                        color: item.color,
                        quantity: quantity,
                        price: item.price,
                        total: quantity * item.price
                    };

                    zoneItems.push(newItem);

                    const key = `${item.name}-${item.color}`;
                    if (!aggregated[key]) {
                        aggregated[key] = { ...newItem, total: 0 }; // Initialize with base props
                    }
                    aggregated[key].total += quantity; // Accumulate quantity? Or total cost? User code: aggregated[key].total += quantity
                }
            });

            zoneResults.push({ zoneName: zone.name, area: zone.area, color: zone.color, items: zoneItems });
        });

        // Convert aggregated back to array and recalculate price totals based on quantity
        const summary = Object.values(aggregated).map(item => ({
            ...item,
            // total is quantity in user code logic for summary items visual?
            // "item.total" in summary view is displayed.
            // In user code: 
            // aggregated[key].total += quantity;
            // Display: <div className="text-2xl font-bold mb-1">{item.total}</div> -> this is Quantity
            // Total cost calc: summary.reduce((sum, item) => sum + (item.total * item.price), 0)
            // So item.total in summary IS quantity.
        }));

        setResults({ byZone: zoneResults, summary });
        setStep(3);
    };

    const sendToManager = () => {
        const newCalc: Calculation = {
            id: Date.now(),
            organizationName: objectData.name,
            status: 'sent',
            zones: zones.map(z => z.name),
            totalArea: parseFloat(objectData.totalArea),
            zonesCount: zones.length,
            createdDate: new Date().toLocaleDateString('ru-RU'),
            manager: 'Назначается',
            comments: [],
            unreadComments: 0,
            results: results
        };
        onComplete(newCalc);
    };

    const totalCost = results?.summary.reduce((sum, item) => sum + (item.total * item.price), 0) || 0;

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center justify-between mb-8">
                <button
                    onClick={onCancel}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm"
                >
                    <ChevronLeft className="w-4 h-4" /> Отмена
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Новый расчет</h1>
                <div className="w-24"></div> {/* Spacer for center alignment */}
            </div>

            {step === 1 && (
                <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-200 animate-in fade-in slide-in-from-bottom-4">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Основная информация</h2>
                    <div className="space-y-5">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Название объекта</label>
                            <input
                                type="text"
                                value={objectData.name}
                                onChange={(e) => setObjectData({ ...objectData, name: e.target.value })}
                                className="w-full px-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                placeholder="Например: Ресторан «Мр Сити»"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Тип объекта</label>
                            <select
                                value={objectData.type}
                                onChange={(e) => setObjectData({ ...objectData, type: e.target.value })}
                                className="w-full px-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white"
                            >
                                <option value="">Выберите тип заведения</option>
                                <option value="restaurant">Ресторан</option>
                                <option value="cafe">Кофейня</option>
                                <option value="bar">Бар</option>
                                <option value="hostel">Хостел</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Общая площадь (м²)</label>
                            <input
                                type="number"
                                value={objectData.totalArea}
                                onChange={(e) => setObjectData({ ...objectData, totalArea: e.target.value })}
                                className="w-full px-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                placeholder="90"
                            />
                        </div>
                        <button
                            onClick={() => setStep(2)}
                            disabled={!objectData.name || !objectData.type || !objectData.totalArea}
                            className="w-full bg-blue-600 text-white py-4 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed mt-4 transition-all shadow-lg shadow-blue-200 active:scale-95"
                        >
                            Продолжить
                        </button>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-200 animate-in fade-in slide-in-from-right-4">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Зоны помещения</h2>
                            <p className="text-gray-500 text-sm font-medium mt-1">{objectData.name} • {objectData.totalArea} м²</p>
                        </div>
                        <button
                            onClick={() => setShowModal(true)}
                            className="bg-blue-50 text-blue-600 py-2.5 px-5 rounded-xl text-sm font-bold hover:bg-blue-100 transition-colors flex items-center gap-2 border border-blue-100"
                        >
                            <Plus className="w-4 h-4" /> Добавить зону
                        </button>
                    </div>

                    {zones.length === 0 ? (
                        <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 mb-6">
                            <p className="text-gray-400 font-medium">Добавьте хотя бы одну зону для расчета</p>
                        </div>
                    ) : (
                        <div className="space-y-3 mb-6">
                            {zones.map(zone => (
                                <div key={zone.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl bg-gray-50/50 hover:border-blue-200 transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-3 h-12 rounded-full" style={{ backgroundColor: zone.color }}></div>
                                        <div>
                                            <div className="font-bold text-gray-900">{zone.name}</div>
                                            <div className="text-sm text-gray-500 font-medium">{zone.area} м²</div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteZone(zone.id)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-100">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-blue-900 font-medium">Итоговая площадь зон</span>
                            <span className={`font-bold text-lg ${hasAreaWarning ? 'text-red-600' : 'text-blue-900'}`}>
                                {totalZonesArea.toFixed(1)} м²
                            </span>
                        </div>
                        {hasAreaWarning && (
                            <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-red-600 bg-red-50 p-2 rounded-lg border border-red-100">
                                <AlertCircle className="w-4 h-4" />
                                Превышает общую площадь помещения ({objectData.totalArea} м²)
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => setStep(1)}
                            className="px-6 py-3.5 text-sm font-bold text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            Назад
                        </button>
                        <button
                            onClick={calculateInventory}
                            disabled={zones.length === 0}
                            className="bg-green-600 text-white py-3.5 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-lg shadow-green-200 active:scale-95"
                        >
                            Рассчитать
                        </button>
                    </div>

                    {showModal && (
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-200">
                            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
                                <h3 className="text-xl font-bold mb-6 text-gray-900">Добавить зону</h3>
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Тип зоны</label>
                                        <select
                                            value={currentZone.type}
                                            onChange={(e) => {
                                                const type = ZONE_TYPES.find(t => t.value === e.target.value);
                                                setCurrentZone({
                                                    ...currentZone,
                                                    type: e.target.value,
                                                    color: type?.color || ''
                                                });
                                            }}
                                            className="w-full px-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                        >
                                            <option value="">Выберите из списка</option>
                                            {ZONE_TYPES.map(type => (<option key={type.value} value={type.value}>{type.label}</option>))}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Площадь (м²)</label>
                                        <input
                                            type="number"
                                            value={currentZone.area}
                                            onChange={(e) => setCurrentZone({ ...currentZone, area: e.target.value })}
                                            className="w-full px-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="50"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3 mt-8">
                                    <button
                                        onClick={() => { setShowModal(false); setCurrentZone({ type: '', area: '', color: '' }); }}
                                        className="px-4 py-3 text-sm font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                                    >
                                        Отмена
                                    </button>
                                    <button
                                        onClick={handleAddZone}
                                        disabled={!currentZone.type || !currentZone.area}
                                        className="px-4 py-3 text-sm font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-300 transition-colors shadow-lg shadow-blue-200"
                                    >
                                        Добавить
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {step === 3 && results && (
                <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-200 animate-in fade-in slide-in-from-right-4">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Результаты расчета</h2>

                    <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white mb-8 shadow-xl shadow-blue-200">
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            {results.summary.map((item, i) => (
                                <div key={i} className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                                    <div className="text-sm font-medium text-blue-100 mb-2">{item.inventory}</div>
                                    <div className="flex items-baseline gap-1">
                                        <div className="text-3xl font-bold">{item.total}</div>
                                        <div className="text-sm text-blue-200">шт</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="border-t border-white/20 pt-5">
                            <div className="bg-white/20 backdrop-blur-md rounded-xl p-5 border border-white/20 flex items-center justify-between">
                                <div className="text-sm font-medium text-blue-100">Общая стоимость инвентаря</div>
                                <div className="text-3xl font-bold">{totalCost.toLocaleString()} ₽</div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => setStep(2)}
                            className="px-6 py-3.5 text-sm font-bold text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            Назад
                        </button>
                        <button
                            onClick={sendToManager}
                            className="bg-green-600 text-white py-3.5 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-green-700 transition-all shadow-lg shadow-green-200 active:scale-95"
                        >
                            Отправить менеджеру
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
