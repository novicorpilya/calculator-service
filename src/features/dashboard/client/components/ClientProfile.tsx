import React from 'react';

export const ClientProfile: React.FC = () => {
    return (
        <div className="max-w-2xl">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Мой профиль</h1>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-6">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Название организации</label>
                    <input
                        type="text"
                        defaultValue="Мр Сити"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Email</label>
                    <input
                        type="email"
                        defaultValue="client@mrcity.ru"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Телефон</label>
                    <input
                        type="tel"
                        defaultValue="+7 (999) 123-45-67"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Адрес</label>
                    <input
                        type="text"
                        defaultValue="ул. Ленина, 45"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                </div>

                <div className="pt-4">
                    <button className="bg-blue-600 text-white px-8 py-3.5 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95">
                        Сохранить изменения
                    </button>
                </div>
            </div>
        </div>
    );
};
