import { Contract, Installment } from '../types';

// Helper para gerar parcelas mensais em sequência
function generateMonthlyInstallments(
  contractId: string,
  startOrder: number,
  startYear: number,
  startMonth: number, // 1 a 12
  dueDay: number,
  totalCount: number,
  amount: number,
  prefix: string,
  suffixNotes?: string
): Installment[] {
  const installments: Installment[] = [];
  let currentYear = startYear;
  let currentMonth = startMonth;

  for (let i = 0; i < totalCount; i++) {
    const monthStr = currentMonth.toString().padStart(2, '0');
    const dayStr = dueDay.toString().padStart(2, '0');
    const dueDate = `${currentYear}-${monthStr}-${dayStr}`;
    const parcelNumberStr = (i + 1).toString().padStart(2, '0');
    const totalCountStr = totalCount.toString().padStart(2, '0');

    installments.push({
      id: `${contractId}-parc-${startOrder + i}`,
      contractId,
      order: startOrder + i,
      description: `${prefix} ${parcelNumberStr}/${totalCountStr}`,
      dueDate,
      nominalAmount: amount,
      type: 'mensal',
      notes: suffixNotes,
    });

    currentMonth++;
    if (currentMonth > 12) {
      currentMonth = 1;
      currentYear++;
    }
  }

  return installments;
}

// --------------------------------------------------------------------------------
// OPERAÇÃO 01 — ZANA TOLEDO
// --------------------------------------------------------------------------------
// --------------------------------------------------------------------------------
// OPERAÇÃO 01 — ZANA TOLEDO (APARTAMENTO 103 — LATERAL, SEM VARANDA)
// --------------------------------------------------------------------------------
const op01Installments: Installment[] = [
  // Entradas: 05/11/2026 e 17/11/2026 (R$ 10.000,00 cada)
  {
    id: 'EW-01-parc-1',
    contractId: 'ew-ctr-01',
    order: 1,
    description: 'Entrada 1/2',
    dueDate: '2026-11-05',
    nominalAmount: 10000.00,
    type: 'entrada',
  },
  {
    id: 'EW-01-parc-2',
    contractId: 'ew-ctr-01',
    order: 2,
    description: 'Entrada 2/2',
    dueDate: '2026-11-17',
    nominalAmount: 10000.00,
    type: 'entrada',
  },
  // 5 parcelas de R$ 10.000,00: Dez/2026 a Abr/2027, dia 20
  {
    id: 'EW-01-parc-3',
    contractId: 'ew-ctr-01',
    order: 3,
    description: 'Mensalidade 01/05',
    dueDate: '2026-12-20',
    nominalAmount: 10000.00,
    type: 'mensal',
  },
  {
    id: 'EW-01-parc-4',
    contractId: 'ew-ctr-01',
    order: 4,
    description: 'Mensalidade 02/05',
    dueDate: '2027-01-20',
    nominalAmount: 10000.00,
    type: 'mensal',
  },
  {
    id: 'EW-01-parc-5',
    contractId: 'ew-ctr-01',
    order: 5,
    description: 'Mensalidade 03/05',
    dueDate: '2027-02-20',
    nominalAmount: 10000.00,
    type: 'mensal',
  },
  {
    id: 'EW-01-parc-6',
    contractId: 'ew-ctr-01',
    order: 6,
    description: 'Mensalidade 04/05',
    dueDate: '2027-03-20',
    nominalAmount: 10000.00,
    type: 'mensal',
  },
  {
    id: 'EW-01-parc-7',
    contractId: 'ew-ctr-01',
    order: 7,
    description: 'Mensalidade 05/05',
    dueDate: '2027-04-20',
    nominalAmount: 10000.00,
    type: 'mensal',
  },
  // 28 parcelas mensais de R$ 5.000,00: Mai/2027 a Ago/2029, dia 20
  ...generateMonthlyInstallments(
    'ew-ctr-01',
    8,
    2027,
    5,
    20,
    28,
    5000.00,
    'Mensalidade'
  ),
];

