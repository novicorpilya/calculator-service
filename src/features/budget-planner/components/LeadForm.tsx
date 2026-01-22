import React, { useState, useMemo } from 'react';
import { User, Mail, Phone, Send, CheckCircle2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/app/routes/routes.constants';

interface LeadFormProps {
    onSubmit: (data: { name: string; email: string; phone: string }) => Promise<void>;
    isSubmitting: boolean;
    isEmbedMode?: boolean;
}

export const LeadForm: React.FC<LeadFormProps> = ({
    onSubmit,
    isSubmitting,
    isEmbedMode = false,
}) => {
    const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
    const [touched, setTouched] = useState({ name: false, email: false, phone: false });
    const [isSuccess, setIsSuccess] = useState(false);

    // Strict Validation Logic
    const validation = useMemo(() => {
        const nameValid = formData.name.trim().length >= 2;
        const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
        const phoneValid = formData.phone.length >= 10;
        return {
            nameValid,
            emailValid,
            phoneValid,
            isValid: nameValid && emailValid && phoneValid,
        };
    }, [formData]);

    const handleBlur = (field: string) => {
        setTouched((prev) => ({ ...prev, [field]: true }));
    };

    const handleNameChange = (val: string) => {
        // Only letters and spaces logic preserved
        const filtered = val.replace(/[^a-zA-Zа-яА-ЯёЁ\s]/g, '');
        setFormData((prev) => ({ ...prev, name: filtered }));
    };

    const handlePhoneChange = (val: string) => {
        // Only digits logic preserved
        const filtered = val.replace(/\D/g, '');
        setFormData((prev) => ({ ...prev, phone: filtered }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setTouched({ name: true, email: true, phone: true }); // Touch all fields to show errors

        if (!validation.isValid) {
            toast.error('Пожалуйста, заполните все обязательные поля');
            return;
        }

        try {
            await onSubmit(formData);
            setIsSuccess(true);
            toast.success('Заявка успешно отправлена!');
        } catch (error) {
            // Parent component handles the error toast usually, but safe to have catch block
            console.error(error);
        }
    };

    if (isSuccess) {
        return (
            <div
                className={`text-center space-y-8 py-16 animate-in fade-in zoom-in duration-700 p-12 rounded-[40px] shadow-2xl border ${
                    isEmbedMode
                        ? 'bg-white border-slate-200'
                        : 'bg-white/5 backdrop-blur-md border-white/10'
                }`}
            >
                <div className="relative">
                    <div className="w-24 h-24 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
                        <CheckCircle2 size={48} />
                    </div>
                </div>
                <div className="space-y-4">
                    <h3
                        className={`text-4xl font-black tracking-tight ${isEmbedMode ? 'text-slate-900' : 'text-white'}`}
                    >
                        Все готово!
                    </h3>
                    <p
                        className={`text-lg leading-relaxed max-w-md mx-auto ${isEmbedMode ? 'text-slate-500' : 'text-white/60'}`}
                    >
                        Ваш расчет принят в обработку. Наши эксперты свяжутся с вами в течение 15
                        минут для финального подтверждения заказа.
                    </p>
                </div>
                <button
                    onClick={() => window.location.reload()}
                    className="group flex items-center gap-2 mx-auto font-black uppercase tracking-[0.2em] text-[10px] text-primary hover:text-primary/80 transition-all"
                >
                    <span className="border-b-2 border-transparent group-hover:border-primary pb-1">
                        Новый расчет
                    </span>
                </button>
            </div>
        );
    }

    const inputBaseClass = isEmbedMode
        ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-primary hover:bg-slate-100'
        : 'bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-primary hover:bg-white/10';

    const getErrorClass = (isTouched: boolean, isValid: boolean) =>
        isTouched && !isValid
            ? 'border-red-500/50'
            : isEmbedMode
              ? 'border-slate-200'
              : 'border-white/10';

    return (
        <form
            onSubmit={handleSubmit}
            className="w-full max-w-2xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-10 duration-1000"
        >
            <div className="text-center space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest mb-4">
                    <ShieldCheck size={14} /> Конфиденциальность гарантирована
                </div>
                <h3
                    className={`text-4xl md:text-5xl font-black tracking-tighter leading-none ${isEmbedMode ? 'text-slate-900' : 'text-white'}`}
                >
                    Получить <span className="text-primary italic">премиум</span> расчет
                </h3>
                <p
                    className={`text-sm font-medium leading-relaxed max-w-sm mx-auto uppercase tracking-wide ${isEmbedMode ? 'text-slate-400' : 'text-white/40'}`}
                >
                    Укажите данные для отправки детализированной сметы на ваш Email
                </p>
            </div>

            <div className="space-y-6">
                {/* Name Field */}
                <div className="relative group">
                    <div
                        className={`absolute left-6 top-1/2 -translate-y-1/2 transition-all duration-300 ${formData.name ? 'text-primary' : isEmbedMode ? 'text-slate-400' : 'text-white/20'}`}
                    >
                        <User size={24} />
                    </div>
                    <input
                        required
                        type="text"
                        placeholder="Ваше Имя"
                        value={formData.name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        onBlur={() => handleBlur('name')}
                        className={`w-full border-2 rounded-[32px] pl-16 pr-8 py-6 text-lg font-bold outline-none transition-all duration-500 ${inputBaseClass} ${getErrorClass(touched.name, validation.nameValid)}`}
                    />
                </div>

                {/* Email Field */}
                <div className="relative group">
                    <div
                        className={`absolute left-6 top-1/2 -translate-y-1/2 transition-all duration-300 ${formData.email ? 'text-primary' : isEmbedMode ? 'text-slate-400' : 'text-white/20'}`}
                    >
                        <Mail size={24} />
                    </div>
                    <input
                        required
                        type="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={(e) =>
                            setFormData((prev) => ({ ...prev, email: e.target.value }))
                        }
                        onBlur={() => handleBlur('email')}
                        className={`w-full border-2 rounded-[32px] pl-16 pr-8 py-6 text-lg font-bold outline-none transition-all duration-500 ${inputBaseClass} ${getErrorClass(touched.email, validation.emailValid)}`}
                    />
                </div>

                {/* Phone Field */}
                <div className="relative group">
                    <div
                        className={`absolute left-6 top-1/2 -translate-y-1/2 transition-all duration-300 ${formData.phone ? 'text-primary' : isEmbedMode ? 'text-slate-400' : 'text-white/20'}`}
                    >
                        <Phone size={24} />
                    </div>
                    <input
                        required
                        type="tel"
                        placeholder="Номер телефона"
                        value={formData.phone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        onBlur={() => handleBlur('phone')}
                        className={`w-full border-2 rounded-[32px] pl-16 pr-8 py-6 text-lg font-bold outline-none transition-all duration-500 ${inputBaseClass} ${getErrorClass(touched.phone, validation.phoneValid)}`}
                    />
                </div>
            </div>

            <div className="pt-4">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-premium group w-full py-8 text-xl flex items-center justify-center gap-4 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed hover:scale-[1.02] active:scale-95 transition-all duration-500 relative overflow-hidden"
                >
                    <div
                        className="absolute inset-0 bg-gradient-to-r from-primary via-primary/80 to-primary animate-shimmer"
                        style={{ backgroundSize: '200% 100%' }}
                    ></div>
                    <span className="relative flex items-center gap-3">
                        {isSubmitting ? (
                            'ОБРАБОТКА СУПЕРФУНКЦИЕЙ...'
                        ) : (
                            <>
                                <Send
                                    size={24}
                                    className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"
                                />{' '}
                                ПОЛУЧИТЬ СМЕТУ
                            </>
                        )}
                    </span>
                </button>
                <p
                    className={`mt-8 text-center text-[9px] font-black uppercase tracking-[0.3em] ${isEmbedMode ? 'text-slate-400' : 'text-white/20'}`}
                >
                    Нажимая кнопку, вы соглашаетесь с{' '}
                    <Link
                        to={ROUTES.ERRORS.PRIVACY}
                        className="text-primary hover:opacity-80 transition-opacity"
                    >
                        политикой конфиденциальности
                    </Link>
                </p>
            </div>
        </form>
    );
};
