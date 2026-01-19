import { CalculationEntity } from '@/core/domain/CalculationEntity';

const COMPANY_REQUISITES = {
    name: 'ООО «БАМБАЛЕЙЛА»',
    inn: '7720868200',
    kpp: '772001001',
    bank: 'АО «ТИНЬКОФФ БАНК»',
    bik: '044525974',
    account: '40702810310001362623',
};

const FONT_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf';

/**
 * Remove emojis and characters that break standard PDF encoding
 */
const cleanForPDF = (text: string = ''): string => {
    return text
        .toString()
        .replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '')
        .trim();
};

/**
 * Utility to load the Russian font
 */
interface JsPDFDocument {
    addFileToVFS(name: string, data: string): void;
    addFont(file: string, name: string, style: string): void;
    setFont(name: string, style?: string): void;
    setFontSize(size: number): void;
    setTextColor(...args: number[]): void;
    setDrawColor(...args: number[]): void;
    setLineWidth(width: number): void;
    text(text: string, x: number, y: number, options?: Record<string, unknown>): void;
    line(x1: number, y1: number, x2: number, y2: number): void;
    circle(x: number, y: number, r: number): void;
    save(filename: string): void;
    internal: { pageSize: { getWidth(): number } };
    lastAutoTable?: { finalY: number };
}

const loadCyrillicFont = async (doc: JsPDFDocument) => {
    try {
        const response = await fetch(FONT_URL);
        if (response.ok) {
            const fontBuffer = await response.arrayBuffer();
            const base64Font = btoa(new Uint8Array(fontBuffer).reduce((data, byte) => data + String.fromCharCode(byte), ''));
            doc.addFileToVFS('Roboto.ttf', base64Font);
            doc.addFont('Roboto.ttf', 'Roboto', 'normal');
            doc.setFont('Roboto');
            return true;
        }
    } catch (e) {
        console.warn('Font loading failed', e);
    }
    return false;
};

