import React, { memo, useState } from 'react';
import { Mail, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { z } from 'zod';
import { useServices } from '@/app/di/ServiceContainer';

const feedbackSchema = z.object({
    name: z.string().min(1, 'Имя обязательно'),
    email: z.string().min(1, 'Email обязателен').email('Некорректный email'),
    message: z.string().optional(),
    _honey: z.string().optional(),
});

const InputWrapper = ({ 
    label, 
    id, 
    isFocused, 
    hasValue, 
    error,
    children 
}: { 
    label: string; 
    id: string; 
    isFocused: boolean; 
    hasValue: boolean; 
    error?: string;
    children: React.ReactNode 
}) => (
    <div className="space-y-1">
        <div className={`
            relative rounded-xl border transition-all duration-300 bg-background/50 backdrop-blur-sm
            ${error 
                ? 'border-red-500 shadow-[0_0_20px_-10px_rgba(239,68,68,0.5)] ring-1 ring-red-500/20' 
                : isFocused 
                    ? 'border-primary shadow-[0_0_20px_-10px_rgba(var(--primary-rgb),0.5)] ring-1 ring-primary/20' 
                    : 'border-border-theme hover:border-primary/30'}
        `}>
            <label 
                htmlFor={id}
                className={`
                    absolute left-4 transition-all duration-200 pointer-events-none font-bold uppercase tracking-widest
                    ${isFocused || hasValue
                        ? 'text-[8px] top-2 ' + (error ? 'text-red-500' : 'text-primary')
                        : 'text-[10px] top-4 text-muted-foreground'}
                `}
            >
                {label}
            </label>
            {children}
        </div>
        {error && <span className="text-[10px] text-red-500 font-bold ml-4 uppercase tracking-wider">{error}</span>}
    </div>
);

export const LandingContact: React.FC = memo(() => {
    const { emailService } = useServices();
    const [isLoading, setIsLoading] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: '',
        _honey: ''
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateField = (field: keyof typeof formData, value: string) => {
        const fieldSchema = feedbackSchema.shape[field];
        const result = fieldSchema.safeParse(value);

        if (!result.success) {
            const formattedError = result.error.issues[0]?.message;
            setErrors(prev => ({ ...prev, [field]: formattedError || 'Ошибка' }));
        } else {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const handleFocus = (field: keyof typeof formData) => {
        setFocusedField(field);
        setErrors(prev => ({ ...prev, [field]: '' }));
    };

    const handleBlur = (field: keyof typeof formData) => {
        setFocusedField(null);
        validateField(field, formData[field]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validation
        const result = feedbackSchema.safeParse(formData);
        if (!result.success) {
            const fieldErrors: Record<string, string> = {};
            result.error.issues.forEach(issue => {
                if (issue.path[0]) {
                    fieldErrors[issue.path[0].toString()] = issue.message;
                }
            });
            setErrors(fieldErrors);
            toast.error('Пожалуйста, исправьте ошибки в форме');
            return;
        }

        setErrors({});
        setIsLoading(true);

        try {
            const response = await emailService.sendFeedback({ ...formData, message: formData.message || '' });
            
            if (response.success) {
                toast.success('Сообщение отправлено! Мы свяжемся с вами в ближайшее время.');
                setFormData({ name: '', email: '', message: '', _honey: '' });
            } else {
                toast.error('Ошибка отправки сообщения. Попробуйте позже.');
            }
        } catch {
            toast.error('Произошла ошибка. Попробуйте позже.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section id="contacts" className="py-24 relative overflow-hidden bg-muted/30">
             {/* Decorative Elements */}
             <div className="absolute bottom-0 right-0 w-[40%] h-[50%] bg-primary/5 blur-[120px] rounded-full pointer-events-none -z-10" />
             <div className="absolute top-20 left-10 w-32 h-32 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none -z-10" />

            <div className="fluid-container relative z-10">
                <div className="text-center mb-16 space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest mb-4">
                        <Mail size={14} />
                        <span>Контакты</span>
                    </div>
                    <h2 className="text-3xl md:text-5xl font-[1000] tracking-tight uppercase">
                        Связаться с <span className="text-primary">Нами</span>
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        У вас есть вопросы или предложение? Заполните форму, и наша команда свяжется с вами.
                    </p>
                </div>

                <div className="max-w-2xl mx-auto">
                    {/* Feedback Form */}
                    <form onSubmit={handleSubmit} className="bg-card border border-border-theme rounded-[2.5rem] p-6 sm:p-10 shadow-2xl shadow-primary/5 relative">
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <InputWrapper 
                                    label="Имя" 
                                    id="name"
                                    isFocused={focusedField === 'name'}
                                    hasValue={!!formData.name}
                                    error={errors.name}
                                >
                                    <input 
                                        id="name"
                                        aria-invalid={!!errors.name}
                                        value={formData.name}
                                        onChange={e => {
                                            const value = e.target.value.replace(/\d/g, '');
                                            setFormData(p => ({ ...p, name: value }));
                                            if (errors.name) setErrors(p => ({ ...p, name: '' }));
                                        }}
                                        onFocus={() => handleFocus('name')}
                                        onBlur={() => handleBlur('name')}
                                        className="w-full bg-transparent border-none px-4 pt-6 pb-2 outline-none text-sm font-medium h-14"
                                        placeholder=" "
                                    />
                                </InputWrapper>

                                <InputWrapper 
                                    label="Email" 
                                    id="email"
                                    isFocused={focusedField === 'email'}
                                    hasValue={!!formData.email}
                                    error={errors.email}
                                >
                                    <input 
                                        id="email"
                                        aria-invalid={!!errors.email}
                                        value={formData.email}
                                        onChange={e => {
                                            setFormData(p => ({ ...p, email: e.target.value }));
                                            if (errors.email) setErrors(p => ({ ...p, email: '' }));
                                        }}
                                        onFocus={() => handleFocus('email')}
                                        onBlur={() => handleBlur('email')}
                                        className="w-full bg-transparent border-none px-4 pt-6 pb-2 outline-none text-sm font-medium h-14"
                                        placeholder=" "
                                    />
                                </InputWrapper>
                            </div>

                            <InputWrapper 
                                label="Сообщение" 
                                id="message"
                                isFocused={focusedField === 'message'}
                                hasValue={!!formData.message}
                                error={errors.message}
                            >
                                <textarea 
                                    id="message"
                                    aria-invalid={!!errors.message}
                                    rows={3}
                                    value={formData.message}
                                    onChange={e => {
                                        setFormData(p => ({ ...p, message: e.target.value }));
                                        if (errors.message) setErrors(p => ({ ...p, message: '' }));
                                    }}
                                    onFocus={() => handleFocus('message')}
                                    onBlur={() => handleBlur('message')}
                                    className="w-full bg-transparent border-none px-4 pt-7 pb-2 outline-none text-sm font-medium resize-none min-h-[100px]"
                                    placeholder=" "
                                />
                            </InputWrapper>

                            {/* Honeypot field for bots - visually hidden but present in DOM */}
                            <input 
                                type="text" 
                                name="_honey" 
                                value={formData._honey || ''}
                                tabIndex={-1}
                                autoComplete="off"
                                onChange={e => setFormData(p => ({ ...p, _honey: e.target.value }))}
                                className="absolute opacity-0 -z-50 h-0 w-0 pointer-events-none" 
                            />

                            <button 
                                type="submit" 
                                disabled={isLoading}
                                className="w-full group relative overflow-hidden bg-primary text-white font-bold py-4 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5"
                            >
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                <div className="relative flex items-center justify-center gap-3">
                                    {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} className="group-hover:translate-x-1 transition-transform" />}
                                    <span className="uppercase tracking-widest text-xs">Отправить сообщение</span>
                                </div>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </section>
    );
});
