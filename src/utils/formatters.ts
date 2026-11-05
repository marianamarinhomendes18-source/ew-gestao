/**
 * Formata número em moeda brasileira BRL (R$ 1.234,56)
 */
export function formatCurrency(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) {
    return 'R$ 0,00';
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Converte data ISO (AAAA-MM-DD) para formato brasileiro DD/MM/AAAA
 */
export function formatDateBR(dateString: string | undefined | null): string {
  if (!dateString) return '-';
  const parts = dateString.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateString;
}

/**
 * Formata data e hora ISO para formato brasileiro DD/MM/AAAA HH:mm
 */
export function formatDateTimeBR(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

/**
 * Calcula quantidade de dias em atraso em relação a uma data de referência
 */
export function calculateDaysOverdue(dueDateStr: string, referenceDateStr?: string): number {
  const due = new Date(dueDateStr + 'T00:00:00');
  const ref = referenceDateStr ? new Date(referenceDateStr + 'T00:00:00') : new Date();
  
  // Zera horas para comparação puramente de calendário
  due.setHours(0, 0, 0, 0);
  ref.setHours(0, 0, 0, 0);
  
  const diffTime = ref.getTime() - due.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
}

/**
 * Calcula encargos de mora conforme regras contratuais do Prédio EW:
 * - Multa moratória: 2% sobre o valor nominal
 * - Juros de mora: 1% ao mês, pro rata die (1% / 30 dias = 0,03333% ao dia)
 */
export interface LateFeeCalculation {
  daysOverdue: number;
  nominalAmount: number;
  fineAmount: number; // 2%
  finePercent: number;
  dailyInterestRate: number; // 1% / 30
  interestAmount: number; // pro rata die
  totalUpdatedAmount: number;
}

export function calculateContractCharges(
  nominalAmount: number,
  dueDateStr: string,
  paymentDateStr?: string,
  finePercent: number = 2.0,
  monthlyInterestRate: number = 1.0
): LateFeeCalculation {
  const days = calculateDaysOverdue(dueDateStr, paymentDateStr);

  if (days <= 0) {
    return {
      daysOverdue: 0,
      nominalAmount,
      fineAmount: 0,
      finePercent,
      dailyInterestRate: monthlyInterestRate / 30,
      interestAmount: 0,
      totalUpdatedAmount: nominalAmount,
    };
  }

  // Multa de 2%
  const fineAmount = Number((nominalAmount * (finePercent / 100)).toFixed(2));
  
  // Juros de mora: 1% ao mês pro rata die (dias / 30 * 1%)
  const dailyRate = (monthlyInterestRate / 100) / 30;
  const interestAmount = Number((nominalAmount * dailyRate * days).toFixed(2));

  const totalUpdatedAmount = Number((nominalAmount + fineAmount + interestAmount).toFixed(2));

  return {
    daysOverdue: days,
    nominalAmount,
    fineAmount,
    finePercent,
    dailyInterestRate: Number((dailyRate * 100).toFixed(4)),
    interestAmount,
    totalUpdatedAmount,
  };
}
