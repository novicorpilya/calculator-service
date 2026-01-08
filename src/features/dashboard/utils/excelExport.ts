import { CalculationEntity } from '@/core/domain/CalculationEntity';
import { COMPANY_REQUISITES } from '../dashboard.types';

/**
 * Export calculation to Excel file.
 * Uses dynamic import to load xlsx (~350KB) only when actually needed.
 * 
 * @param calc - CalculationEntity to export
 * @param showPrices - Optional. If provided, controls price visibility explicitly.
 *                     If not provided, defaults to showing prices for financial stages.
 */
export const exportToExcel = async (calc: CalculationEntity, showPrices?: boolean) => {
    if (!calc.results) return;

    // Dynamic import — xlsx loads only when user clicks "Export"
    const XLSX = await import('xlsx');

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

    // Determine if prices should be shown
    // If explicitly provided, use that; otherwise default to financial stages
    const isFinancialStage = ['invoice', 'paid', 'shipping', 'completed', 'closed'].includes(calc.status);
    const shouldShowPrices = showPrices !== undefined ? showPrices : isFinancialStage;

    calc.byZone.forEach(zone => {
        zoneData.push([zone.zoneName.toUpperCase(), '', '', '']);

        if (shouldShowPrices) {
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

    if (shouldShowPrices) {
        zoneData.push(['', '', 'ИТОГО К ОПЛАТЕ:', `${calc.totalCost.toLocaleString()} ₽`]);
    }

    const ws1 = XLSX.utils.aoa_to_sheet(zoneData);

    // Basic styling/width
    ws1['!cols'] = [{ wch: 40 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];

    XLSX.utils.book_append_sheet(wb, ws1, calc.status === 'invoice' ? 'Счёт' : 'Спецификация');
    XLSX.writeFile(wb, `${calc.status === 'invoice' ? 'Счет' : 'Расчет'}_${calc.organizationName}.xlsx`);
};
