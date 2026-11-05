import { AuditLogEntry, BankDetails, Contract, Installment, PaymentReceipt, CostItem } from '../types';
import { INITIAL_CONTRACTS, CONTRACT_01 } from '../data/initialData';
import { formatDateBR, formatCurrency } from './formatters';

const STORAGE_KEY_CONTRACTS = 'predio_ew_contracts_v1';
const STORAGE_KEY_AUDIT = 'predio_ew_audit_v1';
const STORAGE_KEY_BANK = 'predio_ew_bank_v1';
const STORAGE_KEY_RECEIPTS = 'predio_ew_receipts_v1';
const STORAGE_KEY_COSTS = 'predio_ew_costs_v1';
const STORAGE_KEY_COST_CATEGORIES = 'predio_ew_cost_categories_v1';

export const DEFAULT_BANK_DETAILS: BankDetails = {
  recipientName: 'PRÉDIO EW EMPREENDIMENTOS IMOBILIÁRIOS LTDA',
  tradingName: 'PRÉDIO EW',
  cnpj: '54.892.103/0001-44',
  bankName: 'Caixa Econômica Federal',
  agency: '4402',
  account: '573614854-0',
  pixKey: 'iradsk@icloud.com', // Igor Antunes
};

export const DEFAULT_COST_CATEGORIES = [
  'Materiais de construção',
  'Mão de obra',
  'Fretes',
  'Equipamentos',
  'Energia',
  'Água',
  'Documentação',
  'Taxas e impostos',
  'Marketing',
  'Administração',
  'Serviços',
  'Financeiro',
  'Outros',
];

export function loadBankDetails(): BankDetails {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BANK);
    if (!raw) return DEFAULT_BANK_DETAILS;
    return JSON.parse(raw);
  } catch {
    return DEFAULT_BANK_DETAILS;
  }
}

export function saveBankDetails(details: BankDetails): void {
  try {
    localStorage.setItem(STORAGE_KEY_BANK, JSON.stringify(details));
  } catch (err) {
    console.error('Erro ao salvar dados bancários:', err);
  }
}

export function loadContracts(): Contract[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONTRACTS);
    if (!raw) {
      saveContracts(INITIAL_CONTRACTS);
      return INITIAL_CONTRACTS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      let needsResave = false;
      const updated = parsed.map((c: Contract) => {
        // Substituição completa do cadastro e cronograma de Zana Toledo para Apartamento 103 (R$ 210.000,00)
        if (c.id === 'ew-ctr-01' && (c.unit.unitNumber !== 'Apartamento 103' || c.totalContractedAmount !== 210000 || c.installments.length !== 35)) {
          needsResave = true;
          return CONTRACT_01;
        }
        if (c.id === 'ew-ctr-03' && (c.principalAmount !== 420000 || c.agreedOrEstimatedInterest !== 12000)) {
          needsResave = true;
          return {
            ...c,
            principalAmount: 420000.00,
            agreedOrEstimatedInterest: 12000.00,
            totalContractedAmount: 432000.00,
          };
        }
        if (c.id === 'ew-ctr-04' && (c.principalAmount !== 420000 || c.agreedOrEstimatedInterest !== 15000)) {
          needsResave = true;
          return {
            ...c,
            principalAmount: 420000.00,
            agreedOrEstimatedInterest: 15000.00,
            totalContractedAmount: 435000.00,
          };
        }
        return c;
      });

      if (needsResave) {
        saveContracts(updated);
      }
      return updated;
    }
    return INITIAL_CONTRACTS;
  } catch (err) {
    console.error('Erro ao ler do localStorage, usando dados iniciais:', err);
    return INITIAL_CONTRACTS;
  }
}

export function saveContracts(contracts: Contract[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_CONTRACTS, JSON.stringify(contracts));
  } catch (err) {
    console.error('Erro ao salvar contratos:', err);
  }
}

export function loadAuditLog(): AuditLogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUDIT);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function addAuditEntry(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): void {
  try {
    const logs = loadAuditLog();
    const newEntry: AuditLogEntry = {
      ...entry,
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      timestamp: new Date().toISOString(),
    };
    logs.unshift(newEntry);
    localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify(logs.slice(0, 200)));
  } catch (err) {
    console.error('Erro ao adicionar log de auditoria:', err);
  }
}

