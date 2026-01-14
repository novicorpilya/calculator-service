import React from 'react';
import { Printer, Copy } from 'lucide-react';
import { type Calculation, COMPANY_REQUISITES } from '../../dashboard.types';
import { toast } from 'sonner';

interface InvoiceViewProps {
    calculation: Calculation;
}

export const InvoiceView: React.FC<InvoiceViewProps> = ({ calculation }) => {
    const { results, id, organizationName, totalCost } = calculation;

    if (!results) return null;

    const invoiceDate = new Date().toLocaleDateString('ru-RU'); // In real app, this should be the date status changed to invoice
    const invoiceNumber = `И-${id.toString().slice(0, 8)}`;

    const handlePrint = () => {
        window.print();
    };

    const handleCopyRequisites = () => {
        const text = `
ИНН: ${COMPANY_REQUISITES.inn}
БИК: ${COMPANY_REQUISITES.bik}
Счет: ${COMPANY_REQUISITES.account}
Банк: ${COMPANY_REQUISITES.bank}
        `.trim();
        navigator.clipboard.writeText(text);
        toast.success('Реквизиты скопированы');
    };

    return (
        <div className="bg-white text-black p-8 md:p-12 rounded-xl shadow-sm border border-border-theme max-w-4xl mx-auto font-serif print:shadow-none print:border-none print:p-0">
            {/* Invoice Header */}
            <div className="flex justify-between items-start mb-12">
                <div>
                    <h1 className="text-3xl font-bold mb-2">СЧЕТ НА ОПЛАТУ</h1>
                    <p className="text-lg text-gray-600">
                        № {invoiceNumber} от {invoiceDate}
                    </p>
                </div>
                <div className="text-right text-sm">
                    <p className="font-bold text-lg mb-1">{COMPANY_REQUISITES.name}</p>
                    <p>{COMPANY_REQUISITES.address}</p>
                    <div
                        className="mt-2 text-gray-600 cursor-pointer hover:text-black group"
                        onClick={handleCopyRequisites}
                    >
                        <p>
                            ИНН {COMPANY_REQUISITES.inn} / КПП {COMPANY_REQUISITES.kpp}
                        </p>
                        <p className="group-hover:underline decoration-dashed">
                            Р/С {COMPANY_REQUISITES.account}{' '}
                            <Copy className="inline w-3 h-3 ml-1 opacity-0 group-hover:opacity-100" />
                        </p>
                        <p>{COMPANY_REQUISITES.bank}</p>
                        <p>БИК {COMPANY_REQUISITES.bik}</p>
                    </div>
                </div>
            </div>

            <hr className="border-gray-200 my-8" />

            {/* Client Info */}
            <div className="mb-12">
                <p className="text-sm text-gray-500 uppercase tracking-widest font-bold mb-2">
                    Плательщик
                </p>
                <h2 className="text-xl font-bold">{organizationName}</h2>
                <p className="text-gray-600">Оплата по договору оферты (Заказ #{id})</p>
            </div>

            {/* Table */}
            <div className="mb-8">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b-2 border-black">
                            <th className="py-3 text-left font-bold uppercase tracking-wider w-12">
                                #
                            </th>
                            <th className="py-3 text-left font-bold uppercase tracking-wider">
                                Наименование товара / Услуги
                            </th>
                            <th className="py-3 text-right font-bold uppercase tracking-wider w-24">
                                Кол-во
                            </th>
                            <th className="py-3 text-right font-bold uppercase tracking-wider w-32">
                                Цена
                            </th>
                            <th className="py-3 text-right font-bold uppercase tracking-wider w-32">
                                Сумма
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {results.summary.map((item, index) => (
                            <tr key={index}>
                                <td className="py-3 text-gray-500">{index + 1}</td>
                                <td className="py-3">
                                    <p className="font-medium">{item.inventory}</p>
                                    <p className="text-xs text-gray-500">
                                        {item.sku ? `Арт: ${item.sku}` : ''}
                                    </p>
                                </td>
                                <td className="py-3 text-right">{item.quantity} шт</td>
                                <td className="py-3 text-right">{item.price.toLocaleString()} ₽</td>
                                <td className="py-3 text-right font-bold">
                                    {item.total.toLocaleString()} ₽
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="border-t-2 border-black">
                        <tr>
                            <td
                                colSpan={4}
                                className="py-4 text-right font-bold uppercase tracking-widest"
                            >
                                Итого к оплате (без НДС):
                            </td>
                            <td className="py-4 text-right font-black text-xl whitespace-nowrap">
                                {totalCost?.toLocaleString()} ₽
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Summary Text */}
            <div className="bg-gray-50 p-6 rounded-lg mb-12">
                <p className="font-bold mb-1">
                    Всего наименований {results.summary.length}, на сумму{' '}
                    {totalCost?.toLocaleString()} ₽
                </p>
                <p className="text-gray-600 italic text-sm border-t border-gray-200 mt-2 pt-2">
                    Внимание! Оплата данного счета означает согласие с условиями поставки товара.
                    Уведомление об оплате обязательно, в противном случае не гарантируется наличие
                    товара на складе. Товар отпускается по факту прихода денег на р/с Поставщика.
                </p>
            </div>

            {/* Signature Mock */}
            <div className="flex justify-between items-end mt-16 pt-8 border-t border-gray-100">
                <div>
                    <p className="font-bold text-sm mb-8">Руководитель</p>
                    <div className="w-48 border-b border-black relative">
                        <span className="absolute -top-6 left-4 text-blue-600 font-script text-2xl opacity-60 rotate-[-5deg]">
                            Novikov I.
                        </span>
                        <div className="absolute -top-12 -right-4 w-24 h-24 border-4 border-blue-600 rounded-full opacity-30 mix-blend-multiply flex items-center justify-center">
                            <span className="text-[8px] uppercase font-bold text-center text-blue-800 leading-tight">
                                ООО Новикорп
                                <br />
                                Для
                                <br />
                                Документов
                            </span>
                        </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Новиков И.А.</p>
                </div>
                <div>
                    <p className="font-bold text-sm mb-8">Бухгалтер</p>
                    <div className="w-48 border-b border-black"></div>
                    <p className="text-xs text-gray-400 mt-1">Иванова М.П.</p>
                </div>
            </div>

            {/* Download/Print Actions (Screen Only) */}
            <div className="mt-8 flex justify-end gap-3 print:hidden">
                <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                    <Printer size={16} />
                    Распечатать / PDF
                </button>
            </div>
        </div>
    );
};
