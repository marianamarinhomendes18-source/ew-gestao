import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  DollarSign, 
  Calendar, 
  FileText, 
  AlertCircle
} from 'lucide-react';
import { Contract, Installment } from '../types';
import { formatCurrency, formatDateBR, calculateContractCharges } from '../utils/formatters';

interface PaymentModalProps {
  installment: Installment | null;
  contract: Contract | null;
  onClose: () => void;
  onConfirmPayment: (
    installmentId: string,
    contractId: string,
    paymentData: {
      paidAmount: number;
      paidDate: string;
      paymentMethod: 'pix' | 'ted' | 'boleto' | 'deposito' | 'outro';
      receiptNumber: string;
      lateFeeApplied?: number;
      interestApplied?: number;
      discountApplied?: number;
      paymentProofNote?: string;
    }
  ) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  installment,
  contract,
  onClose,
  onConfirmPayment,
}) => {
  if (!installment || !contract) return null;

  const defaultDate = new Date().toISOString().slice(0, 10);
  const [paidDate, setPaidDate] = useState<string>(defaultDate);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'ted' | 'boleto' | 'deposito' | 'outro'>('pix');
  const [receiptNumber, setReceiptNumber] = useState<string>('');
  const [paymentProofNote, setPaymentProofNote] = useState<string>('');
  
  const [charges, setCharges] = useState(
    calculateContractCharges(installment.nominalAmount, installment.dueDate, defaultDate)
  );

  const [paidAmount, setPaidAmount] = useState<number>(installment.nominalAmount);
  const [applyLateFees, setApplyLateFees] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const calculated = calculateContractCharges(
      installment.nominalAmount,
      installment.dueDate,
      paidDate,
      contract.rules.finePercent,
      contract.rules.monthlyInterestRate
    );
    setCharges(calculated);

    if (applyLateFees && calculated.daysOverdue > 0) {
      setPaidAmount(calculated.totalUpdatedAmount);
    } else {
      setPaidAmount(installment.nominalAmount);
    }
  }, [paidDate, applyLateFees, installment, contract]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!paidAmount || paidAmount <= 0) {
      setErrorMessage('Por favor informe um valor válido para o recebimento.');
      return;
    }
    setErrorMessage(null);

    onConfirmPayment(installment.id, contract.id, {
      paidAmount: Number(paidAmount),
      paidDate,
      paymentMethod,
      receiptNumber: receiptNumber || `REC-${Date.now().toString().slice(-6)}`,
      lateFeeApplied: applyLateFees ? charges.fineAmount : 0,
      interestApplied: applyLateFees ? charges.interestAmount : 0,
      paymentProofNote: paymentProofNote || 'Pagamento confirmado e compensado.',
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 no-print">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-300">
        {/* Header with Blue Gradient */}
        <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-sky-700 px-6 py-5 text-white flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded text-white">
              Lançamento Oficial de Recebimento
            </span>
            <h3 className="text-lg font-extrabold tracking-tight mt-1 text-white">
              Baixa de Parcela · {contract.unit.unitNumber}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Summary Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5 text-slate-700">
            <div className="flex justify-between">
              <span className="text-slate-500">Comprador(a):</span>
              <strong className="text-slate-900">{contract.buyer.name}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Obrigação:</span>
              <span className="font-semibold text-slate-900">{installment.description}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Vencimento Contratual:</span>
              <span className="font-mono-numbers font-bold text-blue-950">{formatDateBR(installment.dueDate)}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-200">
              <span className="text-slate-700 font-bold">Valor Nominal:</span>
              <span className="font-mono-numbers font-black text-slate-950 text-sm">{formatCurrency(installment.nominalAmount)}</span>
            </div>
          </div>

          {/* Overdue alert if applicable */}
          {charges.daysOverdue > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl space-y-2 text-amber-900">
              <div className="flex items-center gap-1.5 font-bold text-amber-800">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Vencimento ultrapassado em {charges.daysOverdue} dias</span>
              </div>
              <div className="text-[11px] text-amber-800">
                Multa 2% ({formatCurrency(charges.fineAmount)}) + Juros 1% a.m. pro rata die ({formatCurrency(charges.interestAmount)}).
              </div>
              <label className="flex items-center gap-2 cursor-pointer pt-1 font-bold text-amber-900">
                <input
                  type="checkbox"
                  checked={applyLateFees}
                  onChange={(e) => setApplyLateFees(e.target.checked)}
                  className="rounded border-amber-400 text-blue-900 focus:ring-blue-900"
                />
                <span>Cobrar encargos moratórios (Total atualizado: {formatCurrency(charges.totalUpdatedAmount)})</span>
              </label>
            </div>
          )}

          {/* Inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Data do Recebimento
              </label>
              <input
                type="date"
                required
                value={paidDate}
                onChange={(e) => setPaidDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-blue-700"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Forma de Pagamento
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-blue-700"
              >
                <option value="pix">PIX</option>
                <option value="ted">TED / Transferência</option>
                <option value="boleto">Boleto Bancário</option>
                <option value="deposito">Depósito em Conta</option>
                <option value="outro">Outro / Cheque</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Valor Efetivamente Recebido (R$)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 font-bold text-slate-500">R$</span>
              <input
                type="number"
                step="0.01"
                required
                value={paidAmount}
                onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-slate-900 font-mono font-black text-sm focus:outline-none focus:border-blue-700"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Nº do Comprovante / Autenticação Bancária
            </label>
            <input
              type="text"
              placeholder="Ex: DOC 2026110301 ou Hash PIX"
              value={receiptNumber}
              onChange={(e) => setReceiptNumber(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-700"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Observações do Comprovante
            </label>
            <textarea
              rows={2}
              placeholder="Informações adicionais do lançamento..."
              value={paymentProofNote}
              onChange={(e) => setPaymentProofNote(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-700"
            />
          </div>

          {errorMessage && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirmar Baixa</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
