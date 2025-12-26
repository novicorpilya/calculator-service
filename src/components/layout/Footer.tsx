import React from 'react'

export const Footer: React.FC = () => {
    return (
        <footer className="footer">
            <div className="max-w-6xl mx-auto">
                <p className="text-center">&copy; 2024 Calculator Service. All rights reserved.</p>
                <div className="flex justify-center gap-6 mt-4">
                    <a href="#" className="text-gray-300 hover:text-white transition">Privacy</a>
                    <a href="#" className="text-gray-300 hover:text-white transition">Terms</a>
                    <a href="#" className="text-gray-300 hover:text-white transition">Contact</a>
                </div>
            </div>
        </footer>
    )
}
