import { Users } from 'lucide-react';
import { OBJECT_TYPES } from '@/features/dashboard/dashboard.types';

interface ObjectBasicSpecsProps {
    data: {
        type: string;
        totalArea: string;
        staffCount: string;
        dailyVisitors: string;
    };
    onChange: (updates: Partial<ObjectBasicSpecsProps['data']>) => void;
}

export const ObjectBasicSpecs: React.FC<ObjectBasicSpecsProps> = ({ data, onChange }) => {
    const labelClass =
        'block text-[10px] font-black text-foreground/40 uppercase tracking-[0.2em] ml-1 mb-2';

    return (
        <div className="space-y-6 sm:space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                    <label className={labelClass}>Тип объекта</label>
                    <div className="relative group">
                        <select
                            value={data.type}
                            onChange={(e) => onChange({ type: e.target.value })}
                            className="input-premium appearance-none cursor-pointer pr-10 pl-4"
                        >
                            <option value="">Выберите тип...</option>
                            {OBJECT_TYPES.map((t) => (
                                <option key={t.value} value={t.value}>
                                    {t.label}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-foreground/20 group-hover:text-primary transition-colors">
                            <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="3"
                                    d="M19 9l-7 7-7-7"
                                />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className={labelClass}>Площадь (м²)</label>
                    <div className="relative group">
                        <input
                            type="number"
                            min="0"
                            value={data.totalArea}
                            onChange={(e) => onChange({ totalArea: e.target.value })}
                            className="input-premium pl-4"
                            placeholder="120"
                        />
                        <div className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 text-[9px] font-black text-foreground/20 uppercase tracking-widest">
                            M²
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                    <label className={labelClass}>Количество персонала</label>
                    <div className="relative group">
                        <div className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 text-foreground/20 group-focus-within:text-primary transition-colors">
                            <Users size={16} />
                        </div>
                        <input
                            type="number"
                            min="0"
                            value={data.staffCount}
                            onChange={(e) => onChange({ staffCount: e.target.value })}
                            className="input-premium pl-11 sm:pl-14"
                            placeholder="55"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className={labelClass}>Посетителей в день</label>
                    <div className="relative group">
                        <input
                            type="number"
                            min="0"
                            value={data.dailyVisitors}
                            onChange={(e) => onChange({ dailyVisitors: e.target.value })}
                            className="input-premium pl-4"
                            placeholder="100"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
