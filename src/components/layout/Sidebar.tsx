import React from 'react'

export const Sidebar: React.FC = () => {
    return (
        <aside className="sidebar w-64 h-full p-6">
            <h2 className="text-lg font-bold mb-6 text-gray-900">Menu</h2>
            <nav className="space-y-2">
                <a href="#" className="block px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-200 transition">Dashboard</a>
                <a href="#" className="block px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-200 transition">Calculator</a>
                <a href="#" className="block px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-200 transition">Settings</a>
            </nav>
        </aside>
    )
}
