import React from 'react'
import { CheckCircle2, ArrowRight, MailCheck, PartyPopper } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface SuccessViewProps {
    type: 'registration' | 'login' | 'reset-request' | 'reset-complete'
    onContinue: () => void
}

export const SuccessView: React.FC<SuccessViewProps> = ({ type, onContinue }) => {
    const content = {
        registration: {
            icon: <PartyPopper className="w-16 h-16 text-blue-600" />,
            title: "Добро пожаловать!",
            description: "Ваша организация успешно зарегистрирована. Мы подготовили рабочее пространство."
        },
        login: {
            icon: <CheckCircle2 className="w-16 h-16 text-green-500" />,
            title: "С возвращением!",
            description: "Вы успешно авторизованы. Переходим в личный кабинет для продолжения работы."
        },
        'reset-request': {
            icon: <MailCheck className="w-16 h-16 text-blue-500" />,
            title: "Письмо в пути",
            description: "Проверьте ваш почтовый ящик. Мы отправили ссылку для безопасного сброса пароля."
        },
        'reset-complete': {
            icon: <CheckCircle2 className="w-16 h-16 text-green-500" />,
            title: "Доступ восстановлен",
            description: "Ваш новый пароль успешно сохранен. Теперь вы можете войти в систему."
        }
    }[type]

    return (
        <div className="text-center py-4 animate-in fade-in zoom-in duration-300">
            <div className="flex justify-center mb-8 relative">
                <div className="absolute inset-0 bg-blue-500/10 blur-3xl rounded-full scale-150" />
                <div className="relative animate-bounce-slow">
                    {content.icon}
                </div>
            </div>

            <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">
                {content.title}
            </h2>

            <p className="text-gray-500 mb-10 leading-relaxed font-medium">
                {content.description}
            </p>

            <Button
                onClick={onContinue}
                className="w-full group"
            >
                <div className="flex items-center justify-center gap-2">
                    <span>Перейти далее</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </div>
            </Button>
        </div>
    )
}
