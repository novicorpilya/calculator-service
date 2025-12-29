

import React from 'react'
export const AuthHeader: React.FC = () => {
    return (
        <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-white rounded-lg mb-4">
                <div className="w-6 h-6 bg-blue-600 rounded-sm rotate-45" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">HICS</h1>
            <p className="text-blue-100">Калькулятор инвентаря для ресторанов и кафе</p>
        </div>
    )
}
