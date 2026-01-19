import React, { useState, useEffect } from 'react';
import { 
    X, 
    Save, 
    Tag,
    Hash,
    Layers,
    DollarSign,
    Package,
    Store,
    Maximize2,
    Users,
    Zap,
    Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { useServices } from '@/app/di/ServiceContainer';
import type { AdminInventoryItem } from '@/services/inventory-admin.service';
import type { Supplier } from '@/features/dashboard/dashboard.types';

interface AdminInventoryFormProps {
    initialData?: AdminInventoryItem;
    onClose: () => void;
    onSuccess: () => void;
}

export const AdminInventoryForm: React.FC<AdminInventoryFormProps> = ({ 
    initialData, 
    onClose, 
    onSuccess 
}) => {
    const { inventoryAdminService, supplierService } = useServices();
    const [loading, setLoading] = useState(false);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        category: '',
        price: 0,
        stock: 0,
        supplier_id: '',
        norm_area: 0,
        norm_personnel: 0,
        norm_intensity: 1,
        replacement_cycle_days: 30,
        series: '',
        tier: 1
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name,
                sku: initialData.sku,
                category: initialData.category || '',
                price: initialData.price,
                stock: initialData.stock,
                supplier_id: initialData.supplier_id || '',
                norm_area: initialData.norm_area || 0,
                norm_personnel: initialData.norm_personnel || 0,
                norm_intensity: initialData.norm_intensity || 1,
                replacement_cycle_days: initialData.replacement_cycle_days || 30,
                series: initialData.series || '',
                tier: initialData.tier || 1
            });
        }
    }, [initialData]);

    useEffect(() => {
        const loadSuppliers = async () => {
            const res = await supplierService.getSuppliers();
            if (res.success && res.data) {
                setSuppliers(res.data);
            }
        };
        loadSuppliers();
    }, [supplierService]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload: Record<string, unknown> = { ...formData };
            if (!payload.supplier_id) delete payload.supplier_id;

            let res;
            if (initialData) {
                res = await inventoryAdminService.updateItem(initialData.id, payload);
            } else {
                res = await inventoryAdminService.createItem(payload as Omit<AdminInventoryItem, 'id' | 'updated_at' | 'supplier'>);
            }

            if (res.success) {
                toast.success(initialData ? 'Товар обновлен' : 'Товар создан');
                onSuccess();
            } else {
                toast.error(res.error?.message || 'Ошибка сохранения');
            }
        } catch {
            toast.error('Произошла непредвиденная ошибка');
        } finally {
            setLoading(false);
        }
    };

    interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
        label: string;
        icon?: React.ElementType;
    }

    const InputField = ({ 
        label, 
        icon: Icon, 
        required = false, 
        className = '',
        ...props 
    }: InputFieldProps) => (
        <div className={`space-y-2 ${className}`}>
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                {Icon && <Icon size={12} className="text-primary/60" />}
                {label}
                {required && <span className="text-red-500">*</span>}
            </label>
            <div className="relative group">
                <input 
                    className="w-full h-11 bg-muted/30 border border-transparent focus:border-primary/30 focus:bg-background hover:bg-muted/50 rounded-xl px-4 text-sm font-medium transition-all outline-none placeholder:text-muted-foreground/30"
                    {...props}
                />
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity" 
                onClick={onClose}
            />

            {/* Modal Window */}
            <div className="relative w-full max-w-3xl bg-card rounded-[2rem] shadow-2xl border border-white/10 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">
                
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-border-theme bg-muted/10">
                    <div>
                        <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
                           {initialData ? <Edit2Icon /> : <PlusIcon />} 
                           {initialData ? 'Редактирование' : 'Новое оборудование'}
                        </h3>
                        <p className="text-xs font-medium text-muted-foreground mt-1">
                            {initialData ? `ID: ${initialData.id}` : 'Заполните данные для создания новой позиции'}
                        </p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2.5 hover:bg-white/10 rounded-full transition-colors text-muted-foreground hover:text-foreground"
                    >
                        <X size={22} />
                    </button>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 custom-scrollbar">
                    <div className="p-8 space-y-8">
                        
                        {/* Section 1: Basic Info */}
                        <section className="space-y-4">
                            <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary/80">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                Описание Товара
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-5">
                                <InputField 
                                    label="Наименование" 
                                    icon={Tag}
                                    placeholder="Например: Поломоечная машина Karcher"
                                    required
                                    className="lg:col-span-6"
                                    value={formData.name}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, name: e.target.value})}
                                />
                                <InputField 
                                    label="Артикул / SKU" 
                                    icon={Hash}
                                    placeholder="ART-00001"
                                    required
                                    className="lg:col-span-3"
                                    value={formData.sku}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, sku: e.target.value})}
                                />
                                <InputField 
                                    label="Серия" 
                                    icon={Layers}
                                    placeholder="Pro Series"
                                    className="lg:col-span-3"
                                    value={formData.series}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, series: e.target.value})}
                                />
                                <InputField 
                                    label="Категория" 
                                    icon={Layers}
                                    placeholder="Оборудование, Химия..."
                                    className="sm:col-span-2 lg:col-span-6"
                                    value={formData.category}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, category: e.target.value})}
                                />
                            </div>
                        </section>

                        <div className="h-px bg-border-theme/50 w-full" />

                        {/* Section 2: Economics */}
                        <section className="space-y-4">
                            <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-500/80">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Экономика и Сток
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                                <InputField 
                                    label="Стоимость (RUB)" 
                                    icon={DollarSign}
                                    type="number"
                                    min="0"
                                    className="font-mono"
                                    value={formData.price}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, price: Number(e.target.value)})}
                                />
                                <InputField 
                                    label="Текущий Сток" 
                                    icon={Package}
                                    type="number"
                                    min="0"
                                    value={formData.stock}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, stock: Number(e.target.value)})}
                                />
                                <div className="space-y-2">
                                     <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                        <Store size={12} className="text-primary/60" />
                                        Поставщик
                                    </label>
                                    <div className="relative">
                                        <select 
                                             className="w-full h-11 bg-muted/30 border border-transparent focus:border-primary/30 focus:bg-background hover:bg-muted/50 rounded-xl px-4 text-sm font-medium transition-all outline-none appearance-none cursor-pointer"
                                            value={formData.supplier_id}
                                            onChange={e => setFormData({...formData, supplier_id: e.target.value})}
                                        >
                                            <option value="">Выберите поставщика...</option>
                                            {suppliers.map(s => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                                            <Maximize2 size={12} className="rotate-45" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                         <div className="h-px bg-border-theme/50 w-full" />

                        {/* Section 3: Norms */}
                         <section className="space-y-4">
                            <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-blue-500/80">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                Нормативы и Расчеты
                            </h4>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                                <InputField 
                                    label="М² Норма" 
                                    icon={Maximize2}
                                    type="number"
                                    step="0.0001"
                                    placeholder="0.00"
                                    value={formData.norm_area}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, norm_area: Number(e.target.value)})}
                                />
                                <InputField 
                                    label="Штат Норма" 
                                    icon={Users}
                                    type="number"
                                    step="0.0001"
                                    placeholder="0.00"
                                    value={formData.norm_personnel}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, norm_personnel: Number(e.target.value)})}
                                />
                                <InputField 
                                    label="Интенсивность" 
                                    icon={Zap}
                                    type="number"
                                    step="0.1"
                                    placeholder="1.0"
                                    value={formData.norm_intensity}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, norm_intensity: Number(e.target.value)})}
                                />
                                <InputField 
                                    label="Цикл (дни)" 
                                    icon={Clock}
                                    type="number"
                                    placeholder="30"
                                    value={formData.replacement_cycle_days}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, replacement_cycle_days: Number(e.target.value)})}
                                />
                            </div>
                        </section>

                    </div>
                </form>

                {/* Footer */}
                <div className="p-6 border-t border-border-theme bg-muted/10 flex justify-end gap-4">
                    <button 
                        onClick={onClose}
                        className="px-8 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
                        disabled={loading}
                    >
                        Отмена
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-8 py-3 bg-primary hover:bg-primary/90 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-primary/25 hover:shadow-primary/40 active:scale-95 transition-all flex items-center gap-2"
                    >
                        {loading ? (
                            <span className="animate-pulse">Сохранение...</span>
                        ) : (
                            <>
                                <Save size={16} strokeWidth={2.5} />
                                Сохранить
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Mini Components for Icons
const Edit2Icon = () => (
    <div className="p-2 bg-primary/10 rounded-lg text-primary">
       <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
    </div>
);

const PlusIcon = () => (
    <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
       <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>
    </div>
);
