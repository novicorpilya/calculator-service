import React, { memo, useState } from 'react';
import { HelpCircle, ChevronDown } from 'lucide-react';
import { AnimateOnScroll } from '@/components/common/AnimateOnScroll';

interface FAQItemProps {
    question: string;
    answer: string;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div
            className="group border border-border-theme rounded-2xl bg-card transition-[border-color,box-shadow] duration-300 hover:border-primary/50"
            onClick={() => setIsOpen(!isOpen)}
        >
            <button
                className="w-full text-left px-6 py-4 flex items-center justify-between gap-4"
                aria-expanded={isOpen}
            >
                <h3 className="text-sm md:text-base font-bold text-foreground group-hover:text-primary transition-colors">
                    {question}
                </h3>
                <div
                    className={`
                    w-8 h-8 rounded-full bg-muted flex items-center justify-center transition-[background-color,transform,color] duration-300
                    ${isOpen ? 'bg-primary text-white rotate-180' : 'text-muted-foreground'}
                `}
                >
                    <ChevronDown size={18} />
                </div>
            </button>
            <div
                className={`
                    overflow-hidden transition-all duration-300 ease-in-out px-6
                    ${isOpen ? 'max-h-96 pb-6 opacity-100' : 'max-h-0 opacity-0'}
                `}
            >
                <p className="text-sm text-muted-foreground leading-relaxed">{answer}</p>
            </div>
        </div>
    );
};

export const LandingFAQ: React.FC = memo(() => {
    const faqs = [
        {
            question: 'Как работает калькулятор оснащения ресторана?',
            answer: 'Калькулятор HICS использует динамические нормы, учитывающие тип заведения, количество посадочных мест, площадь кухни и интенсивность потока посетителей. Мы автоматически рассчитываем необходимое количество посуды, стекла, приборов и профессиональной химии согласно стандартам HACCP.',
        },
        {
            question: 'Можно ли адаптировать расчеты под наши стандарты?',
            answer: 'Да, система позволяет экспертам корректировать базовые формулы, учитывая специфику вашего бренда или региональные особенности, сохраняя при этом математическую точность сметы.',
        },
        {
            question: 'Как происходит интеграция с поставщиками?',
            answer: 'HICS формирует готовую спецификацию, которую можно отправить любому дилеру или использовать нашу нейросеть для подбора оптимальных аналогов из базы проверенных поставщиков HoReCa.',
        },
        {
            question: 'Как начать работу с проектом?',
            answer: "Нажмите кнопку 'Запустить расчет', выберите тип вашего объекта, и система мгновенно создаст защищенный личный кабинет с первым драфтом вашей сметы.",
        },
        {
            question: 'Есть ли мобильная версия для аудита?',
            answer: 'Да, наша платформа полностью адаптивна. Вы можете проводить инвентаризацию или проверять смету прямо со смартфона, находясь на объекте.',
        },
    ];

    return (
        <section id="faq" className="py-20 sm:py-24 relative overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-1/4 left-0 w-[40%] h-[40%] bg-primary/5 blur-[80px] sm:blur-[120px] rounded-full pointer-events-none -z-10" />

            <div className="fluid-container relative z-10">
                <div className="max-w-4xl mx-auto">
                    <AnimateOnScroll
                        variant="blur-in"
                        className="text-center mb-12 sm:mb-16 space-y-4 px-4 sm:px-0"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-2 sm:mb-4">
                            <HelpCircle size={14} />
                            <span>FAQ</span>
                        </div>
                        <h2 className="text-2xl sm:text-5xl font-[1000] tracking-tight uppercase italic leading-[1.1] sm:leading-none">
                            Частые <span className="text-primary not-italic">вопросы</span>
                        </h2>
                        <p className="text-sm sm:text-lg text-foreground/40 max-w-2xl mx-auto font-medium">
                            Здесь мы собрали ответы на самые популярные вопросы о нашем сервисе и
                            возможностях платформы.
                        </p>
                    </AnimateOnScroll>

                    <div className="space-y-3 sm:space-y-4 px-2 sm:px-0">
                        {faqs.map((faq, index) => (
                            <AnimateOnScroll key={index} variant="fade-up" delay={index * 80}>
                                <FAQItem question={faq.question} answer={faq.answer} />
                            </AnimateOnScroll>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
});