export const CONTRACT_01: Contract = {
  id: 'ew-ctr-01',
  code: 'EW-CTR-2026-0103',
  operationNumber: 'OPERAÇÃO 01',
  buyer: {
    name: 'Zana Toledo',
    cpf: 'Não informado no contrato',
    maritalStatus: 'Pendente de complementação',
    profession: 'Empresária',
    personalDocsStatus: 'pendente',
  },
  unit: {
    type: 'apartamento',
    unitNumber: 'Apartamento 103',
    position: 'Unidade lateral — sem varanda',
    bedrooms: 2,
    suites: 1,
    hasGourmetBalcony: false,
    carParkingSpaces: 0,
    motorcycleParkingSpaces: 0,
  },
  principalAmount: 200000.00,
  agreedOrEstimatedInterest: 10000.00,
  totalContractedAmount: 210000.00,
  rules: {
    finePercent: 2.0,
    monthlyInterestRate: 1.0,
    hasEstimatedInterest: false,
    customInterestAgreement: 'Juros convencionados de R$ 10.000,00 já incluídos no total contratado (R$ 200.000,00 base + R$ 10.000,00 juros = R$ 210.000,00 total). Não acrescentar outros juros remuneratórios ao cronograma.',
  },
  specialRulesDescription: [
    'Zana Toledo — Apartamento 103 — lateral, sem varanda — R$ 210.000,00.',
    'Entradas: R$ 20.000,00 (R$ 10.000,00 em 05/11/2026 e R$ 10.000,00 em 17/11/2026).',
    '5 parcelas de R$ 10.000,00: R$ 50.000,00 (Dez/2026 a Abr/2027, dia 20).',
    '28 parcelas de R$ 5.000,00: R$ 140.000,00 (Mai/2027 a Ago/2029, dia 20).',
    'Valor Base: R$ 200.000,00 + Juros Convencionados: R$ 10.000,00 = Total R$ 210.000,00.',
    'Inicialmente todas as parcelas permanecem como PENDENTE.',
    'Multa moratória: 2% e juros de mora: 1% ao mês, pro rata die.',
  ],
  installments: op01Installments,
  status: 'ativo',
};

// --------------------------------------------------------------------------------
// OPERAÇÃO 02 — JENNIFER DOS SANTOS ALVES
// --------------------------------------------------------------------------------
const op02Installments: Installment[] = [
  {
    id: 'EW-02-parc-1',
    contractId: 'ew-ctr-02',
    order: 1,
    description: 'Entrada',
    dueDate: '2026-11-03',
    nominalAmount: 20000.00,
    type: 'entrada',
  },
  {
    id: 'EW-02-parc-2',
    contractId: 'ew-ctr-02',
    order: 2,
    description: 'Mensal 01/22',
    dueDate: '2026-12-10',
    nominalAmount: 6000.00,
    type: 'mensal',
  },
  {
    id: 'EW-02-parc-3',
    contractId: 'ew-ctr-02',
    order: 3,
    description: 'Mensal 02/22',
    dueDate: '2027-01-10',
    nominalAmount: 6000.00,
    type: 'mensal',
  },
  {
    id: 'EW-02-parc-4',
    contractId: 'ew-ctr-02',
    order: 4,
    description: 'Mensal 03/22',
    dueDate: '2027-02-10',
    nominalAmount: 6000.00,
    type: 'mensal',
  },
  {
    id: 'EW-02-parc-5',
    contractId: 'ew-ctr-02',
    order: 5,
    description: 'Mensal + Complemento (Março/2027)',
    dueDate: '2027-03-10',
    nominalAmount: 56000.00,
    type: 'complemento',
    isCombined: true,
    notes: 'Obrigação única consolidada: contém R$ 6.000,00 da mensalidade + R$ 50.000,00 de complemento contratual.',
  },
  // 7 mensais: Abr/2027 a Out/2027, dia 10 (R$ 6.000,00 cada)
  ...generateMonthlyInstallments(
    'ew-ctr-02',
    6,
    2027,
    4,
    10,
    7,
    6000.00,
    'Mensal'
  ),
  {
    id: 'EW-02-parc-13',
    contractId: 'ew-ctr-02',
    order: 13,
    description: 'Mensal + Intermediária (Novembro/2027)',
    dueDate: '2027-11-10',
    nominalAmount: 57500.00,
    type: 'intermediaria',
    isCombined: true,
    notes: 'Obrigação única consolidada: contempla mensalidade e parcela intermediária de Nov/2027.',
  },
  // 11 mensais: Dez/2027 a Out/2028, dia 10 (R$ 6.000,00 cada)
  ...generateMonthlyInstallments(
    'ew-ctr-02',
    14,
    2027,
    12,
    10,
    11,
    6000.00,
    'Mensal'
  ),
  {
    id: 'EW-02-parc-25',
    contractId: 'ew-ctr-02',
    order: 25,
    description: 'Intermediária (Novembro/2028)',
    dueDate: '2028-11-10',
    nominalAmount: 51500.00,
    type: 'intermediaria',
  },
  {
    id: 'EW-02-parc-26',
    contractId: 'ew-ctr-02',
    order: 26,
    description: 'Mensal 23/24',
    dueDate: '2028-12-10',
    nominalAmount: 4500.00,
    type: 'mensal',
  },
  {
    id: 'EW-02-parc-27',
    contractId: 'ew-ctr-02',
    order: 27,
    description: 'Mensal 24/24',
    dueDate: '2029-01-10',
    nominalAmount: 4500.00,
    type: 'mensal',
  },
  {
    id: 'EW-02-parc-28',
    contractId: 'ew-ctr-02',
    order: 28,
    description: 'Parcela Final 01/03',
    dueDate: '2029-02-10',
    nominalAmount: 4072.48,
    type: 'final',
  },
  {
    id: 'EW-02-parc-29',
    contractId: 'ew-ctr-02',
    order: 29,
    description: 'Parcela Final 02/03',
    dueDate: '2029-03-10',
    nominalAmount: 4072.48,
    type: 'final',
  },
  {
    id: 'EW-02-parc-30',
    contractId: 'ew-ctr-02',
    order: 30,
    description: 'Parcela Final 03/03',
    dueDate: '2029-04-10',
    nominalAmount: 4072.48,
    type: 'final',
  },
];

