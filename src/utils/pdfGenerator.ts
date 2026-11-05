import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Contract, Installment, PaymentReceipt, CostItem } from '../types';
import { formatCurrency, formatDateBR, formatDateTimeBR } from './formatters';

// Cores Oficiais PRÉDIO EW
const COLOR_PRIMARY: [number, number, number] = [15, 23, 42]; // #0f172a Deep Navy
const COLOR_SECONDARY: [number, number, number] = [30, 58, 138]; // #1e3a8a Blue
const COLOR_SUCCESS: [number, number, number] = [5, 150, 105]; // #059669 Emerald
const COLOR_TEXT: [number, number, number] = [51, 65, 85]; // #334155 Slate-700
const COLOR_MUTED: [number, number, number] = [100, 116, 139]; // #64748b Slate-500

function addHeader(doc: jsPDF, title: string, subtitle: string, documentCode?: string) {
  // Top Banner
  doc.setFillColor(15, 23, 42);
  doc.rect(14, 12, 182, 22, 'F');

  // EW Badge
  doc.setFillColor(30, 58, 138);
  doc.roundedRect(18, 15, 16, 16, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('EW', 26, 25.5, { align: 'center' });

  // Title
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('PRÉDIO EW EMPREENDIMENTOS', 38, 21);

  // Subtitle
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text(subtitle || 'Gestão Financeira & Imobiliária Segregada', 38, 27);

  // Doc Code
  if (documentCode) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(251, 191, 36); // Amber
    doc.text(documentCode, 190, 21, { align: 'right' });
    doc.setFontSize(7);
    doc.setTextColor(203, 213, 225);
    doc.text(`Emissão: ${new Date().toLocaleDateString('pt-BR')}`, 190, 27, { align: 'right' });
  }

  // Document Title Bar below
  doc.setFillColor(241, 245, 249);
  doc.rect(14, 37, 182, 9, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.text(title.toUpperCase(), 18, 43);
}

function addFooter(doc: jsPDF, pageNum: number, totalPages?: number) {
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setDrawColor(226, 232, 240);
  doc.line(14, pageHeight - 14, 196, pageHeight - 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'PRÉDIO EW · Sistema Oficial de Gestão Financeira · Documento Autêntico',
    14,
    pageHeight - 9
  );
  doc.text(
    totalPages ? `Página ${pageNum} de ${totalPages}` : `Página ${pageNum}`,
    196,
    pageHeight - 9,
    { align: 'right' }
  );
}

/**
 * 1. Gera PDF do Extrato Financeiro de um Comprador / Unidade
 */
export function downloadContractStatementPDF(contract: Contract) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  addHeader(
    doc,
    `EXTRATO FINANCEIRO — ${contract.buyer.name}`,
    `Unidade ${contract.unit.unitNumber} (${contract.unit.position}) · Operação ${contract.operationNumber}`,
    contract.code
  );

  // Quadro de Dados do Comprador e Unidade
  let y = 52;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, y, 182, 28, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('COMPRADOR(A):', 18, y + 6);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(contract.buyer.name, 48, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('CPF:', 18, y + 12);
  doc.setTextColor(15, 23, 42);
  doc.text(contract.buyer.cpf, 48, y + 12);

  doc.setTextColor(100, 116, 139);
  doc.text('UNIDADE:', 18, y + 18);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(`${contract.unit.unitNumber} (${contract.unit.position})`, 48, y + 18);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('REGRA/JUROS:', 18, y + 24);
  doc.setTextColor(15, 23, 42);
  doc.text(
    contract.specialRulesDescription[0]
      ? `${contract.specialRulesDescription[0].slice(0, 65)}...`
      : 'Tabela Padrão da Construtora',
    48,
    y + 24
  );

  // Totais do Contrato à Direita
  const totalReceived = contract.installments.reduce((acc, i) => acc + (i.paidAmount || 0), 0);
  const remainingBalance = contract.totalContractedAmount - totalReceived;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('VGV CONTRATADO:', 125, y + 6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(formatCurrency(contract.totalContractedAmount), 190, y + 6, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL RECEBIDO:', 125, y + 13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(5, 150, 105);
  doc.text(formatCurrency(totalReceived), 190, y + 13, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('SALDO DEVEDOR:', 125, y + 20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(220, 38, 38);
  doc.text(formatCurrency(remainingBalance), 190, y + 20, { align: 'right' });

  // Tabela de Parcelas
  const tableData = contract.installments.map((inst) => {
    const isPaid = !!inst.paidDate;
    const isOverdue = !isPaid && inst.dueDate < new Date().toISOString().slice(0, 10);
    const statusText = isPaid ? 'PAGA' : isOverdue ? 'EM ATRASO' : 'PENDENTE';

    return [
      inst.description,
      formatDateBR(inst.dueDate),
      formatCurrency(inst.nominalAmount),
      inst.paidDate ? formatDateBR(inst.paidDate) : '—',
      inst.paidAmount ? formatCurrency(inst.paidAmount) : '—',
      inst.receiptNumber || '—',
      statusText,
    ];
  });

  autoTable(doc, {
    startY: y + 33,
    head: [['Parcela / Obrigação', 'Vencimento', 'Valor Nominal', 'Data Baixa', 'Valor Pago', 'Nº Recibo', 'Status']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [51, 65, 85],
    },
    columnStyles: {
      0: { cellWidth: 42 },
      1: { cellWidth: 22, halign: 'center' },
      2: { cellWidth: 26, halign: 'right', fontStyle: 'bold' },
      3: { cellWidth: 22, halign: 'center' },
      4: { cellWidth: 26, halign: 'right' },
      5: { cellWidth: 22, halign: 'center' },
      6: { cellWidth: 22, halign: 'center', fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 6) {
        const val = data.cell.raw;
        if (val === 'PAGA') {
          data.cell.styles.textColor = [5, 150, 105];
        } else if (val === 'EM ATRASO') {
          data.cell.styles.textColor = [220, 38, 38];
        } else {
          data.cell.styles.textColor = [217, 119, 6];
        }
      }
    },
    margin: { left: 14, right: 14, bottom: 18 },
  });

  // Numeração de páginas
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    addFooter(doc, i, pageCount);
  }

  const safeName = contract.buyer.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Extrato_Financeiro_${safeName}_Apto_${contract.unit.unitNumber}.pdf`);
}

/**
 * 2. Gera PDF do Relatório Executivo Geral de Vendas da Construtora
 */
export function downloadGeneralSalesReportPDF(contracts: Contract[]) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const totalVgv = contracts.reduce((acc, c) => acc + c.totalContractedAmount, 0);
  let totalReceived = 0;
  contracts.forEach((c) => {
    c.installments.forEach((i) => {
      if (i.paidAmount) totalReceived += i.paidAmount;
    });
  });
  const remainingBalance = totalVgv - totalReceived;

  addHeader(
    doc,
    'RELATÓRIO EXECUTIVO GERAL DE VENDAS & RECEBÍVEIS',
    'Consolidação das Operações Ativas da Carteira',
    'EW-REL-GERAL'
  );

  // 4 Cards de Totais
  let y = 50;
  const cardW = 43;
  const cardH = 18;

  // Card 1: VGV
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, y, cardW, cardH, 2, 2, 'FD');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('VGV NEGOCIADO', 17, y + 5);
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(formatCurrency(totalVgv), 17, y + 13);

  // Card 2: Recebido
  doc.roundedRect(60, y, cardW, cardH, 2, 2, 'FD');
  doc.setFontSize(7);
  doc.setTextColor(5, 150, 105);
  doc.text('TOTAL RECEBIDO', 63, y + 5);
  doc.setFontSize(10.5);
  doc.text(formatCurrency(totalReceived), 63, y + 13);

  // Card 3: Saldo
  doc.roundedRect(106, y, cardW, cardH, 2, 2, 'FD');
  doc.setFontSize(7);
  doc.setTextColor(30, 58, 138);
  doc.text('SALDO A RECEBER', 109, y + 5);
  doc.setFontSize(10.5);
  doc.text(formatCurrency(remainingBalance), 109, y + 13);

  // Card 4: Operações
  doc.roundedRect(152, y, cardW, cardH, 2, 2, 'FD');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('OPERAÇÕES ATIVAS', 155, y + 5);
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`${contracts.length} Unidades`, 155, y + 13);

  // Resumo por Comprador
  const summaryRows = contracts.map((c) => {
    const cReceived = c.installments.reduce((acc, i) => acc + (i.paidAmount || 0), 0);
    const cBalance = c.totalContractedAmount - cReceived;
    const pct = c.totalContractedAmount > 0 ? (cReceived / c.totalContractedAmount) * 100 : 0;
    return [
      c.buyer.name,
      `Apto ${c.unit.unitNumber}`,
      formatCurrency(c.totalContractedAmount),
      formatCurrency(c.agreedOrEstimatedInterest),
      formatCurrency(cReceived),
      formatCurrency(cBalance),
      `${pct.toFixed(0)}%`,
    ];
  });

  autoTable(doc, {
    startY: y + 23,
    head: [['Comprador', 'Unidade', 'Valor Contratado', 'Juros/Acres.', 'Recebido', 'Saldo Devedor', '% Quitado']],
    body: summaryRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [51, 65, 85],
    },
    columnStyles: {
      0: { cellWidth: 50, fontStyle: 'bold' },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 28, halign: 'right' },
      3: { cellWidth: 22, halign: 'right' },
      4: { cellWidth: 28, halign: 'right', fontStyle: 'bold', textColor: [5, 150, 105] },
      5: { cellWidth: 22, halign: 'right', textColor: [220, 38, 38] },
      6: { cellWidth: 14, halign: 'center', fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14, bottom: 18 },
  });

  // Numeração de páginas
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    addFooter(doc, i, pageCount);
  }

  doc.save('Relatorio_Executivo_Geral_Predio_EW.pdf');
}

/**
 * 3. Gera PDF Oficial do Recibo de Quitação
 */
export function downloadOfficialReceiptPDF(receipt: PaymentReceipt) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const isCancelled = receipt.status === 'cancelado';

  // Cabeçalho Oficial
  addHeader(
    doc,
    'RECIBO OFICIAL DE QUITAÇÃO DE OBRIGAÇÃO',
    'Empreendimento Imobiliário Residencial · PRÉDIO EW',
    `RECIBO Nº ${receipt.receiptNumber}`
  );

  let y = 52;

  // Destaque do Valor
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(30, 58, 138);
  doc.roundedRect(14, y, 182, 22, 3, 3, 'FD');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 138);
  doc.text('VALOR RECEBIDO E QUITADO:', 20, y + 8);

  doc.setFontSize(16);
  doc.setTextColor(5, 150, 105);
  doc.text(formatCurrency(receipt.receivedAmount), 20, y + 17);

  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text(`Data do Pagamento: ${formatDateBR(receipt.receivedDate)} · Forma: ${receipt.paymentMethod.toUpperCase()}`, 190, y + 17, { align: 'right' });

  // Corpo do Recibo
  y += 28;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, y, 182, 70, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'normal');

  const textLines = [
    `Recebemos de ${receipt.buyerName}, inscrito(a) no CPF/MF sob o nº ${receipt.buyerCpf},`,
    `a quantia líquida e certa de ${formatCurrency(receipt.receivedAmount)}, correspondente ao`,
    `pagamento e quitação da obrigação: ${receipt.installmentDescription},`,
    `com vencimento original em ${formatDateBR(receipt.installmentDueDate)}, referente à aquisição imobiliária`,
    `da Unidade ${receipt.unitNumber} do empreendimento residencial PRÉDIO EW.`,
  ];

  let textY = y + 10;
  textLines.forEach((line) => {
    doc.text(line, 20, textY);
    textY += 6;
  });

  // Saldo Devedor
  textY += 4;
  doc.setDrawColor(226, 232, 240);
  doc.line(20, textY, 190, textY);
  textY += 7;

  doc.setFont('helvetica', 'bold');
  doc.text('POSIÇÃO FINANCEIRA DO CONTRATO:', 20, textY);
  doc.setFont('helvetica', 'normal');
  textY += 6;
  doc.text(`• Saldo devedor anterior ao pagamento: ${formatCurrency(receipt.previousBalance)}`, 24, textY);
  textY += 5;
  doc.text(`• Novo saldo devedor remanescente: ${formatCurrency(receipt.newBalance)}`, 24, textY);

  // Favorecido / PIX
  y += 75;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, 182, 18, 2, 2, 'FD');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('DADOS DA CONTA RECEBEDORA:', 18, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Favorecido: ${receipt.recipientName || 'Igor Antunes / Rodrigo Lopes'}`, 18, y + 12);
  if (receipt.pixKey) {
    doc.text(`Chave PIX: ${receipt.pixKey}`, 110, y + 12);
  }

  // Se cancelado, marca d'água
  if (isCancelled) {
    doc.setFontSize(45);
    doc.setTextColor(220, 38, 38);
    doc.setFont('helvetica', 'bold');
    doc.text('CANCELADO', 105, 140, { align: 'center', angle: 30 });
    doc.setFontSize(9);
    doc.text(`Motivo: ${receipt.canceledReason || 'Cancelamento administrativo'}`, 105, 155, { align: 'center' });
  }

  // Assinatura
  y += 35;
  doc.setDrawColor(15, 23, 42);
  doc.line(60, y, 150, y);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('PRÉDIO EW EMPREENDIMENTOS', 105, y + 5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Diretoria Financeira & Controle de Contratos', 105, y + 9, { align: 'center' });

  addFooter(doc, 1, 1);

  const safeNum = receipt.receiptNumber.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Recibo_Quitacao_${safeNum}.pdf`);
}

/**
 * 4. Gera PDF Oficial do Relatório de Custos & Obras do PRÉDIO EW
 */
export function downloadCostReportPDF(costs: CostItem[], periodLabel: string) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const totalAmount = costs.reduce((sum, c) => sum + c.totalAmount, 0);
  const totalPaid = costs.filter((c) => c.status === 'PAGO').reduce((sum, c) => sum + c.totalAmount, 0);
  const totalPending = totalAmount - totalPaid;

  addHeader(
    doc,
    `RELATÓRIO ANALÍTICO DE CUSTOS & OBRAS — ${periodLabel}`,
    'Sub-sistema de Gestão Financeira Segregada de Obras',
    `TOTAL: ${costs.length} ITENS`
  );

  // 3 Cards de Totais
  let y = 50;
  const cardW = 58;
  const cardH = 17;

  // Card 1
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, y, cardW, cardH, 2, 2, 'FD');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('VALOR TOTAL DE CUSTOS', 17, y + 5);
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(formatCurrency(totalAmount), 17, y + 12);

  // Card 2
  doc.roundedRect(76, y, cardW, cardH, 2, 2, 'FD');
  doc.setFontSize(7);
  doc.setTextColor(5, 150, 105);
  doc.text('TOTAL PAGO / LIQUIDADO', 79, y + 5);
  doc.setFontSize(10.5);
  doc.text(formatCurrency(totalPaid), 79, y + 12);

  // Card 3
  doc.roundedRect(138, y, cardW, cardH, 2, 2, 'FD');
  doc.setFontSize(7);
  doc.setTextColor(217, 119, 6);
  doc.text('TOTAL A PAGAR / PENDENTE', 141, y + 5);
  doc.setFontSize(10.5);
  doc.text(formatCurrency(totalPending), 141, y + 12);

  // Tabela Analítica de Custos
  const tableData = costs.map((c) => {
    return [
      c.code,
      formatDateBR(c.date),
      c.supplier,
      c.item,
      c.category,
      `${c.quantity} ${c.unit}`,
      formatCurrency(c.totalAmount),
      c.status,
    ];
  });

  autoTable(doc, {
    startY: y + 22,
    head: [['Código', 'Data', 'Fornecedor', 'Item / Descrição', 'Categoria', 'Qtd', 'Valor Total', 'Status']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [51, 65, 85],
    },
    columnStyles: {
      0: { cellWidth: 18, fontStyle: 'bold' },
      1: { cellWidth: 18, halign: 'center' },
      2: { cellWidth: 36, fontStyle: 'bold' },
      3: { cellWidth: 40 },
      4: { cellWidth: 28 },
      5: { cellWidth: 14, halign: 'center' },
      6: { cellWidth: 20, halign: 'right', fontStyle: 'bold' },
      7: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 7) {
        if (data.cell.raw === 'PAGO') {
          data.cell.styles.textColor = [5, 150, 105];
        } else {
          data.cell.styles.textColor = [217, 119, 6];
        }
      }
    },
    margin: { left: 14, right: 14, bottom: 18 },
  });

  // Numeração de páginas
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    addFooter(doc, i, pageCount);
  }

  const safeScope = periodLabel.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Relatorio_Custos_Predio_EW_${safeScope}.pdf`);
}

/**
 * 5. Gera PDF do Detalhamento Mensal de Recebimentos da Construtora
 */
export function downloadMonthlyReceiptsDetailPDF(selectedMonth: string, contracts: Contract[]) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const [year, month] = selectedMonth.split('-');
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const mIdx = parseInt(month, 10) - 1;
  const monthLabel = `${monthNames[mIdx] || month} / ${year}`;
  const todayStr = new Date().toISOString().slice(0, 10);

  addHeader(
    doc,
    `RECEBIMENTOS DE ${monthLabel.toUpperCase()}`,
    'Detalhamento Analítico de Parcelas e Baixas Programadas',
    `EW-REC-${year}${month}`
  );

  // Coleta todas as parcelas do mês
  interface RowData {
    buyerName: string;
    unitNumber: string;
    description: string;
    dueDate: string;
    nominalAmount: number;
    paidDate?: string;
    paidAmount?: number;
    status: 'PAGA' | 'EM ATRASO' | 'PENDENTE';
  }

  const rows: RowData[] = [];
  let totalScheduled = 0;
  let totalReceived = 0;
  let totalPending = 0;
  let totalOverdue = 0;

  contracts.forEach((c) => {
    c.installments.forEach((inst) => {
      if (inst.dueDate.startsWith(selectedMonth)) {
        totalScheduled += inst.nominalAmount;
        const isPaid = !!inst.paidDate || !!inst.paidAmount;
        const isOverdue = !isPaid && inst.dueDate < todayStr;
        const status: 'PAGA' | 'EM ATRASO' | 'PENDENTE' = isPaid ? 'PAGA' : isOverdue ? 'EM ATRASO' : 'PENDENTE';

        if (isPaid) {
          totalReceived += inst.paidAmount || inst.nominalAmount;
        } else {
          totalPending += inst.nominalAmount;
          if (isOverdue) totalOverdue += inst.nominalAmount;
        }

        rows.push({
          buyerName: c.buyer.name,
          unitNumber: c.unit.unitNumber,
          description: inst.description,
          dueDate: inst.dueDate,
          nominalAmount: inst.nominalAmount,
          paidDate: inst.paidDate,
          paidAmount: inst.paidAmount,
          status,
        });
      }
    });
  });

  rows.sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  // 4 Cards de Totais
  let y = 50;
  const cardW = 43;
  const cardH = 18;

  // Card 1: Recebido no Mês
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, y, cardW, cardH, 2, 2, 'FD');
  doc.setFontSize(7);
  doc.setTextColor(5, 150, 105);
  doc.setFont('helvetica', 'bold');
  doc.text('RECEBIDO NO MÊS', 17, y + 5);
  doc.setFontSize(10.5);
  doc.text(formatCurrency(totalReceived), 17, y + 12);

  // Card 2: Previsto no Mês
  doc.roundedRect(60, y, cardW, cardH, 2, 2, 'FD');
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  doc.text('PREVISTO NO MÊS', 63, y + 5);
  doc.setFontSize(10.5);
  doc.text(formatCurrency(totalScheduled), 63, y + 12);

  // Card 3: Pendente no Mês
  doc.roundedRect(106, y, cardW, cardH, 2, 2, 'FD');
  doc.setFontSize(7);
  doc.setTextColor(217, 119, 6);
  doc.text('PENDENTE NO MÊS', 109, y + 5);
  doc.setFontSize(10.5);
  doc.text(formatCurrency(totalPending), 109, y + 12);

  // Card 4: Valores Vencidos
  doc.roundedRect(152, y, cardW, cardH, 2, 2, 'FD');
  doc.setFontSize(7);
  doc.setTextColor(220, 38, 38);
  doc.text('VALORES VENCIDOS', 155, y + 5);
  doc.setFontSize(10.5);
  doc.text(formatCurrency(totalOverdue), 155, y + 12);

  // Tabela de Parcelas
  const tableData = rows.map((r) => [
    r.buyerName,
    r.unitNumber,
    r.description,
    formatDateBR(r.dueDate),
    formatCurrency(r.nominalAmount),
    r.paidDate ? formatDateBR(r.paidDate) : '—',
    r.paidAmount ? formatCurrency(r.paidAmount) : '—',
    r.status,
  ]);

  autoTable(doc, {
    startY: y + 22,
    head: [['Comprador(a)', 'Unid.', 'Parcela', 'Vencimento', 'Valor Nom.', 'Data Baixa', 'Valor Pago', 'Status']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [51, 65, 85],
    },
    columnStyles: {
      0: { cellWidth: 42, fontStyle: 'bold' },
      1: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
      2: { cellWidth: 26 },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 22, halign: 'right', fontStyle: 'bold' },
      5: { cellWidth: 20, halign: 'center' },
      6: { cellWidth: 22, halign: 'right' },
      7: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 7) {
        if (data.cell.raw === 'PAGA') {
          data.cell.styles.textColor = [5, 150, 105];
        } else if (data.cell.raw === 'EM ATRASO') {
          data.cell.styles.textColor = [220, 38, 38];
        } else {
          data.cell.styles.textColor = [217, 119, 6];
        }
      }
    },
    margin: { left: 14, right: 14, bottom: 18 },
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    addFooter(doc, i, pageCount);
  }

  const safeScope = selectedMonth.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Detalhamento_Recebimentos_${safeScope}_Predio_EW.pdf`);
}

