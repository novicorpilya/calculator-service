import React from 'react'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { Footer } from '@/components/layout/Footer'

export const ManagerDashboard: React.FC = () => {
    return (
        <div className="flex flex-col h-screen">
            <Header />
            <div className="flex flex-1 overflow-hidden">
                <Sidebar />
                <main className="flex-1 overflow-auto p-6">
                    <h1 className="text-3xl font-bold mb-6">Manager Dashboard</h1>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="card">
                            <h3 className="text-lg font-semibold mb-2">Total Users</h3>
                            <p className="text-3xl font-bold text-blue-600">0</p>
                        </div>
                        <div className="card">
                            <h3 className="text-lg font-semibold mb-2">Active Sessions</h3>
                            <p className="text-3xl font-bold text-green-600">0</p>
                        </div>
                    </div>
                </main>
            </div>
            <Footer />
        </div>
    )
}