export const CONTRACT_02: Contract = {
  id: 'ew-ctr-02',
  code: 'EW-CTR-2026-0301',
  operationNumber: 'OPERAÇÃO 02',
  buyer: {
    name: 'Jennifer dos Santos Alves',
    cpf: '144.240.717-40',
    rg: '144.240.717-40',
    birthDate: '1992-02-15',
    maritalStatus: 'Solteira',
    profession: 'Comissária de bordo',
    personalDocsStatus: 'completo',
  },
  unit: {
    type: 'apartamento',
    unitNumber: 'Apartamento 301',
    position: 'De frente com varanda gourmet',
    bedrooms: 2,
    suites: 1,
    hasGourmetBalcony: true,
    carParkingSpaces: 0,
    motorcycleParkingSpaces: 0,
  },
  principalAmount: 320000.00,
  agreedOrEstimatedInterest: 12217.44,
  totalContractedAmount: 332217.44,
  rules: {
    finePercent: 2.0,
    monthlyInterestRate: 1.0,
    hasEstimatedInterest: true,
    requiresReviewBeforeSigning: true,
    estimatedInterestNote: 'ATENÇÃO: o contrato informa expressamente que os juros de R$ 12.217,44 são estimados e que o cronograma deverá ser conferido pelas partes antes da assinatura definitiva. Não alterar valores automaticamente.',
  },
  specialRulesDescription: [
    'A obrigação de R$ 56.000,00 de 10/03/2027 contém R$ 6.000,00 de mensalidade + R$ 50.000,00 de complemento.',
    'A obrigação de R$ 57.500,00 de 10/11/2027 já contempla mensalidade e parcela intermediária.',
    'Essas obrigações combinadas estão cadastradas uma única vez cada, sem duplicidade.',
    'Juros remuneratórios estimados de R$ 12.217,44 sujeitos à conferência prévia das partes.',
    'Multa moratória contratual: 2%.',
    'Juros de mora: 1% ao mês, pro rata die.',
  ],
  installments: op02Installments,
  status: 'ativo',
};

