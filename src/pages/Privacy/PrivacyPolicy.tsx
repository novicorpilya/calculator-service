import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const PrivacyPolicy: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background text-foreground py-24 px-6 sm:px-12">
            <div className="max-w-4xl mx-auto space-y-12">
                <button 
                    onClick={() => navigate('/')} 
                    className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-foreground/50 hover:text-primary transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Назад
                </button>

                <div className="space-y-6">
                    <h1 className="text-4xl font-[1000] italic tracking-tight uppercase">
                        Политика конфиденциальности
                    </h1>
                </div>

                <div className="prose prose-invert max-w-none space-y-12">
                    <section className="space-y-4">
                        <h2 className="text-xl font-black uppercase tracking-widest text-foreground">1. Общие положения</h2>
                        <p className="text-foreground/70 leading-relaxed">
                            Настоящим, заполняя любую форму на сайте hics-service.vercel.app (далее — «Сайт») и нажимая кнопку "Отправить"/"Оставить заявку" либо продолжая использование Сайта, вы свободно, своей волей и в своих интересах подтверждаете, что ознакомились с настоящим Согласием и разрешаете ООО «ХИКС» (ИНН 0000000000, ОГРН 0000000000000, e-mail: privacy@hics-service.vercel.app, далее — «Оператор») обрабатывать ваши персональные данные на условиях, изложенных ниже.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-black uppercase tracking-widest text-foreground">2. Цели обработки</h2>
                        <ul className="list-disc pl-6 space-y-2 text-foreground/70 marker:text-primary">
                            <li>Идентификация пользователя на Сайте и в мобильных приложениях.</li>
                            <li>Оформление и сопровождение заказов.</li>
                            <li>Информирование об акциях, новостях и специальных предложениях (e-mail, SMS, push-уведомления).</li>
                            <li>Улучшение качества сервисов, проведение статистических и маркетинговых исследований.</li>
                            <li>Выполнение требований законодательства РФ (бухучёт, налоговая отчётность и др.).</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-black uppercase tracking-widest text-foreground">3. Категории персональных данных</h2>
                        <ul className="list-disc pl-6 space-y-2 text-foreground/70 marker:text-primary">
                            <li><strong>Идентификационные:</strong> Фамилия, имя, отчество; дата рождения (при необходимости).</li>
                            <li><strong>Контактные:</strong> Номер телефона, e-mail, почтовый адрес.</li>
                            <li><strong>Данные учётной записи:</strong> Логин, хэш пароля, история авторизаций, IP-адрес, cookie-файлы.</li>
                            <li><strong>Платежные:</strong> Реквизиты платежа, сумма и дата операций (обрабатываются через платёжного агрегатора).</li>
                            <li><strong>Транзакционные:</strong> Список товаров/услуг, история заказов, комментарии к заказам.</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-black uppercase tracking-widest text-foreground">4. Правовые основания</h2>
                        <p className="text-foreground/70">Обработка осуществляется в соответствии с:</p>
                        <ul className="list-disc pl-6 space-y-2 text-foreground/70 marker:text-primary">
                            <li>Федеральным законом РФ от 27.07.2006 № 152-ФЗ «О персональных данных»;</li>
                            <li>Федеральным законом РФ от 07.02.1992 № 2300-1 «О защите прав потребителей»;</li>
                            <li>Настоящим Согласием (оферта).</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-black uppercase tracking-widest text-foreground">5. Способы обработки и срок хранения</h2>
                        <p className="text-foreground/70 leading-relaxed">
                            Смешанная (автоматизированная и неавтоматизированная) обработка с использованием баз данных на территории РФ.
                            Срок хранения — до достижения целей обработки или до момента отзыва Согласия, если иное не требуется законодательством (данные о заказах — 5 лет, бухгалтерские документы — 5 лет и т.д.)
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-black uppercase tracking-widest text-foreground">6. Передача третьим лицам</h2>
                        <p className="text-foreground/70 leading-relaxed">
                            Персональные данные могут быть переданы исключительно для целей, указанных в разделе 2, следующим категориям получателей:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-foreground/70 marker:text-primary">
                            <li>Курьерские и почтовые службы (доставка).</li>
                            <li>Платёжные агрегаторы (приём онлайн-платежей).</li>
                            <li>Внешние сервисы технической поддержки, CRM, облачные хостинги, расположенные на территории РФ.</li>
                            <li>Уполномоченные госорганы — по их запросу на основании закона.</li>
                        </ul>
                        <p className="text-foreground/70 leading-relaxed">
                            Передача данных в иные страны или третьим лицам без вашей отдельной воли не осуществляется.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-black uppercase tracking-widest text-foreground">7. Права субъекта персональных данных</h2>
                        <p className="text-foreground/70 leading-relaxed">
                            Вы вправе:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-foreground/70 marker:text-primary">
                            <li>Получать информацию о факте, целях, источнике, способах обработки ваших данных;</li>
                            <li>Требовать уточнения, блокировки или уничтожения недостоверных либо незаконно обработанных данных;</li>
                            <li>Отозвать настоящее Согласие в любой момент, направив запрос на e-mail privacy@hics-service.vercel.app;</li>
                            <li>Обжаловать действия/бездействие Оператора в Роскомнадзор или в судебном порядке.</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-black uppercase tracking-widest text-foreground">8. Отзыв Согласия</h2>
                        <p className="text-foreground/70 leading-relaxed">
                            Отзыв не влияет на законность обработки, осуществлённой до момента получения Оператором письменного уведомления. После получения отзыва ваш аккаунт может быть ограничен или удалён в зависимости от минимально необходимого состава данных для выполнения обязательств перед вами и норм законодательства.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className="text-xl font-black uppercase tracking-widest text-foreground">9. Контактная информация Оператора</h2>
                        <div className="bg-card p-6 rounded-2xl border border-border-theme space-y-2">
                            <p className="font-bold text-lg">ООО «ХИКС»</p>
                            <p className="text-foreground/60">123456, г. Москва, ул. Технологическая, д. 10</p>
                            <p className="text-foreground/60">Тел.: +7 999 000-00-00</p>
                            <p className="text-foreground/60">E-mail: privacy@hics-service.vercel.app</p>
                        </div>
                    </section>

                    <p className="text-sm text-foreground/40 italic pt-8 border-t border-border-theme">
                        Продолжая работу на сайте hics-service.vercel.app, вы подтверждаете своё согласие с указанными условиями обработки персональных данных.
                    </p>
                </div>
            </div>
        </div>
    );
};
