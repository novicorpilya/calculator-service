import * as XLSX from 'xlsx';
import { CalculationEntity } from '@/core/domain/CalculationEntity';
import { COMPANY_REQUISITES } from '../dashboard.types';

export const exportToExcel = (calc: CalculationEntity) => {
    if (!calc.results) return;
    const wb = XLSX.utils.book_new();
    const zoneData: (string | number)[][] = [];

    // Add Header/Requisites if it's an invoice stage
    if (calc.status === 'invoice') {
        zoneData.push(['СЧЕТ НА ОПЛАТУ', '', '', '']);
        zoneData.push(['Поставщик:', COMPANY_REQUISITES.name, '', '']);
        zoneData.push(['ИНН/КПП:', `${COMPANY_REQUISITES.inn}/${COMPANY_REQUISITES.kpp}`, '', '']);
        zoneData.push(['Банк:', COMPANY_REQUISITES.bank, '', '']);
        zoneData.push(['БИК:', COMPANY_REQUISITES.bik, '', '']);
        zoneData.push(['Р/С:', COMPANY_REQUISITES.account, '', '']);
        zoneData.push(['К/С:', COMPANY_REQUISITES.corrAccount, '', '']);
        zoneData.push(['', '', '', '']);
        zoneData.push(['Заказчик:', calc.organizationName, '', '']);
        zoneData.push(['', '', '', '']);
    }

    // Determine if prices should be shown (Logic reused from component context if needed, but here dependent on entity)
    // We can assume if status 'invoice' or similar, we show prices.
    // However, the original code had role checks. 
    // To make this pure, we might need roles passed in, OR we assume financial stages show prices.

    // For simplicity, let's keep the logic close to what was there, but maybe simplified:
    // "Financial Stage" definition locally
    const isFinancialStage = ['invoice', 'paid', 'shipping', 'completed', 'closed'].includes(calc.status);

    calc.byZone.forEach(zone => {
        zoneData.push([zone.zoneName.toUpperCase(), '', '', '']);
        // NOTE: The original code depended on `user.role` to hide prices in draft. 
        // We will show prices if it's financial stage OR we are exporting (assuming manager exports).
        // If client exports draft, they shouldn't see prices.
        // We will accept `showPrices` as an argument to be precise.

        // Dynamic Header
        const showPrices = isFinancialStage; // Defaulting for safe export function

        if (showPrices) {
            zoneData.push(['Инвентарь', 'Количество', 'Цена', 'Сумма']);
            zone.items.forEach(item => {
                zoneData.push([item.inventory, `${item.quantity} шт`, `${item.price}₽`, `${item.total * item.price}₽`]);
            });
        } else {
            zoneData.push(['Инвентарь', 'Количество', 'Маркировка']);
            zone.items.forEach(item => {
                zoneData.push([item.inventory, `${item.quantity} шт`, item.color]);
            });
        }
        zoneData.push(['', '', '', '']);
    });

    if (isFinancialStage) {
        zoneData.push(['', '', 'ИТОГО К ОПЛАТЕ:', `${calc.totalCost.toLocaleString()} ₽`]);
    }

    const ws1 = XLSX.utils.aoa_to_sheet(zoneData);

    // Basic styling/width
    ws1['!cols'] = [{ wch: 40 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];

    XLSX.utils.book_append_sheet(wb, ws1, calc.status === 'invoice' ? 'Счёт' : 'Спецификация');
    XLSX.writeFile(wb, `${calc.status === 'invoice' ? 'Счет' : 'Расчет'}_${calc.organizationName}.xlsx`);
};

export const exportToExcelWithPermissions = (calc: CalculationEntity, showPrices: boolean) => {
    if (!calc.results) return;
    const wb = XLSX.utils.book_new();
    const zoneData: (string | number)[][] = [];

    if (calc.status === 'invoice') {
        zoneData.push(['СЧЕТ НА ОПЛАТУ', '', '', '']);
        zoneData.push(['Поставщик:', COMPANY_REQUISITES.name, '', '']);
        zoneData.push(['ИНН/КПП:', `${COMPANY_REQUISITES.inn}/${COMPANY_REQUISITES.kpp}`, '', '']);
        zoneData.push(['Банк:', COMPANY_REQUISITES.bank, '', '']);
        zoneData.push(['БИК:', COMPANY_REQUISITES.bik, '', '']);
        zoneData.push(['Р/С:', COMPANY_REQUISITES.account, '', '']);
        zoneData.push(['К/С:', COMPANY_REQUISITES.corrAccount, '', '']);
        zoneData.push(['', '', '', '']);
        zoneData.push(['Заказчик:', calc.organizationName, '', '']);
        zoneData.push(['', '', '', '']);
    }

    calc.byZone.forEach(zone => {
        zoneData.push([zone.zoneName.toUpperCase(), '', '', '']);

        if (showPrices) {
            zoneData.push(['Инвентарь', 'Количество', 'Цена', 'Сумма']);
            zone.items.forEach(item => {
                zoneData.push([item.inventory, `${item.quantity} шт`, `${item.price}₽`, `${item.total * item.price}₽`]);
            });
        } else {
            zoneData.push(['Инвентарь', 'Количество', 'Маркировка']);
            zone.items.forEach(item => {
                zoneData.push([item.inventory, `${item.quantity} шт`, item.color]);
            });
        }
        zoneData.push(['', '', '', '']);
    });

    if (showPrices) {
        zoneData.push(['', '', 'ИТОГО К ОПЛАТЕ:', `${calc.totalCost.toLocaleString()} ₽`]);
    }

    const ws1 = XLSX.utils.aoa_to_sheet(zoneData);
    ws1['!cols'] = [{ wch: 40 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];

    XLSX.utils.book_append_sheet(wb, ws1, calc.status === 'invoice' ? 'Счёт' : 'Спецификация');
    XLSX.writeFile(wb, `${calc.status === 'invoice' ? 'Счет' : 'Расчет'}_${calc.organizationName}.xlsx`);
}
