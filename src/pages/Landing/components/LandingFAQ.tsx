import React, { memo, useState } from 'react';
import { HelpCircle, ChevronDown } from 'lucide-react';

interface FAQItemProps {
    question: string;
    answer: string;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div 
            className="group border border-border-theme rounded-2xl bg-card transition-all duration-300 hover:border-primary/50"
            onClick={() => setIsOpen(!isOpen)}
        >
            <button 
                className="w-full text-left px-6 py-4 flex items-center justify-between gap-4"
                aria-expanded={isOpen}
            >
                <h3 className="text-sm md:text-base font-bold text-foreground group-hover:text-primary transition-colors">
                    {question}
                </h3>
                <div className={`
                    w-8 h-8 rounded-full bg-muted flex items-center justify-center transition-all duration-300
                    ${isOpen ? 'bg-primary text-white rotate-180' : 'text-muted-foreground'}
                `}>
                    <ChevronDown size={18} />
                </div>
            </button>
            <div 
                className={`
                    overflow-hidden transition-all duration-300 ease-in-out px-6
                    ${isOpen ? 'max-h-96 pb-6 opacity-100' : 'max-h-0 opacity-0'}
                `}
            >
                <p className="text-sm text-muted-foreground leading-relaxed">
                    {answer}
                </p>
            </div>
        </div>
    );
};

export const LandingFAQ: React.FC = memo(() => {
    const faqs = [
        {
            question: "Как работает калькулятор клининга?",
            answer: "Наш калькулятор использует алгоритмы, учитывающие площадь объекта, тип покрытия, количество сотрудников, посетителей и специфические зоны (кухни, санузлы) для точного расчета необходимых ресурсов и стоимости."
        },
        {
            question: "Можно ли адаптировать систему под наши нормативы?",
            answer: "Да, система позволяет гибко настраивать нормативы уборки, производительность персонала и стоимость расходных материалов под стандарты вашей компании."
        },
        {
            question: "Есть ли интеграция с ERP системами?",
            answer: "Мы предоставляем API для интеграции с популярными ERP и CRM системами. Свяжитесь с нами для обсуждения деталей конкретной интеграции."
        },
        {
            question: "Как начать пользоваться сервисом?",
            answer: "Нажмите кнопку 'Старт' или 'Начать расчет', зарегистрируйтесь в системе и вы получите доступ к базовому функционалу. Для расширенных возможностей свяжитесь с отделом продаж."
        },
        {
            question: "Предоставляете ли вы обучение персонала?",
            answer: "Мы предоставляем подробную документацию и видео-инструкции. Для корпоративных клиентов возможно проведение онлайн-вебинаров по работе с платформой."
        }
    ];

    return (
        <section id="faq" className="py-24 relative overflow-hidden">
             {/* Decorative Elements */}
            <div className="absolute top-1/4 left-0 w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full pointer-events-none -z-10" />
            
            <div className="fluid-container relative z-10">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-16 space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest mb-4">
                            <HelpCircle size={14} />
                            <span>FAQ</span>
                        </div>
                        <h2 className="text-3xl md:text-5xl font-[1000] tracking-tight uppercase">
                            Частые <span className="text-primary">вопросы</span>
                        </h2>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            Здесь мы собрали ответы на самые популярные вопросы о нашем сервисе и возможностях платформы.
                        </p>
                    </div>

                    <div className="space-y-4">
                        {faqs.map((faq, index) => (
                            <FAQItem key={index} question={faq.question} answer={faq.answer} />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
});
