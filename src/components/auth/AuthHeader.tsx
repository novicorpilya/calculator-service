// filepath: src/components/auth/AuthHeader.tsx

import React from 'react'
import { Building2 } from 'lucide-react'

export const AuthHeader: React.FC = () => {
    return (
        <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-white bg-opacity-20 backdrop-blur mb-4">
                <Building2 className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">HoReCa</h1>
            <p className="text-blue-100">Калькулятор инвентаря для ресторанов и кафе</p>
        </div>
    )
}