export function resetAllData(): Contract[] {
  try {
    localStorage.removeItem(STORAGE_KEY_CONTRACTS);
    localStorage.removeItem(STORAGE_KEY_AUDIT);
    saveContracts(INITIAL_CONTRACTS);
    addAuditEntry({
      action: 'edicao',
      contractCode: 'SISTEMA',
      unitNumber: 'Todas',
      description: 'Reinicialização do sistema',
      details: 'Sistema reiniciado para os valores contratuais originais com R$ 0,00 de recebimentos.',
    });
    return INITIAL_CONTRACTS;
  } catch {
    return INITIAL_CONTRACTS;
  }
}

export function exportContractsJSON(contracts: Contract[]): void {
  const data = {
    app: 'PREDIO_EW_GESTAO_FINANCEIRA',
    exportDate: new Date().toISOString(),
    contracts,
    auditLogs: loadAuditLog(),
  };
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `predio-ew-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportInstallmentsCSV(contracts: Contract[]): void {
  const headers = [
    'Código Contrato',
    'Unidade',
    'Comprador(es)',
    'Parcela Nº',
    'Descrição',
    'Vencimento',
    'Valor Nominal (R$)',
    'Status',
    'Data Pagamento',
    'Valor Pago (R$)',
    'Forma de Pagamento',
    'Nº Comprovante / Doc',
    'Multa (R$)',
    'Juros Mora (R$)',
    'Observações',
  ];

  const rows: string[][] = [];

  contracts.forEach((contract) => {
    contract.installments.forEach((inst) => {
      const isPaid = !!inst.paidDate;
      const isOverdue = !isPaid && new Date(inst.dueDate + 'T23:59:59') < new Date();
      const statusText = isPaid ? 'RECEBIDO' : isOverdue ? 'EM ATRASO' : 'A VENCER';

      rows.push([
        contract.code,
        `"${contract.unit.unitNumber}"`,
        `"${contract.buyer.name}"`,
        inst.order.toString(),
        `"${inst.description}"`,
        formatDateBR(inst.dueDate),
        inst.nominalAmount.toFixed(2).replace('.', ','),
        statusText,
        inst.paidDate ? formatDateBR(inst.paidDate) : '',
        inst.paidAmount !== undefined ? inst.paidAmount.toFixed(2).replace('.', ',') : '',
        inst.paymentMethod ? inst.paymentMethod.toUpperCase() : '',
        inst.receiptNumber ? `"${inst.receiptNumber}"` : '',
        inst.lateFeeApplied ? inst.lateFeeApplied.toFixed(2).replace('.', ',') : '0,00',
        inst.interestApplied ? inst.interestApplied.toFixed(2).replace('.', ',') : '0,00',
        inst.notes || inst.paymentProofNote ? `"${(inst.notes || '') + ' ' + (inst.paymentProofNote || '')}"` : '',
      ]);
    });
  });

  const csvContent =
    '\uFEFF' + // UTF-8 BOM para Excel ler acentuação corretamente
    [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `predio-ew-cronograma-financeiro-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ==========================================
// MÓDULO DE RECIBOS DE PAGAMENTO OFICIAIS
// ==========================================

export function loadReceipts(): PaymentReceipt[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RECEIPTS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Erro ao ler recibos:', err);
    return [];
  }
}

export function saveReceipts(receipts: PaymentReceipt[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_RECEIPTS, JSON.stringify(receipts));
  } catch (err) {
    console.error('Erro ao salvar recibos:', err);
  }
}

export function getNextReceiptNumber(paymentYear = 2026): { receiptNumber: string; sequentialNumber: number } {
  const receipts = loadReceipts();
  // Encontrar o maior sequentialNumber já usado (incluindo cancelados)
  let maxSeq = 0;
  for (const r of receipts) {
    if (typeof r.sequentialNumber === 'number' && r.sequentialNumber > maxSeq) {
      maxSeq = r.sequentialNumber;
    }
  }
  const nextSeq = maxSeq + 1;
  const formatted = `${String(nextSeq).padStart(4, '0')}/${paymentYear}`;
  return { receiptNumber: formatted, sequentialNumber: nextSeq };
}

