import React from 'react'
import { ArrowRight, Play, Layout, Palette, Ruler, PackageCheck } from 'lucide-react'

interface LandingProps {
    onStart: () => void
}

export const Landing: React.FC<LandingProps> = ({ onStart }) => {
    return (
        <div className="min-h-screen bg-white text-gray-900 selection:bg-blue-600/10 overflow-x-hidden font-sans flex flex-col">
            {/* Fluid Header */}
            <header className="w-full max-w-[1280px] mx-auto p-[clamp(1rem,4vw,2rem)] flex flex-wrap justify-between items-center gap-4 z-20">
                <div className="flex items-center gap-2 font-bold text-[clamp(1.2rem,5vw,1.5rem)] tracking-tighter shrink-0">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <div className="w-4 h-4 bg-white rounded-sm rotate-45" />
                    </div>
                    <span>Horeca<span className="text-blue-600">Clean</span></span>
                </div>
                <button
                    onClick={onStart}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl border-2 border-blue-600 bg-transparent text-blue-600 text-xs font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all duration-300 shadow-sm active:scale-95"
                >
                    Войти в систему
                </button>
            </header>

            {/* Main Section */}
            <main className="flex-1 w-full max-w-[1280px] mx-auto px-[clamp(1.25rem,5vw,2.5rem)] pt-[clamp(3rem,10vh,8rem)] pb-[clamp(3rem,8vh,6rem)]">
                <div className="flex flex-wrap items-center gap-[clamp(3rem,8vw,5rem)]">

                    {/* Left content block - stretches until it needs to wrap */}
                    <div className="flex-1 min-w-[min(100%,450px)]">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 text-[clamp(0.7rem,2vw,0.85rem)] font-extrabold mb-6 uppercase tracking-wider">
                            <Palette className="w-4 h-4 shrink-0" />
                            Цветовое кодирование по зонам
                        </div>

                        <h1 className="text-[clamp(2.5rem,8vw,4.5rem)] font-black text-gray-900 leading-[1.05] mb-6 tracking-tight">
                            Рассчитайте инвентарь <br />
                            <span className="text-blue-600">с точностью до м²</span>
                        </h1>

                        <p className="text-[clamp(1rem,3vw,1.25rem)] text-gray-600 mb-10 leading-relaxed max-w-[600px]">
                            Первый в России калькулятор для HoReCa, который рассчитывает количество
                            швабр, ветоши и химии исходя из площади зон и стандартов цветовой маркировки.
                        </p>

                        <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                            <button
                                onClick={onStart}
                                className="group relative flex-1 sm:flex-none flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-[clamp(2rem,5vw,3.5rem)] py-[clamp(1.2rem,3vw,1.5rem)] rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-95 overflow-visible"
                            >
                                <div className="absolute -inset-1.5 bg-blue-600/20 rounded-[24px] blur-xl animate-pulse group-hover:bg-blue-600/40 transition-all"></div>
                                <Play className="w-4 h-4 fill-current shrink-0 relative z-10" />
                                <span className="whitespace-nowrap relative z-10">Демо доступ</span>
                                <ArrowRight className="w-4 h-4 shrink-0 relative z-10 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>

                    {/* Right visual block - adapts size automatically */}
                    <div className="flex-1 min-w-[min(100%,400px)] relative group">
                        <div className="relative z-10 bg-white rounded-[clamp(1.5rem,4vw,2.5rem)] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-gray-50 p-[clamp(1.25rem,4vw,2rem)]">
                            <div className="flex flex-col gap-4">
                                {/* Zone Item Red */}
                                <div className="flex items-center gap-[clamp(0.75rem,3vw,1rem)] p-[clamp(0.75rem,3vw,1rem)] rounded-2xl bg-red-50/80 border border-red-100">
                                    <div className="w-[clamp(2.5rem,8vw,3rem)] h-[clamp(2.5rem,8vw,3rem)] shrink-0 rounded-xl bg-red-500 flex items-center justify-center text-white font-black text-sm">КР</div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-red-900 text-[clamp(0.9rem,2.5vw,1rem)] truncate">Красная зона (Санузлы)</h4>
                                        <p className="text-xs text-red-700 font-medium">45 м²</p>
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <div className="font-bold text-red-900">12 ед.</div>
                                    </div>
                                </div>

                                {/* Zone Item Blue */}
                                <div className="flex items-center gap-[clamp(0.75rem,3vw,1rem)] p-[clamp(0.75rem,3vw,1rem)] rounded-2xl bg-blue-50/80 border border-blue-100">
                                    <div className="w-[clamp(2.5rem,8vw,3rem)] h-[clamp(2.5rem,8vw,3rem)] shrink-0 rounded-xl bg-blue-500 flex items-center justify-center text-white font-black text-sm">СН</div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-blue-900 text-[clamp(0.9rem,2.5vw,1rem)] truncate">Синяя зона (Зал)</h4>
                                        <p className="text-xs text-blue-700 font-medium">120 м²</p>
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <div className="font-bold text-blue-900">28 ед.</div>
                                    </div>
                                </div>

                                {/* Zone Item Yellow */}
                                <div className="flex items-center gap-[clamp(0.75rem,3vw,1rem)] p-[clamp(0.75rem,3vw,1rem)] rounded-2xl bg-yellow-50/80 border border-yellow-200">
                                    <div className="w-[clamp(2.5rem,8vw,3rem)] h-[clamp(2.5rem,8vw,3rem)] shrink-0 rounded-xl bg-yellow-400 flex items-center justify-center text-white font-black text-sm">ЖЛ</div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-yellow-900 text-[clamp(0.9rem,2.5vw,1rem)] truncate">Желтая зона (Кухня)</h4>
                                        <p className="text-xs text-yellow-700 font-medium">80 м²</p>
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <div className="font-bold text-yellow-900">15 ед.</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Static accent behind card */}
                        <div className="absolute top-8 left-8 w-full h-full bg-blue-600/5 rounded-[clamp(1.5rem,4vw,2.5rem)] -z-10 blur-xl" />
                    </div>
                </div>

                {/* Grid Section without Media Queries (auto-fit) */}
                <div className="mt-[clamp(4rem,12vh,8rem)] pt-12 border-t border-gray-100 grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-x-8 gap-y-12">
                    {[
                        { icon: <Layout className="w-6 h-6" />, title: 'Общая площадь', desc: 'Укажите размер помещения в м² для старта расчета' },
                        { icon: <Palette className="w-6 h-6" />, title: 'Зонирование', desc: 'Разделите объект на логические цветовые зоны' },
                        { icon: <Ruler className="w-6 h-6" />, title: 'Расчет', desc: 'Алгоритм определит точные нормы расхода' },
                        { icon: <PackageCheck className="w-6 h-6" />, title: 'Результат', desc: 'Готовая ведомость закупки инвентаря' }
                    ].map((step, idx) => (
                        <div key={idx} className="flex flex-col gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                {step.icon}
                            </div>
                            <div className="space-y-2">
                                <h3 className="font-bold text-lg text-gray-900">{step.title}</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            <footer className="w-full py-10 px-6 text-center text-gray-400 text-xs mt-auto border-t border-gray-50">
                &copy; 2025 HorecaClean Inventory. Все права защищены.
            </footer>
        </div>
    )
}
