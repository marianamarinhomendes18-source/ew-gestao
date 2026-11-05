import React, { useState, useEffect } from 'react';
import { X, Edit3, Calendar, DollarSign, CheckCircle2, RotateCcw } from 'lucide-react';
import { Contract, Installment } from '../types';

interface EditInstallmentModalProps {
  contract: Contract | null;
  installment: Installment | null;
  onClose: () => void;
  onSaveInstallment: (contractId: string, updatedInstallment: Installment) => void;
}

export const EditInstallmentModal: React.FC<EditInstallmentModalProps> = ({
  contract,
  installment,
  onClose,
  onSaveInstallment,
}) => {
  if (!contract || !installment) return null;

  const [type, setType] = useState<Installment['type']>(installment.type);
  const [description, setDescription] = useState(installment.description);
  const [dueDate, setDueDate] = useState(installment.dueDate);
  const [nominalAmount, setNominalAmount] = useState<number>(installment.nominalAmount);
  const [notes, setNotes] = useState(installment.notes || '');
  const [paidAmount, setPaidAmount] = useState<number | undefined>(installment.paidAmount);
  const [paidDate, setPaidDate] = useState<string | undefined>(installment.paidDate);
  const [paymentMethod, setPaymentMethod] = useState<Installment['paymentMethod']>(installment.paymentMethod);
  const [receiptNumber, setReceiptNumber] = useState<string | undefined>(installment.receiptNumber);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (installment) {
      setType(installment.type);
      setDescription(installment.description);
      setDueDate(installment.dueDate);
      setNominalAmount(installment.nominalAmount);
      setNotes(installment.notes || '');
      setPaidAmount(installment.paidAmount);
      setPaidDate(installment.paidDate);
      setPaymentMethod(installment.paymentMethod);
      setReceiptNumber(installment.receiptNumber);
    }
  }, [installment]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nominalAmount || nominalAmount <= 0) {
      setErrorMessage('Informe um valor nominal válido para a parcela.');
      return;
    }
    setErrorMessage(null);

    const updatedInst: Installment = {
      ...installment,
      type,
      description,
      dueDate,
      nominalAmount: Number(nominalAmount),
      notes: notes.trim() ? notes : undefined,
      paidAmount: paidAmount !== undefined && paidAmount !== null && !isNaN(paidAmount) ? Number(paidAmount) : undefined,
      paidDate: paidDate?.trim() ? paidDate : undefined,
      paymentMethod: paymentMethod || undefined,
      receiptNumber: receiptNumber?.trim() ? receiptNumber : undefined,
    };

    onSaveInstallment(contract.id, updatedInst);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 no-print animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-sky-700 px-6 py-5 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded text-white">
                {contract.unit.unitNumber}
              </span>
              <span className="text-[10px] font-mono bg-blue-800 text-sky-200 px-2 py-0.5 rounded">
                {contract.buyer.name}
              </span>
            </div>
            <h3 className="text-lg font-extrabold tracking-tight mt-1 text-white flex items-center gap-1.5">
              <Edit3 className="w-4 h-4 text-amber-400" />
              Editar Parcela Contratual
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Tipo da Parcela *
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-blue-700"
              >
                <option value="sinal">Sinal de Negócio (Arras)</option>
                <option value="entrada">Entrada</option>
                <option value="mensal">Mensalidade</option>
                <option value="intermediaria">Intermediária / Balão</option>
                <option value="complemento">Complemento Contratual</option>
                <option value="final">Parcela Final / Chaves</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Data de Vencimento *
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-medium focus:outline-none focus:border-blue-700"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Título / Descrição da Parcela *
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-blue-700"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Valor Nominal (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={nominalAmount}
                onChange={(e) => setNominalAmount(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-black text-sm focus:outline-none focus:border-blue-700"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Valor Pago (R$) {installment.paidDate ? '(Quitado)' : '(Opcional)'}
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0,00"
                value={paidAmount !== undefined ? paidAmount : ''}
                onChange={(e) => {
                  const val = e.target.value === '' ? undefined : parseFloat(e.target.value);
                  setPaidAmount(val);
                }}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold text-sm focus:outline-none focus:border-blue-700"
              />
            </div>
          </div>

          {/* Dados de Pagamento se houver */}
          {(paidAmount !== undefined && paidAmount > 0) && (
            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3">
              <span className="text-[11px] font-bold text-emerald-800 uppercase block">
                Detalhes da Quitação
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Data Pagamento</label>
                  <input
                    type="date"
                    value={paidDate || ''}
                    onChange={(e) => setPaidDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Forma Pagto</label>
                  <select
                    value={paymentMethod || 'pix'}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-semibold"
                  >
                    <option value="pix">PIX</option>
                    <option value="ted">TED</option>
                    <option value="boleto">Boleto</option>
                    <option value="deposito">Depósito</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Nº Recibo / Doc</label>
                  <input
                    type="text"
                    value={receiptNumber || ''}
                    onChange={(e) => setReceiptNumber(e.target.value)}
                    placeholder="Ex: 0001/2026"
                    className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Observações / Notas da Parcela
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Reajuste acordado, desconto de antecipação..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-700"
            />
          </div>

          {errorMessage && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            {installment.paidDate && (
              <button
                type="button"
                onClick={() => {
                  setPaidAmount(undefined);
                  setPaidDate(undefined);
                  setPaymentMethod(undefined);
                  setReceiptNumber(undefined);
                }}
                className="text-[11px] font-bold text-rose-700 hover:text-rose-900 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Limpar Quitação</span>
              </button>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 font-bold text-white bg-blue-950 hover:bg-blue-900 rounded-xl transition-colors shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Salvar Alterações</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