export function createReceiptForPayment(params: {
  contract: Contract;
  installment: Installment;
  receivedAmount: number;
  paymentMethod: 'pix' | 'ted' | 'boleto' | 'deposito' | 'outro';
  receivedDate: string;
  previousBalance: number;
  newBalance: number;
  recipientName?: string;
  pixKey?: string;
  notes?: string;
}): PaymentReceipt {
  const receipts = loadReceipts();
  const year = params.receivedDate ? parseInt(params.receivedDate.slice(0, 4), 10) : 2026;
  const { receiptNumber, sequentialNumber } = getNextReceiptNumber(isNaN(year) ? 2026 : year);

  const receipt: PaymentReceipt = {
    id: `rec-${String(sequentialNumber).padStart(4, '0')}-${year}`,
    receiptNumber,
    sequentialNumber,
    contractId: params.contract.id,
    contractCode: params.contract.code,
    buyerName: params.contract.buyer.name,
    buyerCpf: params.contract.buyer.cpf || 'Pendente de complementação',
    unitNumber: params.contract.unit.unitNumber,
    installmentId: params.installment.id,
    installmentDescription: params.installment.description,
    installmentDueDate: params.installment.dueDate,
    receivedAmount: params.receivedAmount,
    paymentMethod: params.paymentMethod,
    receivedDate: params.receivedDate,
    previousBalance: params.previousBalance,
    newBalance: params.newBalance,
    recipientName: params.recipientName || 'Igor Antunes / Rodrigo Lopes',
    pixKey: params.pixKey || (params.recipientName?.includes('Rodrigo') ? '114.926.377-69' : 'iradsk@icloud.com'),
    status: 'ativo',
    createdAt: new Date().toISOString(),
    notes: params.notes,
  };

  receipts.unshift(receipt);
  saveReceipts(receipts);

  addAuditEntry({
    action: 'recibo_gerado',
    contractCode: params.contract.code,
    unitNumber: params.contract.unit.unitNumber,
    description: `Recibo nº ${receiptNumber} gerado automaticamente`,
    details: `Emitido para ${params.contract.buyer.name} no valor de ${formatCurrency(params.receivedAmount)} ref. ${params.installment.description}.`,
    amount: params.receivedAmount,
  });

  return receipt;
}

export function cancelReceipt(receiptId: string, reason: string): PaymentReceipt | null {
  const receipts = loadReceipts();
  const index = receipts.findIndex((r) => r.id === receiptId);
  if (index === -1) return null;

  const target = receipts[index];
  target.status = 'cancelado';
  target.canceledAt = new Date().toISOString();
  target.canceledReason = reason;

  saveReceipts(receipts);

  addAuditEntry({
    action: 'recibo_cancelado',
    contractCode: target.contractCode,
    unitNumber: target.unitNumber,
    description: `Recibo nº ${target.receiptNumber} CANCELADO`,
    details: `Motivo: ${reason}. O número ${target.receiptNumber} permanece inutilizado para auditoria fiscal.`,
    amount: target.receivedAmount,
  });

  return target;
}

// ==========================================
// MÓDULO DE CUSTOS (TOTALMENTE ISOLADO)
// ==========================================

export function loadCostCategories(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_COST_CATEGORIES);
    if (!raw) return DEFAULT_COST_CATEGORIES;
    return JSON.parse(raw);
  } catch {
    return DEFAULT_COST_CATEGORIES;
  }
}

export function saveCostCategories(cats: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_COST_CATEGORIES, JSON.stringify(cats));
  } catch (err) {
    console.error('Erro ao salvar categorias de custos:', err);
  }
}

export function loadCosts(): CostItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_COSTS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Erro ao ler custos:', err);
    return [];
  }
}