const numberToWordsRussian = (n: number): string => {
    const s = [
        ['', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'],
        ['десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать', 'пятнадцать', 'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать'],
        ['', '', 'двадцать', 'тридцать', 'сорок', 'пятьдесят', 'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто'],
        ['', 'сто', 'двести', 'триста', 'четыреста', 'пятьсот', 'шестьсот', 'семьсот', 'восемьсот', 'девятьсот']
    ];
    
    const p = [['', '', ''], ['тысяча', 'тысячи', 'тысяч'], ['миллион', 'миллиона', 'миллионов'], ['миллиард', 'миллиарда', 'миллиардов']];
    
    if (n === 0) return 'Ноль рублей 00 копеек';

    let res = '';
    const rub = Math.floor(n);
    const kop = Math.round((n - rub) * 100);
    
    const getWords = (num: number, idx: number) => {
        let w = '';
        const h = Math.floor(num / 100);
        const t = Math.floor((num % 100) / 10);
        const u = num % 10;
        
        if (h > 0) w += s[3][h] + ' ';
        if (t === 1) w += s[1][u] + ' ';
        else {
            if (t > 1) w += s[2][t] + ' ';
            if (u > 0) {
                if (idx === 1) { // Thousand special case
                    if (u === 1) w += 'одна ';
                    else if (u === 2) w += 'две ';
                    else w += s[0][u] + ' ';
                } else w += s[0][u] + ' ';
            }
        }
        
        let p_idx = 2; // Default plural (5+)
        if (t !== 1) {
            if (u === 1) p_idx = 0;
            else if (u >= 2 && u <= 4) p_idx = 1;
        }
        
        if (num > 0 || idx === 0) w += p[idx][p_idx] + ' ';
        return w;
    };

    const parts: number[] = [];
    let tempRub = rub;
    for (let i = 0; i < 4; i++) {
        parts.push(tempRub % 1000);
        tempRub = Math.floor(tempRub / 1000);
    }
    
    for (let i = 3; i >= 0; i--) {
        if (parts[i] > 0) res += getWords(parts[i], i);
        else if (i === 0 && rub === 0) res += 'ноль ';
    }
    
    // Ruble pluralization
    const last2 = rub % 100;
    const last1 = rub % 10;
    let r_text = 'рублей';
    if (Math.floor(last2 / 10) !== 1) {
        if (last1 === 1) r_text = 'рубль';
        else if (last1 >= 2 && last1 <= 4) r_text = 'рубля';
    }
    
    res = res.trim();
    res = res.charAt(0).toUpperCase() + res.slice(1);
    
    if (res === '') res = 'Ноль';
    
    return `${res} ${r_text} ${kop.toString().padStart(2, '0')} копеек`;
};

/**
 * Stable INVOICE Generator - Redesigned to match the classic Russian Standard
 */
export const generateInvoicePDF = async (entity: CalculationEntity, buyerInfo?: { organizationName?: string; inn?: string; address?: string }) => {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    try {
        const doc = new jsPDF() as unknown as JsPDFDocument;
        const hasRussian = await loadCyrillicFont(doc);
        const margin = 14;
        const pageWidth = doc.internal.pageSize.getWidth();
        const invoiceNo = entity.id.toString().slice(0, 8).toUpperCase();
        const dateStr = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });

        doc.setFont(hasRussian ? 'Roboto' : 'helvetica', 'normal');

        // 1. Attention header
        doc.setFontSize(8);
        doc.setTextColor(50);
        const headerNote = 'Внимание! Оплата данного счета означает согласие с условиями поставки товара. Уведомление об оплате обязательно, в противном случае не гарантируется наличие товара на складе. Товар отпускается по факту прихода денег на р/с Поставщика.';
        doc.text(headerNote, margin, 12, { maxWidth: pageWidth - margin * 2, align: 'justify' });

        // 2. Bank Requisites Table
        autoTable(doc, {
            startY: 20,
            body: [
                [
                    { content: COMPANY_REQUISITES.bank + ', г. Москва', rowSpan: 2, styles: { valign: 'top' } },
                    'БИК',
                    COMPANY_REQUISITES.bik
                ],
                ['Сч. №', COMPANY_REQUISITES.account],
                [
                    `ИНН ${COMPANY_REQUISITES.inn}`,
                    `КПП ${COMPANY_REQUISITES.kpp}`,
                    { content: 'Сч. №', rowSpan: 2, styles: { valign: 'top' } },
                    { content: COMPANY_REQUISITES.account, rowSpan: 2, styles: { valign: 'top' } }
                ],
                [{ content: COMPANY_REQUISITES.name, colSpan: 2 }, '']
            ],
            theme: 'grid',
            styles: { font: hasRussian ? 'Roboto' : 'helvetica', fontSize: 8, cellPadding: 2, fontStyle: 'normal' },
            tableWidth: pageWidth - margin * 2,
        });

        // 3. Invoice Title
        const finalY = (doc.lastAutoTable?.finalY || 0) + 10;
        doc.setFontSize(16);
        doc.setTextColor(0);
        doc.text(`Счет на оплату № ${invoiceNo} от ${dateStr}`, margin, finalY);
        doc.line(margin, finalY + 2, pageWidth - margin, finalY + 2);

        // 4. Seller & Buyer details
        doc.setFontSize(10);
        const sellerText = `${COMPANY_REQUISITES.name}, ИНН ${COMPANY_REQUISITES.inn}, КПП ${COMPANY_REQUISITES.kpp}, г. Москва`;
        
        // Priority: Passed buyerInfo > Entity Client Profile Data > Entity Basic Org Name
        const buyerName = buyerInfo?.organizationName || entity.clientOrganizationName || entity.organizationName || 'Клиент';
        const buyerINN = buyerInfo?.inn || entity.clientInn || '___________';
        const buyerAddr = buyerInfo?.address || entity.clientAddress || '___________';

        const buyerText = `${cleanForPDF(buyerName)}, ИНН ${buyerINN}, Юр. адрес: ${buyerAddr}`;

        doc.text('Поставщик:', margin, finalY + 10);
        doc.text(sellerText, margin + 25, finalY + 10, { maxWidth: pageWidth - margin - 30 });

        doc.text('Покупатель:', margin, finalY + 20);
        doc.text(buyerText, margin + 25, finalY + 20, { maxWidth: pageWidth - margin - 30 });

        // 5. Main Items Table
        const tableData = entity.results?.summary.map((item, index) => {
            const qty = Math.ceil(item.quantity || 0);
            const price = Math.round(item.price || 0);
            const total = item.calculation?.annualBudget || (qty * price);
            return [
                index + 1,
                cleanForPDF(item.inventory || 'Товар'),
                qty,
                item.unit || 'шт.',
                price.toLocaleString(),
                Math.round(total).toLocaleString()
            ];
        }) || [];

        autoTable(doc, {
            startY: finalY + 30,
            head: [['№', 'Наименование товара, работ, услуг', 'Коли-\nчество', 'Ед.\nизм.', 'Цена', 'Сумма']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], lineWidth: 0.1, fontStyle: 'normal' },
            styles: { font: hasRussian ? 'Roboto' : 'helvetica', fontSize: 8, cellPadding: 2, fontStyle: 'normal' },
            columnStyles: { 
                0: { cellWidth: 10 }, 
                2: { cellWidth: 15, halign: 'right' }, 
                3: { cellWidth: 12, halign: 'center' }, 
                4: { cellWidth: 20, halign: 'right' }, 
                5: { cellWidth: 25, halign: 'right' } 
            }
        });

        // 6. Totals section
        const totalY = (doc.lastAutoTable?.finalY || 0) + 5;
        const totalAmount = entity.totalCost;
        
        doc.setFontSize(10);
        doc.text('Итого:', pageWidth - margin - 50, totalY, { align: 'right' });
        doc.text(totalAmount.toLocaleString() + ',00', pageWidth - margin, totalY, { align: 'right' });

        doc.text('В том числе НДС (20%):', pageWidth - margin - 50, totalY + 5, { align: 'right' });
        doc.text(Math.round(totalAmount * (20/120)).toLocaleString() + ',00', pageWidth - margin, totalY + 5, { align: 'right' });

        doc.setFontSize(11);
        doc.text('Всего к оплате:', pageWidth - margin - 50, totalY + 12, { align: 'right' });
        doc.text(totalAmount.toLocaleString() + ',00', pageWidth - margin, totalY + 12, { align: 'right' });

        // 7. Summary text & Signature
        const summaryY = totalY + 25;
        doc.setFontSize(9);
        doc.text(`Всего наименований ${tableData.length}, на сумму ${totalAmount.toLocaleString()} руб.`, margin, summaryY);
        doc.setFontSize(10);
        doc.text(numberToWordsRussian(totalAmount), margin, summaryY + 5);
        doc.line(margin, summaryY + 8, pageWidth - margin, summaryY + 8);

        // Signatures Placeholder
        const sigY = summaryY + 20;
        doc.text('Руководитель ____________________ (Иванов А.А.)', margin, sigY);
        doc.text('Бухгалтер    ____________________ (Сидоров Б.Б.)', margin, sigY + 10);

        // "Stamp" Simulation - Bottom Right, More Realistic
        const stampX = pageWidth - margin - 40;
        const stampY = sigY + 5;
        doc.setDrawColor(33, 150, 243); // Classic Blue Stamp color
        doc.setLineWidth(1.5);
        doc.circle(stampX, stampY, 18); // Outer Thick Circle
        doc.setLineWidth(0.5);
        doc.circle(stampX, stampY, 15); // Inner Thin Circle
        
        doc.setFontSize(6);
        doc.setTextColor(33, 150, 243);
        doc.text('ОГРН 1157746566415', stampX, stampY - 8, { align: 'center' });
        doc.setFontSize(10);
        doc.text('ОБЩЕСТВО', stampX, stampY, { align: 'center' });
        doc.setFontSize(7);
        doc.text('БАМБАЛЕЙЛА', stampX, stampY + 5, { align: 'center' });
        doc.setFontSize(5);
        doc.text('МОСКВА', stampX, stampY + 10, { align: 'center' });

        doc.save(`Shet_${invoiceNo}.pdf`);
    } catch (err) {
        console.error('PDF Generation error:', err);
    }
};