// --------------------------------------------------------------------------------
// OPERAÇÃO 03 — CARLA VITÓRIA MARQUES CASTRO
// --------------------------------------------------------------------------------
const op03Installments: Installment[] = [
  {
    id: 'EW-03-parc-1',
    contractId: 'ew-ctr-03',
    order: 1,
    description: 'Primeira entrada',
    dueDate: '2026-11-03',
    nominalAmount: 70000.00,
    type: 'entrada',
  },
  {
    id: 'EW-03-parc-2',
    contractId: 'ew-ctr-03',
    order: 2,
    description: 'Segunda entrada',
    dueDate: '2026-12-03',
    nominalAmount: 70000.00,
    type: 'entrada',
  },
  // 24 parcelas mensais: Jan/2027 a Dez/2028, dia 15 (R$ 8.000,00 cada)
  ...generateMonthlyInstallments(
    'ew-ctr-03',
    3,
    2027,
    1,
    15,
    24,
    8000.00,
    'Mensal'
  ),
  // Intermediárias
  {
    id: 'EW-03-parc-27',
    contractId: 'ew-ctr-03',
    order: 27,
    description: 'Intermediária 1',
    dueDate: '2027-08-20',
    nominalAmount: 25000.00,
    type: 'intermediaria',
  },
  {
    id: 'EW-03-parc-28',
    contractId: 'ew-ctr-03',
    order: 28,
    description: 'Intermediária 2',
    dueDate: '2028-04-20',
    nominalAmount: 25000.00,
    type: 'intermediaria',
  },
  {
    id: 'EW-03-parc-29',
    contractId: 'ew-ctr-03',
    order: 29,
    description: 'Intermediária 3',
    dueDate: '2028-12-20',
    nominalAmount: 25000.00,
    type: 'intermediaria',
  },
  // Complementos finais
  {
    id: 'EW-03-parc-30',
    contractId: 'ew-ctr-03',
    order: 30,
    description: 'Complemento final 1',
    dueDate: '2029-01-15',
    nominalAmount: 8333.33,
    type: 'complemento',
  },
  {
    id: 'EW-03-parc-31',
    contractId: 'ew-ctr-03',
    order: 31,
    description: 'Complemento final 2',
    dueDate: '2029-02-15',
    nominalAmount: 8333.33,
    type: 'complemento',
  },
  {
    id: 'EW-03-parc-32',
    contractId: 'ew-ctr-03',
    order: 32,
    description: 'Complemento final 3',
    dueDate: '2029-03-15',
    nominalAmount: 8333.34,
    type: 'complemento',
  },
];

export const CONTRACT_03: Contract = {
  id: 'ew-ctr-03',
  code: 'EW-CTR-2026-COB01',
  operationNumber: 'OPERAÇÃO 03',
  buyer: {
    name: 'Carla Vitória Marques Castro',
    cpf: '069.207.962-95',
    rg: '8760234',
    maritalStatus: 'Solteira',
    profession: 'Autônoma',
    personalDocsStatus: 'completo',
  },
  unit: {
    type: 'cobertura',
    unitNumber: 'Cobertura 01',
    position: 'Cobertura com varandão gourmet',
    bedrooms: 2,
    suites: 1,
    livingRooms: 1,
    kitchens: 1,
    bathroomsOrLavabo: 'Lavabo social e banheiros',
    hasGourmetBalcony: true,
    carParkingSpaces: 1,
    motorcycleParkingSpaces: 1,
  },
  principalAmount: 420000.00,
  agreedOrEstimatedInterest: 12000.00,
  totalContractedAmount: 432000.00,
  rules: {
    finePercent: 2.0,
    monthlyInterestRate: 1.0,
    hasEstimatedInterest: false,
    customInterestAgreement: 'Juros remuneratórios convencionados de R$ 12.000,00 inclusos no preço (R$ 420.000,00 principal + R$ 12.000,00 juros convencionados = R$ 432.000,00 total).',
  },
  specialRulesDescription: [
    'Valor Principal da Cobertura: R$ 420.000,00.',
    'Juros Convencionados: R$ 12.000,00.',
    'Valor Total Contratado: R$ 432.000,00.',
    'Entradas: R$ 140.000,00 (2x R$ 70.000,00).',
    '24 mensais: R$ 192.000,00 (24x R$ 8.000,00).',
    '3 intermediárias: R$ 75.000,00 (3x R$ 25.000,00).',
    'Complemento final em 3 parcelas totalizando R$ 25.000,00.',
    'Juros remuneratórios já inclusos no total contratado.',
    'Multa moratória: 2%.',
    'Juros de mora: 1% ao mês, pro rata die.',
    'Unidade contempla 1 vaga de automóvel e espaço exclusivo para guarda de motocicleta.',
  ],
  installments: op03Installments,
  status: 'ativo',
};

