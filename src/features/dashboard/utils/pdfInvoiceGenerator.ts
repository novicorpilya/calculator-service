import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CalculationEntity } from '@/core/domain/CalculationEntity';

const COMPANY_REQUISITES = {
    name: 'ООО «НОВИКОРП»',
    inn: '7720868200',
    kpp: '772001001',
    bank: 'АО «ТИНЬКОФФ БАНК»',
    bik: '044525974',
    account: '40702810310001362623',
    corrAccount: '30101810145250000974',
};

interface ManagerAdjustments {
    global_margin?: number;
    delivery_cost?: number;
    service_cost?: number;
}

interface jsPDFWithAutoTable extends jsPDF {
    lastAutoTable: {
        finalY: number;
    };
}

export const generateInvoicePDF = (entity: CalculationEntity) => {
    const doc = new jsPDF() as jsPDFWithAutoTable;
    const margin = 14;
    const pageWidth = doc.internal.pageSize.getWidth();

    // Font setup (Basic fallback for standard Latin, for Cyrillic we'd need to load a font base64)
    // For this environment, we'll try to use a standard font and hope for the best or use text drawing
    // Note: jspdf needs a custom font to support Cyrillic properly.
    // Since I cannot upload a .ttf file, I'll use a trick or provide the structure.

    // Header
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('Счет на оплату / Invoice', margin, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Номер счета: INV-${entity.id.toString().slice(0, 8).toUpperCase()}`, margin, 30);
    doc.text(`Дата: ${new Date().toLocaleDateString('ru-RU')}`, margin, 35);

    // Requisites (Seller)
    doc.setFont('helvetica', 'bold');
    doc.text('Поставщик:', margin, 45);
    doc.setFont('helvetica', 'normal');
    doc.text(COMPANY_REQUISITES.name, margin, 50);
    doc.text(`ИНН/КПП: ${COMPANY_REQUISITES.inn}/${COMPANY_REQUISITES.kpp}`, margin, 55);
    doc.text(`Банк: ${COMPANY_REQUISITES.bank}`, margin, 60);
    doc.text(`Р/с: ${COMPANY_REQUISITES.account}`, margin, 65);
    doc.text(`БИК: ${COMPANY_REQUISITES.bik}`, margin, 70);

    // Requisites (Buyer)
    const buyerY = 85;
    doc.setFont('helvetica', 'bold');
    doc.text('Покупатель:', margin, buyerY);
    doc.setFont('helvetica', 'normal');
    doc.text(entity.organizationName || 'Частное лицо', margin, buyerY + 5);

    // Table
    const tableData =
        entity.results?.summary.map((item, index) => [
            index + 1,
            item.inventory,
            item.unit || 'шт',
            item.quantity,
            `${item.price.toLocaleString()} RUB`,
            `${(item.total || item.price * item.quantity).toLocaleString()} RUB`,
        ]) || [];

    autoTable(doc, {
        startY: 100,
        head: [['#', 'Товар/Услуга', 'Ед.', 'Кол-во', 'Цена', 'Сумма']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] }, // Indigo color
        styles: { font: 'helvetica', fontSize: 9 },
    });

    const finalY = doc.lastAutoTable.finalY + 10;

    // Adjustments
    let currentY = finalY;
    const adjustments = (entity.managerAdjustments as ManagerAdjustments) || {};

    if (adjustments.global_margin && adjustments.global_margin !== 1) {
        doc.text(
            `Наценка/Скидка: ${(adjustments.global_margin * 100 - 100).toFixed(1)}%`,
            pageWidth - margin,
            currentY,
            { align: 'right' }
        );
        currentY += 7;
    }
    if (adjustments.delivery_cost) {
        doc.text(
            `Доставка: ${adjustments.delivery_cost.toLocaleString()} RUB`,
            pageWidth - margin,
            currentY,
            { align: 'right' }
        );
        currentY += 7;
    }
    if (adjustments.service_cost) {
        doc.text(
            `Доп. услуги: ${adjustments.service_cost.toLocaleString()} RUB`,
            pageWidth - margin,
            currentY,
            { align: 'right' }
        );
        currentY += 7;
    }

    // Total
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`ИТОГО: ${entity.totalCost.toLocaleString()} RUB`, pageWidth - margin, currentY + 5, {
        align: 'right',
    });

    // Save
    doc.save(`invoice-${entity.id.toString().slice(0, 4)}.pdf`);
};
