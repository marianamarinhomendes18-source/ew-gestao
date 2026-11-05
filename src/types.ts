export type PaymentStatus = 'pending' | 'paid' | 'overdue';

export interface Installment {
  id: string;
  contractId: string;
  order: number;
  description: string;
  dueDate: string; // ISO date format YYYY-MM-DD
  nominalAmount: number;
  type: 'sinal' | 'entrada' | 'mensal' | 'intermediaria' | 'final' | 'complemento';
  isCombined?: boolean;
  notes?: string;
  // Payment info (if paid)
  paidAmount?: number;
  paidDate?: string;
  paymentMethod?: 'pix' | 'ted' | 'boleto' | 'deposito' | 'outro';
  receiptNumber?: string;
  lateFeeApplied?: number;
  interestApplied?: number;
  discountApplied?: number;
  paymentProofNote?: string;
}

export interface BuyerInfo {
  name: string;
  cpf: string;
  rg?: string;
  birthDate?: string;
  maritalStatus: string;
  profession: string;
  phone?: string;
  personalDocsStatus: 'pendente' | 'completo';
  coBuyer?: {
    name: string;
    cpf: string;
    rg?: string;
  };
}

export interface UnitFeatures {
  type: 'apartamento' | 'cobertura';
  unitNumber: string;
  position: string; // e.g. "fundos com varanda", "de frente com varanda gourmet", "cobertura"
  bedrooms: number;
  suites: number;
  livingRooms?: number;
  kitchens?: number;
  bathroomsOrLavabo?: string;
  hasGourmetBalcony: boolean;
  carParkingSpaces: number;
  motorcycleParkingSpaces: number;
}

export interface ContractRules {
  finePercent: number; // e.g., 2%
  monthlyInterestRate: number; // e.g., 1% ao mês pro rata die
  hasEstimatedInterest: boolean;
  estimatedInterestNote?: string;
  requiresReviewBeforeSigning?: boolean;
  customInterestAgreement?: string;
}

export interface Contract {
  id: string;
  code: string; // e.g. EW-CTR-2026-0108
  operationNumber: string; // "OPERAÇÃO 01", etc.
  buyer: BuyerInfo;
  unit: UnitFeatures;
  principalAmount: number;
  agreedOrEstimatedInterest: number;
  totalContractedAmount: number;
  rules: ContractRules;
  specialRulesDescription: string[];
  installments: Installment[];
  status: 'ativo' | 'concluido' | 'renegociado';
}

export interface BankDetails {
  recipientName: string;
  tradingName: string;
  cnpj: string;
  bankName: string;
  agency: string;
  account: string;
  pixKey: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: 'pagamento' | 'estorno' | 'edicao' | 'novo_contrato' | 'recibo_gerado' | 'recibo_cancelado' | 'custo_criado' | 'custo_editado' | 'custo_pago';
  contractCode: string;
  unitNumber: string;
  description: string;
  details: string;
  amount?: number;
}

export interface PaymentReceipt {
  id: string; // rec-0001-2026
  receiptNumber: string; // e.g. "0001/2026"
  sequentialNumber: number; // 1, 2, 3...
  contractId: string;
  contractCode: string;
  buyerName: string;
  buyerCpf: string;
  unitNumber: string;
  installmentId: string;
  installmentDescription: string;
  installmentDueDate: string;
  receivedAmount: number;
  paymentMethod: 'pix' | 'ted' | 'boleto' | 'deposito' | 'outro';
  receivedDate: string; // YYYY-MM-DD
  previousBalance: number;
  newBalance: number;
  recipientName: string; // e.g. "Igor Antunes" | "Rodrigo Lopes" | "PRÉDIO EW"
  pixKey?: string;
  status: 'ativo' | 'cancelado';
  canceledAt?: string;
  canceledReason?: string;
  createdAt: string;
  notes?: string;
}

export interface CostDocument {
  id: string;
  name: string;
  type: string; // MIME type e.g. "image/jpeg", "image/png", "application/pdf"
  size: number;
  dataUrl: string; // Persistent base64 / data URL
  uploadedAt: string;
}

export interface CostHistoryEntry {
  id: string;
  timestamp: string;
  action: 'criacao' | 'edicao' | 'pagamento' | 'cancelamento' | 'anexo';
  description: string;
  author: string;
  previousValues?: Record<string, any>;
  newValues?: Record<string, any>;
}

export interface CostItem {
  id: string;
  code: string; // e.g. "CUSTO-0001"
  date: string; // YYYY-MM-DD
  dueDate?: string; // YYYY-MM-DD
  category: string; // "Materiais de construção", "Mão de obra", etc.
  costType: 'materiais' | 'mao_de_obra' | 'fretes' | 'servicos' | 'equipamentos' | 'outros';
  supplier: string; // Fornecedor
  item: string; // Nome do item ou serviço
  description: string;
  quantity: number;
  unit: string; // "m³", "un", "kg", "h", "diária", etc.
  unitPrice: number;
  totalAmount: number;
  paymentMethod: 'pix' | 'boleto' | 'transferencia' | 'cartao' | 'dinheiro' | 'outro';
  status: 'PENDENTE' | 'PAGO' | 'EM ATRASO';
  paidDate?: string;
  origin: 'ia_foto' | 'ia_texto' | 'manual';
  observations?: string;
  documents: CostDocument[];
  createdAt: string;
  updatedAt: string;
  confirmedBy?: string;
  history: CostHistoryEntry[];
}

