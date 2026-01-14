import React from 'react';
import { CheckCircle2, ArrowRight, MailCheck } from 'lucide-react';

interface SuccessViewProps {
    type: 'registration' | 'login' | 'reset-request' | 'reset-complete';
    onContinue: () => void;
}

export const SuccessView: React.FC<SuccessViewProps> = ({ type, onContinue }) => {
    const content = {
        registration: {
            icon: <CheckCircle2 className="w-16 h-16 text-emerald-500" />,
            title: 'Поздравляем!',
            description: 'Ваш аккаунт успешно создан. Добро пожаловать в систему!',
        },
        login: {
            icon: <CheckCircle2 className="w-16 h-16 text-emerald-500" />,
            title: 'С возвращением!',
            description: 'Вы успешно авторизованы. Переходим в личный кабинет.',
        },
        'reset-request': {
            icon: <MailCheck className="w-16 h-16 text-blue-400" />,
            title: 'Письмо в пути',
            description: 'Мы отправили инструкции по сбросу пароля на вашу почту.',
        },
        'reset-complete': {
            icon: <CheckCircle2 className="w-16 h-16 text-emerald-500" />,
            title: 'Готово',
            description: 'Ваш новый пароль успешно сохранен. Можете войти в систему.',
        },
    }[type];

    return (
        <div className="text-center py-6 animate-in fade-in zoom-in-95 duration-500">
            <div className="flex justify-center mb-10 relative">
                <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full scale-150 transform -translate-y-4 opacity-50 dark:opacity-100" />
                <div className="relative group">
                    <div className="w-24 h-24 bg-card backdrop-blur-xl border border-border-theme rounded-[2.5rem] flex items-center justify-center shadow-2xl">
                        {content.icon}
                    </div>
                </div>
            </div>

            <h2 className="text-3xl font-black text-foreground mb-4 tracking-tighter">
                {content.title}
            </h2>

            <p className="text-foreground/50 mb-12 leading-relaxed font-black uppercase text-[10px] tracking-widest max-w-[280px] mx-auto">
                {content.description}
            </p>

            <button onClick={onContinue} className="btn-premium w-full !text-[12px] py-6">
                <span className="relative z-10">Продолжить работу</span>
                <ArrowRight className="w-4 h-4 relative z-10 transition-transform group-hover:translate-x-1" />
            </button>
        </div>
    );
};