/**
 * Stable PROPOSAL Generator
 */
export const generateProposalPDF = async (entity: CalculationEntity) => {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    try {
        const doc = new jsPDF() as unknown as JsPDFDocument;
        const hasRussian = await loadCyrillicFont(doc);
        const margin = 14;

        doc.setFontSize(22);
        doc.setTextColor(46, 125, 50); // Professional Green
        doc.text(hasRussian ? 'КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ' : 'COMMERCIAL PROPOSAL', margin, 20);
        
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`${hasRussian ? 'Объект:' : 'Client:'} ${cleanForPDF(entity.organizationName)}`, margin, 32);

        const tableData = entity.results?.summary.map((item, index) => [
            index + 1,
            cleanForPDF(item.inventory || 'Supply'),
            Math.ceil(item.quantity || 0),
            item.unit || 'pcs',
            `${Math.round(item.calculation?.annualBudget || 0).toLocaleString()} р.`
        ]) || [];

        autoTable(doc, {
            startY: 40,
            head: [[hasRussian ? '№' : '#', hasRussian ? 'Наименование' : 'Description', hasRussian ? 'Кол-во (год)' : 'Qty (year)', hasRussian ? 'Ед.' : 'Unit', hasRussian ? 'Бюджет в год' : 'Annual Budget']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [46, 125, 50], font: hasRussian ? 'Roboto' : 'helvetica', fontStyle: 'normal' },
            styles: { font: hasRussian ? 'Roboto' : 'helvetica', fontSize: 9, fontStyle: 'normal' }
        });

        doc.save(`Proposal_${entity.organizationName.replace(/\s+/g, '_')}.pdf`);
    } catch (e) {
        console.error(e);
    }
};

