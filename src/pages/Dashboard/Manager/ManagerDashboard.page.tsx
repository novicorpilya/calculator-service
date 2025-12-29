import React from 'react'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { Footer } from '@/components/layout/Footer'
import { Users, BarChart3, ClipboardList, LifeBuoy } from 'lucide-react'

export const ManagerDashboard: React.FC = () => {
    return (
        <div className="flex flex-col h-screen bg-gray-50">
            <Header />
            <div className="flex flex-1 overflow-hidden">
                <Sidebar />
                <main className="flex-1 overflow-auto p-8">
                    <div className="max-w-7xl mx-auto">
                        <header className="mb-10">
                            <h1 className="text-3xl font-black text-gray-900 mb-2">Панель управления менеджера</h1>
                            <p className="text-gray-500 text-lg">Управление клиентами, аналитика и отчетность всей системы</p>
                        </header>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                            <StatCard
                                icon={<Users className="w-6 h-6 text-blue-600" />}
                                title="Клиенты"
                                value="1,280"
                                color="bg-blue-50"
                            />
                            <StatCard
                                icon={<ClipboardList className="w-6 h-6 text-green-600" />}
                                title="Расчеты"
                                value="3,456"
                                color="bg-green-50"
                            />
                            <StatCard
                                icon={<BarChart3 className="w-6 h-6 text-purple-600" />}
                                title="Статистика"
                                value="+24%"
                                color="bg-purple-50"
                            />
                            <StatCard
                                icon={<LifeBuoy className="w-6 h-6 text-orange-600" />}
                                title="Поддержка"
                                value="12"
                                color="bg-orange-50"
                            />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                                <h3 className="text-xl font-bold mb-6">Список последних клиентов</h3>
                                <div className="space-y-4">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <div key={i} className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                                                    ID
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900">Организация #{i}</p>
                                                    <p className="text-sm text-gray-500">client@example.com</p>
                                                </div>
                                            </div>
                                            <button className="text-blue-600 font-bold text-sm hover:underline">Детали</button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
                                <h3 className="text-xl font-bold mb-6">Быстрые действия</h3>
                                <div className="space-y-3 font-semibold">
                                    <ActionButton label="Создать отчет" primary />
                                    <ActionButton label="Добавить клиента" />
                                    <ActionButton label="Написать в поддержку" />
                                    <ActionButton label="Настройки системы" />
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
            <Footer />
        </div>
    )
}

const StatCard = ({ icon, title, value, color }: { icon: React.ReactNode, title: string, value: string, color: string }) => (
    <div className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center mb-4`}>
            {icon}
        </div>
        <p className="text-gray-500 font-bold text-sm uppercase tracking-wider mb-1">{title}</p>
        <p className="text-2xl font-black text-gray-900">{value}</p>
    </div>
)

const ActionButton = ({ label, primary = false }: { label: string, primary?: boolean }) => (
    <button className={`w-full py-4 px-6 rounded-2xl transition-all ${primary
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 hover:bg-blue-700'
            : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-100 leading-tight'
        }`}>
        {label}
    </button>
)