// --------------------------------------------------------------------------------
// OPERAÇÃO 04 — JOYCE DOS SANTOS ALVES TOLEDO E WAGNER DE SOUZA TOLEDO
// --------------------------------------------------------------------------------
const op04Installments: Installment[] = [
  {
    id: 'EW-04-parc-1',
    contractId: 'ew-ctr-04',
    order: 1,
    description: 'Primeira entrada',
    dueDate: '2026-11-03',
    nominalAmount: 35000.00,
    type: 'entrada',
  },
  {
    id: 'EW-04-parc-2',
    contractId: 'ew-ctr-04',
    order: 2,
    description: 'Segunda entrada',
    dueDate: '2026-11-17',
    nominalAmount: 15000.00,
    type: 'entrada',
  },
  {
    id: 'EW-04-parc-3',
    contractId: 'ew-ctr-04',
    order: 3,
    description: 'Terceira entrada',
    dueDate: '2026-12-03',
    nominalAmount: 25000.00,
    type: 'entrada',
  },
  {
    id: 'EW-04-parc-4',
    contractId: 'ew-ctr-04',
    order: 4,
    description: 'Quarta entrada',
    dueDate: '2026-12-28',
    nominalAmount: 25000.00,
    type: 'entrada',
  },
  // 33 parcelas mensais: Jan/2027 a Set/2029, dia 10 (R$ 10.000,00 cada)
  ...generateMonthlyInstallments(
    'ew-ctr-04',
    5,
    2027,
    1,
    10,
    33,
    10000.00,
    'Mensal'
  ),
  {
    id: 'EW-04-parc-38',
    contractId: 'ew-ctr-04',
    order: 38,
    description: 'Parcela final',
    dueDate: '2029-10-10',
    nominalAmount: 5000.00,
    type: 'final',
  },
];

export const CONTRACT_04: Contract = {
  id: 'ew-ctr-04',
  code: 'EW-CTR-2026-COB04',
  operationNumber: 'OPERAÇÃO 04',
  buyer: {
    name: 'Joyce dos Santos Alves Toledo e Wagner de Souza Toledo',
    cpf: 'Joyce: 144.240.697-61 / Wagner: 103.525.937-09',
    maritalStatus: 'Casados',
    profession: 'Compradores associados',
    personalDocsStatus: 'completo',
    coBuyer: {
      name: 'Wagner de Souza Toledo',
      cpf: '103.525.937-09',
    },
  },
  unit: {
    type: 'cobertura',
    unitNumber: 'Cobertura 04',
    position: 'Cobertura com varandão gourmet',
    bedrooms: 2,
    suites: 1,
    livingRooms: 1,
    kitchens: 1,
    bathroomsOrLavabo: 'Lavabo social e banheiros',
    hasGourmetBalcony: true,
    carParkingSpaces: 1,
    motorcycleParkingSpaces: 0,
  },
  principalAmount: 420000.00,
  agreedOrEstimatedInterest: 15000.00,
  totalContractedAmount: 435000.00,
  rules: {
    finePercent: 2.0,
    monthlyInterestRate: 1.0,
    hasEstimatedInterest: false,
    customInterestAgreement: 'Juros remuneratórios convencionados de R$ 15.000,00 inclusos no preço (R$ 420.000,00 principal + R$ 15.000,00 juros convencionados = R$ 435.000,00 total).',
  },
  specialRulesDescription: [
    'Valor Principal da Cobertura: R$ 420.000,00.',
    'Juros Convencionados: R$ 15.000,00.',
    'Valor Total Contratado: R$ 435.000,00.',
    'Entradas: R$ 100.000,00 distribuídas em 4 aportes (R$ 35k, R$ 15k, R$ 25k e R$ 25k).',
    '33 mensais: R$ 330.000,00 (33x R$ 10.000,00).',
    'Parcela final: R$ 5.000,00 com vencimento em 10/10/2029.',
    'Juros remuneratórios já inclusos no total contratado.',
    'Multa moratória: 2%.',
    'Juros de mora: 1% ao mês, pro rata die.',
    'Unidade contempla 1 vaga de automóvel (sem vaga destinada à guarda de motocicleta).',
  ],
  installments: op04Installments,
  status: 'ativo',
};

export const INITIAL_CONTRACTS: Contract[] = [
  CONTRACT_01,
  CONTRACT_02,
  CONTRACT_03,
  CONTRACT_04,
];

// Metas e totais consolidados de referência oficial
export const CONSOLIDATED_TARGETS = {
  buildingName: 'PRÉDIO EW',
  registeredContractsCount: 4,
  commercializedUnitsCount: 4,
  totalContractedAmount: 1409217.44, // 210k (Zana) + 332.217,44 (Jennifer) + 432k (Carla) + 435k (Joyce & Wagner)
  totalPrincipalAmount: 1360000.00, // 200k (Zana) + 320k (Jennifer) + 420k (Carla) + 420k (Joyce)
  descriptivePrincipalReference: 1360000.00,
  contractedOrEstimatedInterest: 49217.44, // 10k (Zana) + 12.217,44 (Jennifer) + 12k (Carla) + 15k (Joyce & Wagner)
  initialConfirmedReceipts: 0.00,
  initialContractBalance: 1409217.44,
};
