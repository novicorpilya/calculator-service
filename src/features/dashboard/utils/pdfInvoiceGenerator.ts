import type { jsPDF } from 'jspdf';
import { CalculationEntity } from '@/core/domain/CalculationEntity';

const COMPANY_REQUISITES = {
    name: 'ООО «Бамбалейла»',
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
    autoTable: (options: Record<string, unknown>) => jsPDF;
    lastAutoTable: {
        finalY: number;
    };
}

export const generateInvoicePDF = async (entity: CalculationEntity) => {
    // Dynamic import to reduce bundle size
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF() as unknown as jsPDFWithAutoTable;
    const margin = 14;
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('Invoice / Account', margin, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice No: INV-${entity.id.toString().slice(0, 8).toUpperCase()}`, margin, 30);
    doc.text(`Date: ${new Date().toLocaleDateString('ru-RU')}`, margin, 35);

    // Requisites (Seller)
    doc.setFont('helvetica', 'bold');
    doc.text('Seller:', margin, 45);
    doc.setFont('helvetica', 'normal');
    doc.text(COMPANY_REQUISITES.name, margin, 50);
    doc.text(`INN/KPP: ${COMPANY_REQUISITES.inn}/${COMPANY_REQUISITES.kpp}`, margin, 55);
    doc.text(`Bank: ${COMPANY_REQUISITES.bank}`, margin, 60);
    doc.text(`Acc: ${COMPANY_REQUISITES.account}`, margin, 65);
    doc.text(`BIK: ${COMPANY_REQUISITES.bik}`, margin, 70);

    // Requisites (Buyer)
    const buyerY = 85;
    doc.setFont('helvetica', 'bold');
    doc.text('Buyer:', margin, buyerY);
    doc.setFont('helvetica', 'normal');
    doc.text(entity.organizationName || 'Private Person', margin, buyerY + 5);

    // Table
    const tableData =
        entity.results?.summary.map((item, index) => [
            index + 1,
            item.inventory,
            item.unit || 'pcs',
            item.quantity,
            `${item.price.toLocaleString()} RUB`,
            `${(item.total || item.price * item.quantity).toLocaleString()} RUB`,
        ]) || [];

    autoTable(doc, {
        startY: 100,
        head: [['#', 'Item/Service', 'Unit', 'Qty', 'Price', 'Total']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] }, // Indigo color
        styles: { font: 'helvetica', fontSize: 9 },
    });

    const finalY = (doc as unknown as jsPDFWithAutoTable).lastAutoTable.finalY + 10;

    // Adjustments
    let currentY = finalY;
    const adjustments = (entity.managerAdjustments as ManagerAdjustments) || {};

    if (adjustments.global_margin && adjustments.global_margin !== 1) {
        doc.text(
            `Adjustment: ${(adjustments.global_margin * 100 - 100).toFixed(1)}%`,
            pageWidth - margin,
            currentY,
            { align: 'right' }
        );
        currentY += 7;
    }
    if (adjustments.delivery_cost) {
        doc.text(
            `Delivery: ${adjustments.delivery_cost.toLocaleString()} RUB`,
            pageWidth - margin,
            currentY,
            { align: 'right' }
        );
        currentY += 7;
    }
    if (adjustments.service_cost) {
        doc.text(
            `Additional: ${adjustments.service_cost.toLocaleString()} RUB`,
            pageWidth - margin,
            currentY,
            { align: 'right' }
        );
        currentY += 7;
    }

    // Total
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL: ${entity.totalCost.toLocaleString()} RUB`, pageWidth - margin, currentY + 5, {
        align: 'right',
    });

    // Save
    doc.save(`invoice-${entity.id.toString().slice(0, 4)}.pdf`);
};