export function saveCosts(costs: CostItem[]): void {
  try {
    // Para evitar exceder o limite do localStorage, os documentos pesados (fotos)
    // são gravados no IndexedDB e mantidos no item apenas com metadados/IDs se forem muito grandes,
    // mas se couberem, mantém inline.
    localStorage.setItem(STORAGE_KEY_COSTS, JSON.stringify(costs));
  } catch (err) {
    console.warn('Erro ao salvar custos no localStorage, tentando sem dados binários pesados:', err);
    try {
      const lightweight = costs.map((c) => ({
        ...c,
        documents: c.documents.map((d) => ({
          ...d,
          dataUrl: d.dataUrl.length > 50000 ? '' : d.dataUrl, // mantido no IndexedDB
        })),
      }));
      localStorage.setItem(STORAGE_KEY_COSTS, JSON.stringify(lightweight));
    } catch (e) {
      console.error('Erro crítico ao salvar custos:', e);
    }
  }
}

export function getNextCostCode(): string {
  const costs = loadCosts();
  let maxNum = 0;
  for (const c of costs) {
    const match = c.code.match(/CUSTO-(\d+)/);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > maxNum) maxNum = n;
    }
  }
  return `CUSTO-${String(maxNum + 1).padStart(4, '0')}`;
}

export function addCostItem(item: CostItem): void {
  const costs = loadCosts();
  costs.unshift(item);
  saveCosts(costs);

  addAuditEntry({
    action: 'custo_criado',
    contractCode: 'CUSTOS-OBRA',
    unitNumber: 'Obra EW',
    description: `Lançamento de custo: ${item.code} - ${item.item}`,
    details: `Fornecedor: ${item.supplier} | Categoria: ${item.category} | Valor: ${formatCurrency(item.totalAmount)} (${item.origin})`,
    amount: item.totalAmount,
  });
}

export function updateCostItem(item: CostItem): void {
  const costs = loadCosts();
  const idx = costs.findIndex((c) => c.id === item.id);
  if (idx !== -1) {
    costs[idx] = item;
    saveCosts(costs);

    addAuditEntry({
      action: 'custo_editado',
      contractCode: 'CUSTOS-OBRA',
      unitNumber: 'Obra EW',
      description: `Atualização de custo: ${item.code}`,
      details: `Status: ${item.status} | Total: ${formatCurrency(item.totalAmount)}`,
      amount: item.totalAmount,
    });
  }
}

export function deleteCostItem(id: string): void {
  const costs = loadCosts();
  const target = costs.find((c) => c.id === id);
  const filtered = costs.filter((c) => c.id !== id);
  saveCosts(filtered);

  if (target) {
    addAuditEntry({
      action: 'custo_editado',
      contractCode: 'CUSTOS-OBRA',
      unitNumber: 'Obra EW',
      description: `Custo ${target.code} excluído`,
      details: `${target.item} - ${target.supplier} (${formatCurrency(target.totalAmount)})`,
    });
  }
}

export function exportCostsCSV(costs: CostItem[]): void {
  const headers = [
    'Código',
    'Data',
    'Vencimento',
    'Categoria',
    'Tipo de Custo',
    'Fornecedor',
    'Item / Descrição Detalhada',
    'Quantidade',
    'Unidade',
    'Preço Unitário (R$)',
    'Valor Total (R$)',
    'Forma de Pagamento',
    'Status',
    'Data de Pagamento',
    'Origem Lançamento',
    'Documentos Anexos (Qtd)',
    'Observações',
  ];

  const rows = costs.map((c) => [
    c.code,
    formatDateBR(c.date),
    c.dueDate ? formatDateBR(c.dueDate) : '',
    `"${c.category}"`,
    c.costType,
    `"${c.supplier}"`,
    `"${c.item} - ${c.description || ''}"`,
    c.quantity.toString(),
    c.unit,
    c.unitPrice.toFixed(2).replace('.', ','),
    c.totalAmount.toFixed(2).replace('.', ','),
    c.paymentMethod.toUpperCase(),
    c.status,
    c.paidDate ? formatDateBR(c.paidDate) : '',
    c.origin,
    c.documents.length.toString(),
    c.observations ? `"${c.observations}"` : '',
  ]);

  const csvContent =
    '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `predio-ew-relatorio-custos-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
