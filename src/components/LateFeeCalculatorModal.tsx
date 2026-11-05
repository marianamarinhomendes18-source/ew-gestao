import React, { useState } from 'react';
import { 
  Calculator, 
  Calendar, 
  DollarSign, 
  Percent, 
  Clock, 
  CheckCircle2, 
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { Contract } from '../types';
import { formatCurrency, formatDateBR, calculateContractCharges } from '../utils/formatters';

interface LateFeeCalculatorModalProps {
  contracts: Contract[];
}

export const LateFeeCalculatorModal: React.FC<LateFeeCalculatorModalProps> = ({
  contracts,
}) => {
  const [selectedContractId, setSelectedContractId] = useState<string>(contracts[0]?.id || '');
  const [selectedInstallmentId, setSelectedInstallmentId] = useState<string>('');
  const [customNominalAmount, setCustomNominalAmount] = useState<number>(5000);
  const [dueDate, setDueDate] = useState<string>('2026-11-03');
  const [simulatedPaymentDate, setSimulatedPaymentDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );

  const selectedContract = contracts.find((c) => c.id === selectedContractId) || contracts[0];

  const handleContractChange = (cId: string) => {
    setSelectedContractId(cId);
    setSelectedInstallmentId('');
  };

  const handleInstallmentSelect = (instId: string) => {
    setSelectedInstallmentId(instId);
    const inst = selectedContract?.installments.find((i) => i.id === instId);
    if (inst) {
      setCustomNominalAmount(inst.nominalAmount);
      setDueDate(inst.dueDate);
    }
  };

  const calculation = calculateContractCharges(
    customNominalAmount,
    dueDate,
    simulatedPaymentDate,
    selectedContract?.rules.finePercent || 2.0,
    selectedContract?.rules.monthlyInterestRate || 1.0
  );

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-extrabold text-blue-950 tracking-tight">
            Juros, Multas & Atualização Contratual
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Simulador oficial com multa moratória de 2% e juros de mora de 1% ao mês pro rata die.
          </p>
        </div>

        <div className="text-xs text-blue-900 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg font-bold">
          Cláusula Padrão: Multa 2.00% • Juros 1.00% a.m. pro rata die
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Col: Inputs */}
        <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl p-6 space-y-4 shadow-xs">
          <div className="text-sm font-bold text-blue-950 border-b border-slate-100 pb-2">
            Parâmetros da Obrigação
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Contrato / Comprador
            </label>
            <select
              value={selectedContractId}
              onChange={(e) => handleContractChange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs font-medium focus:outline-none focus:border-blue-700"
            >
              {contracts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.operationNumber} — {c.unit.unitNumber} ({c.buyer.name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Selecionar Parcela Existente (Opcional)
            </label>
            <select
              value={selectedInstallmentId}
              onChange={(e) => handleInstallmentSelect(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs font-medium focus:outline-none focus:border-blue-700"
            >
              <option value="">Digitar valores manualmente...</option>
              {selectedContract?.installments.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  #{inst.order} · {inst.description} — {formatDateBR(inst.dueDate)} ({formatCurrency(inst.nominalAmount)})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Valor Nominal (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={customNominalAmount}
                onChange={(e) => setCustomNominalAmount(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold text-xs focus:outline-none focus:border-blue-700"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Vencimento
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono text-xs focus:outline-none focus:border-blue-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-blue-900 mb-1">
              Data da Simulação de Pagamento
            </label>
            <input
              type="date"
              value={simulatedPaymentDate}
              onChange={(e) => setSimulatedPaymentDate(e.target.value)}
              className="w-full bg-blue-50 border border-blue-300 rounded-xl px-3 py-2 text-blue-950 font-mono font-bold text-xs focus:outline-none focus:border-blue-700"
            />
          </div>

          <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
            Regra Contratual PRÉDIO EW:
            <ul className="mt-1 space-y-0.5 text-slate-700 font-medium list-disc list-inside">
              <li>Multa moratória: 2,00%</li>
              <li>Juros de mora: 1,00% ao mês pro rata die (0,0333%/dia)</li>
            </ul>
          </div>
        </div>

        {/* Right Col: Mathematical Breakdown */}
        <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-2xl p-6 space-y-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-extrabold text-blue-950 uppercase tracking-wide">
              Demonstrativo de Atualização
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              {formatDateBR(dueDate)} → {formatDateBR(simulatedPaymentDate)}
            </span>
          </div>

          {/* Big Total Box */}
          <div className="bg-gradient-to-r from-blue-950 to-blue-900 rounded-2xl p-6 text-white shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-sky-200 block mb-1">
                Valor Total Atualizado
              </span>
              <div className="text-3xl font-black font-mono-numbers text-white">
                {formatCurrency(calculation.totalUpdatedAmount)}
              </div>
              <div className="text-xs text-sky-200 mt-1">
                {calculation.daysOverdue > 0 ? (
                  <span className="text-rose-300 font-bold">
                    {calculation.daysOverdue} dias de atraso acumulados
                  </span>
                ) : (
                  <span className="text-emerald-300 font-bold">
                    Pagamento tempestivo (sem encargos)
                  </span>
                )}
              </div>
            </div>

            <div className="text-right text-xs bg-white/10 p-3 rounded-xl border border-white/10 text-sky-100">
              <div>Valor Original: <strong className="text-white">{formatCurrency(calculation.nominalAmount)}</strong></div>
              <div className="text-rose-200 mt-0.5 font-bold">+ Encargos: {formatCurrency(calculation.fineAmount + calculation.interestAmount)}</div>
            </div>
          </div>

          {/* Step breakdown */}
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <strong className="text-slate-900 block">1. Valor Nominal</strong>
                <span className="text-slate-500">Importância principal devida</span>
              </div>
              <div className="font-mono-numbers font-bold text-slate-900 text-sm">
                {formatCurrency(calculation.nominalAmount)}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <strong className="text-slate-900 block">2. Multa Moratória (2,00%)</strong>
                <span className="text-slate-500">2% sobre {formatCurrency(calculation.nominalAmount)}</span>
              </div>
              <div className="font-mono-numbers font-bold text-rose-600 text-sm">
                + {formatCurrency(calculation.fineAmount)}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <strong className="text-slate-900 block">3. Juros de Mora (1,00% a.m. pro rata die)</strong>
                <span className="text-slate-500">{calculation.daysOverdue} dias x 0,0333%/dia</span>
              </div>
              <div className="font-mono-numbers font-bold text-rose-600 text-sm">
                + {formatCurrency(calculation.interestAmount)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
