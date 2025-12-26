// filepath: src/components/auth/SuccessScreen.tsx

import React from 'react'
import { CheckCircle2, ArrowRight } from 'lucide-react'

interface SuccessScreenProps {
    onContinue: () => void
}

export const SuccessScreen: React.FC<SuccessScreenProps> = ({ onContinue }) => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700 flex items-center justify-center p-4">
            <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-400 mb-6 animate-pulse">
                    <CheckCircle2 className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-3">Добро пожаловать!</h2>
                <p className="text-blue-100 text-lg mb-8">Вы успешно вошли в систему</p>
                <button
                    onClick={onContinue}
                    className="inline-flex items-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                >
                    Перейти к калькулятору
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    )
}
