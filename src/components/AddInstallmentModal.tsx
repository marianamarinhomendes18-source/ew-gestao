import React, { useState } from 'react';
import { X, PlusCircle, Calendar, DollarSign, CheckCircle2 } from 'lucide-react';
import { Contract, Installment } from '../types';

interface AddInstallmentModalProps {
  contract: Contract | null;
  defaultType?: 'mensal' | 'intermediaria' | 'entrada' | 'final';
  onClose: () => void;
  onAddInstallment: (contractId: string, newInstallment: Installment) => void;
}

export const AddInstallmentModal: React.FC<AddInstallmentModalProps> = ({
  contract,
  defaultType = 'intermediaria',
  onClose,
  onAddInstallment,
}) => {
  if (!contract) return null;

  const [type, setType] = useState<'entrada' | 'mensal' | 'intermediaria' | 'final' | 'complemento'>(defaultType);
  const [description, setDescription] = useState(
    defaultType === 'intermediaria' ? 'Parcela Intermediária' : 'Mensalidade'
  );
  const [dueDate, setDueDate] = useState('2027-06-20');
  const [nominalAmount, setNominalAmount] = useState<number>(10000);
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!nominalAmount || nominalAmount <= 0) {
      setErrorMessage('Informe um valor nominal válido para a parcela.');
      return;
    }
    setErrorMessage(null);

    const nextOrder = contract.installments.length + 1;
    const newInst: Installment = {
      id: `${contract.id}-parc-manual-${Date.now().toString().slice(-4)}`,
      contractId: contract.id,
      order: nextOrder,
      description,
      dueDate,
      nominalAmount: Number(nominalAmount),
      type,
      notes: notes || undefined,
    };

    onAddInstallment(contract.id, newInst);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 no-print animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-sky-700 px-6 py-5 text-white flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded text-white">
              {contract.unit.unitNumber}
            </span>
            <h3 className="text-lg font-extrabold tracking-tight mt-1 text-white">
              Adicionar Nova Obrigação
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
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Tipo de Parcela
            </label>
            <select
              value={type}
              onChange={(e) => {
                const t = e.target.value as any;
                setType(t);
                if (t === 'intermediaria') setDescription('Parcela Intermediária');
                if (t === 'mensal') setDescription('Mensalidade');
                if (t === 'entrada') setDescription('Aporte de Entrada');
                if (t === 'final') setDescription('Parcela Final de Chaves');
              }}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-blue-700"
            >
              <option value="intermediaria">Intermediária / Balão</option>
              <option value="mensal">Mensalidade</option>
              <option value="entrada">Entrada Adicional</option>
              <option value="complemento">Complemento Contratual</option>
              <option value="final">Parcela Final</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Descrição / Título da Parcela *
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-blue-700"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
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
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Observações Contratuais (Opcional)
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Parcela vinculada à entrega da laje ou termo aditivo..."
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
              className="flex items-center gap-1.5 px-5 py-2 font-bold text-white bg-blue-950 hover:bg-blue-900 rounded-xl transition-colors shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Inserir no Cronograma</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
