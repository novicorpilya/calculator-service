import React from 'react'

export const Header: React.FC = () => {
    return (
        <header className="header px-6 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Calculator Service</h1>
            <nav className="flex gap-4">
                <a href="#" className="text-gray-600 hover:text-gray-900 transition">Home</a>
                <a href="#" className="text-gray-600 hover:text-gray-900 transition">About</a>
            </nav>
        </header>
    )
}
