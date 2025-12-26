import React from 'react'
import { Button } from '@/components/ui/Button'

export const Landing: React.FC = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="text-center px-6">
                <h1 className="text-5xl font-bold text-gray-900 mb-4">Welcome to Calculator Service</h1>
                <p className="text-xl text-gray-600 mb-8">Fast, reliable calculations at your fingertips</p>
                <div className="flex gap-4 justify-center">
                    <Button variant="primary">Get Started</Button>
                    <Button variant="secondary">Learn More</Button>
                </div>
            </div>
        </div>
    )
}
