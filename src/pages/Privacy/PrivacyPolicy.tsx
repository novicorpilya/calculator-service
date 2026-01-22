import React, { useEffect } from 'react';
import { ArrowLeft, ShieldCheck, Lock, Eye, FileText, Scale } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const PrivacyPolicy: React.FC = () => {
    const navigate = useNavigate();

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 overflow-x-hidden">
            {/* Immersive Background Decorations */}
            <div className="fixed inset-0 pointer-events-none -z-10">
                <div className="absolute top-[-10%] right-[-10%] w-[300px] sm:w-[800px] h-[300px] sm:h-[800px] bg-primary/5 blur-[120px] rounded-full animate-pulse duration-[10000ms]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[250px] sm:w-[600px] h-[250px] sm:h-[600px] bg-indigo-500/5 blur-[120px] rounded-full animate-pulse duration-[8000ms]" />
            </div>

            <main className="fluid-container py-20 sm:py-32">
                <div className="max-w-4xl mx-auto space-y-16">
                    {/* Header Section */}
                    <div className="space-y-8 animate-in fade-in slide-in-from-top-8 duration-1000">
                        <button
                            onClick={() => navigate('/')}
                            className="group flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-foreground/40 hover:text-primary transition-all duration-300"
                        >
                            <div className="w-8 h-8 rounded-full bg-foreground/5 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                                <ArrowLeft className="w-4 h-4" />
                            </div>
                            На главную
                        </button>

                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary">
                                <ShieldCheck className="w-4 h-4" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-nowrap">
                                    Безопасность данных
                                </span>
                            </div>
                            <h1 className="text-[clamp(2rem,10vw,5.5rem)] font-[1000] italic leading-[1] tracking-tighter uppercase break-words">
                                Политика <br />
                                <span className="text-primary not-italic block sm:inline break-all sm:break-normal">
                                    конфиденциальности
                                </span>
                            </h1>
                            <p className="text-fluid-lg text-foreground/50 font-medium max-w-2xl">
                                Мы ценим ваше доверие и обеспечиваем абсолютную прозрачность в
                                вопросах обработки персональных данных в экосистеме HICS.
                            </p>
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="glass-card !p-8 sm:!p-16 space-y-20 relative overflow-hidden animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
                        {/* Interactive Background Grid for Card */}
                        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:40px_40px] opacity-[0.15] -z-10" />

                        <section className="space-y-8">
                            <div className="flex items-start gap-6">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                                    <FileText className="w-6 h-6 text-primary" />
                                </div>
                                <div className="space-y-4">
                                    <h2 className="text-2xl font-[1000] italic tracking-tight uppercase">
                                        1. Общие положения
                                    </h2>
                                    <p className="text-foreground/60 leading-relaxed font-medium">
                                        Настоящим, заполняя любую форму на сайте
                                        hics-service.vercel.app и нажимая кнопку "Отправить" либо
                                        продолжая использование Сайта, вы подтверждаете согласие на
                                        обработку данных ООО «ХИКС» (ИНН 0000000000). Мы строго
                                        следуем принципам минимизации данных и их защиты от
                                        несанкционированного доступа.
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section className="space-y-8">
                            <div className="flex items-start gap-6">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                                    <Eye className="w-6 h-6 text-indigo-500" />
                                </div>
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-[1000] italic tracking-tight uppercase">
                                        2. Цели и категории данных
                                    </h2>
                                    <p className="text-foreground/60 leading-relaxed font-medium">
                                        Мы собираем только те данные, которые критически необходимы
                                        для функционирования интеллектуального калькулятора и связи
                                        с экспертами.
                                    </p>
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        {[
                                            {
                                                title: 'Идентификация',
                                                desc: 'ФИО, логин и IP-адрес для защиты аккаунта',
                                            },
                                            {
                                                title: 'Коммуникация',
                                                desc: 'E-mail и телефон для отправки расчетов',
                                            },
                                            {
                                                title: 'Транзакции',
                                                desc: 'История смет и спецификаций объектов',
                                            },
                                            {
                                                title: 'Аналитика',
                                                desc: 'Cookie для оптимизации UX платформы',
                                            },
                                        ].map((item, i) => (
                                            <div
                                                key={i}
                                                className="p-5 rounded-2xl bg-foreground/[0.03] border border-border-theme hover:border-primary/30 transition-colors group"
                                            >
                                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-2">
                                                    {item.title}
                                                </h4>
                                                <p className="text-[11px] font-bold text-foreground/40 leading-snug">
                                                    {item.desc}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="space-y-8">
                            <div className="flex items-start gap-6">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                                    <Lock className="w-6 h-6 text-emerald-500" />
                                </div>
                                <div className="space-y-4">
                                    <h2 className="text-2xl font-[1000] italic tracking-tight uppercase">
                                        3. Безопасность и хранение
                                    </h2>
                                    <p className="text-foreground/60 leading-relaxed font-medium">
                                        Данные хранятся на защищенных серверах на территории РФ с
                                        использованием алгоритмов шифрования AES-256. Передача
                                        данных третьим лицам возможна только для обеспечения
                                        логистики (доставка инвентаря) или по требованию
                                        законодательства.
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section className="space-y-8">
                            <div className="flex items-start gap-6">
                                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center shrink-0">
                                    <Scale className="w-6 h-6 text-orange-500" />
                                </div>
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-[1000] italic tracking-tight uppercase">
                                        4. Ваши права
                                    </h2>
                                    <p className="text-foreground/60 leading-relaxed font-medium">
                                        Вы сохраняете полный контроль над своими персональными
                                        данными в любое время.
                                    </p>
                                    <ul className="space-y-4">
                                        {[
                                            'Право на отзыв согласия и удаление аккаунта',
                                            'Право на получение выписки по хранимым данным',
                                            'Право на корректировку устаревшей информации',
                                            'Защита прав в судебном порядке',
                                        ].map((item, i) => (
                                            <li
                                                key={i}
                                                className="flex items-center gap-4 text-[11px] font-black uppercase tracking-widest text-foreground/30"
                                            >
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </section>

                        <section className="pt-12 border-t border-border-theme">
                            <div className="flex flex-col sm:flex-row gap-8 justify-between items-start sm:items-center">
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-foreground/20">
                                        Контактная почта
                                    </p>
                                    <a
                                        href="mailto:privacy@hics-service.vercel.app"
                                        className="text-2xl font-[1000] italic tracking-tight text-primary hover:scale-105 transition-transform block"
                                    >
                                        privacy@hics.pro
                                    </a>
                                </div>
                                <div className="text-right space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-foreground/20">
                                        Последнее обновление
                                    </p>
                                    <p className="text-sm font-bold opacity-60">22 января 2026</p>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Footer Badge */}
                    <div className="flex justify-center pt-8">
                        <div className="inline-flex items-center gap-4 px-8 py-4 rounded-2xl bg-foreground/5 border border-border-theme">
                            <ShieldCheck className="w-5 h-5 text-primary" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/40">
                                HICS — Trusted Ecosystem
                            </span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};
