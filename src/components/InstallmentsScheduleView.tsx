import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ArrowUpDown,
  Download,
  RotateCcw,
  Edit3,
  LayoutList,
  Table as TableIcon
} from 'lucide-react';
import { Contract, Installment } from '../types';
import { formatCurrency, formatDateBR, calculateDaysOverdue } from '../utils/formatters';

interface InstallmentsScheduleViewProps {
  contracts: Contract[];
  onOpenPaymentModal: (installment: Installment, contract: Contract) => void;
  onReversePayment: (installmentId: string, contractId: string) => void;
  onExportCSV: () => void;
}

export const InstallmentsScheduleView: React.FC<InstallmentsScheduleViewProps> = ({
  contracts,
  onOpenPaymentModal,
  onReversePayment,
  onExportCSV,
}) => {
  const [selectedContractId, setSelectedContractId] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'overdue' | 'paid'>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const allInstallments = useMemo(() => {
    const list: { inst: Installment; contract: Contract }[] = [];
    contracts.forEach((contract) => {
      contract.installments.forEach((inst) => {
        list.push({ inst, contract });
      });
    });
    return list;
  }, [contracts]);

  const filteredList = useMemo(() => {
    return allInstallments.filter(({ inst, contract }) => {
      if (selectedContractId !== 'all' && contract.id !== selectedContractId) {
        return false;
      }
      if (selectedYear !== 'all' && !inst.dueDate.startsWith(selectedYear)) {
        return false;
      }
      if (selectedType !== 'all') {
        if (selectedType === 'entrada' && !['sinal', 'entrada'].includes(inst.type)) return false;
        if (selectedType === 'mensal' && inst.type !== 'mensal') return false;
        if (selectedType === 'intermediaria' && inst.type !== 'intermediaria') return false;
        if (selectedType === 'final' && !['final', 'complemento'].includes(inst.type)) return false;
      }

      const isPaid = !!inst.paidDate;
      const days = calculateDaysOverdue(inst.dueDate);
      const isOverdue = !isPaid && days > 0;

      if (selectedStatus === 'paid' && !isPaid) return false;
      if (selectedStatus === 'pending' && (isPaid || isOverdue)) return false;
      if (selectedStatus === 'overdue' && (!isOverdue || isPaid)) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesBuyer = contract.buyer.name.toLowerCase().includes(q);
        const matchesUnit = contract.unit.unitNumber.toLowerCase().includes(q);
        const matchesDesc = inst.description.toLowerCase().includes(q);
        const matchesDate = inst.dueDate.includes(q);
        const matchesCode = contract.code.toLowerCase().includes(q);
        return matchesBuyer || matchesUnit || matchesDesc || matchesDate || matchesCode;
      }

      return true;
    }).sort((a, b) => {
      const cmp = a.inst.dueDate.localeCompare(b.inst.dueDate);
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }, [allInstallments, selectedContractId, selectedYear, selectedStatus, selectedType, searchQuery, sortOrder]);

  const totalFilteredNominal = filteredList.reduce((acc, { inst }) => acc + inst.nominalAmount, 0);
  const totalFilteredPaid = filteredList.reduce((acc, { inst }) => acc + (inst.paidAmount || 0), 0);
  const totalFilteredBalance = totalFilteredNominal - totalFilteredPaid;

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-extrabold text-blue-950 tracking-tight">
            Controle de Pagamentos & Cronograma Global
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Programação unificada de todas as 136 obrigações contratuais do PRÉDIO EW.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Segmented Controls [Cards] [Tabela] */}
          <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1 rounded-md flex items-center gap-1 transition-all ${
                viewMode === 'cards'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded-md flex items-center gap-1 transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Tabela</span>
            </button>
          </div>

          <button
            onClick={onExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-lg border border-slate-300 transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-blue-900" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 space-y-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar comprador, unidade..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-700"
            />
          </div>

          {/* Por Comprador */}
          <div>
            <select
              value={selectedContractId}
              onChange={(e) => setSelectedContractId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-blue-700"
            >
              <option value="all">Todos os Compradores (4)</option>
              {contracts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.unit.unitNumber} — {c.buyer.name}
                </option>
              ))}
            </select>
          </div>

          {/* Por Ano */}
          <div>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-blue-700"
            >
              <option value="all">Todos os Anos (2026-2029)</option>
              <option value="2026">Ano 2026 (Início)</option>
              <option value="2027">Ano 2027</option>
              <option value="2028">Ano 2028</option>
              <option value="2029">Ano 2029 (Conclusão)</option>
            </select>
          </div>

          {/* Por Tipo */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-blue-700"
            >
              <option value="all">Todos os Tipos de Parcela</option>
              <option value="entrada">Sinais e Entradas</option>
              <option value="mensal">Parcelas Mensais</option>
              <option value="intermediaria">Intermediárias</option>
              <option value="final">Complementos e Finais</option>
            </select>
          </div>

          {/* Por Status */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-blue-700"
            >
              <option value="all">Todos os Status</option>
              <option value="pending">A Vencer / Em Dia</option>
              <option value="overdue">Em Atraso</option>
              <option value="paid">Recebidas / Pagas</option>
            </select>
          </div>
        </div>

        {/* Totais do filtro */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-3">
          <div className="flex items-center gap-3">
            <span>
              Listando <strong className="text-slate-900 font-mono-numbers">{filteredList.length}</strong> parcelas
            </span>
            <span>•</span>
            <span>
              Nominal: <strong className="text-blue-950 font-mono-numbers">{formatCurrency(totalFilteredNominal)}</strong>
            </span>
            <span>•</span>
            <span>
              Recebido: <strong className="text-emerald-600 font-mono-numbers">{formatCurrency(totalFilteredPaid)}</strong>
            </span>
            <span>•</span>
            <span>
              A Receber: <strong className="text-sky-700 font-mono-numbers">{formatCurrency(totalFilteredBalance)}</strong>
            </span>
          </div>

          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="flex items-center gap-1 text-slate-700 hover:text-blue-900 font-semibold"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>Ordenar Vencimento ({sortOrder === 'asc' ? 'Crescente' : 'Decrescente'})</span>
          </button>
        </div>
      </div>

      {/* View Mode: Cards (Ideal para Celular) */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredList.map(({ inst, contract }) => {
            const isPaid = !!inst.paidDate;
            const daysOverdue = calculateDaysOverdue(inst.dueDate);
            const isOverdue = !isPaid && daysOverdue > 0;

            return (
              <div 
                key={inst.id}
                className={`bg-white border rounded-xl p-4 shadow-2xs transition-all flex flex-col justify-between ${
                  isPaid 
                    ? 'border-emerald-200 bg-emerald-50/20' 
                    : isOverdue 
                      ? 'border-rose-200 bg-rose-50/20' 
                      : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  {/* Top Bar: Unit, Buyer, Status */}
                  <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-blue-950 text-xs">
                          {contract.unit.unitNumber}
                        </span>
                        <span className="text-[10px] text-slate-400">•</span>
                        <span className="text-xs font-semibold text-slate-700">
                          {contract.buyer.name}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                        {contract.code}
                      </div>
                    </div>

                    <div>
                      {isPaid ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-0.5">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Paga
                        </span>
                      ) : isOverdue ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 flex items-center gap-0.5">
                          <AlertCircle className="w-3 h-3 text-rose-600" />
                          Atrasada ({daysOverdue}d)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-0.5">
                          <Clock className="w-3 h-3 text-amber-600" />
                          Pendente
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Description & Amounts */}
                  <div className="py-2.5">
                    <div className="text-xs font-bold text-slate-900">
                      {inst.description}
                    </div>
                    {inst.notes && (
                      <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1 italic">
                        {inst.notes}
                      </div>
                    )}

                    <div className="mt-2.5 flex items-baseline justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Valor Original</span>
                        <span className="text-base font-black text-slate-900 font-mono-numbers">
                          {formatCurrency(inst.nominalAmount)}
                        </span>
                      </div>

                      {inst.paidAmount !== undefined && (
                        <div className="text-right">
                          <span className="text-[10px] text-emerald-600 uppercase font-semibold block">Valor Pago</span>
                          <span className="text-sm font-bold text-emerald-600 font-mono-numbers">
                            {formatCurrency(inst.paidAmount)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer: Date & Actions */}
                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-slate-600 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Venc: <strong className="text-slate-900 font-mono-numbers">{formatDateBR(inst.dueDate)}</strong></span>
                  </div>

                  <div>
                    {isPaid ? (
                      <button
                        onClick={() => onReversePayment(inst.id, contract.id)}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                        title="Estornar baixa"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Estornar</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onOpenPaymentModal(inst, contract)}
                        className="flex items-center gap-1 px-3 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors active:scale-95"
                        title="Dar baixa / Lançar comprovante"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Baixa</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* View Mode: Main Table */
        <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Vencimento</th>
                  <th className="px-4 py-3">Unidade / Comprador</th>
                  <th className="px-4 py-3">Descrição da Parcela</th>
                  <th className="px-4 py-3 text-right">Valor Original</th>
                  <th className="px-4 py-3 text-right">Valor Pago</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3">Data Baixa</th>
                  <th className="px-4 py-3">Comprovante</th>
                  <th className="px-4 py-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredList.map(({ inst, contract }) => {
                  const isPaid = !!inst.paidDate;
                  const daysOverdue = calculateDaysOverdue(inst.dueDate);
                  const isOverdue = !isPaid && daysOverdue > 0;

                  return (
                    <tr key={inst.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 font-mono-numbers font-semibold text-slate-800">
                        {formatDateBR(inst.dueDate)}
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{contract.unit.unitNumber}</div>
                        <div className="text-[11px] text-slate-500">{contract.buyer.name}</div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">{inst.description}</div>
                        {inst.notes && (
                          <div className="text-[11px] text-slate-500 line-clamp-1">{inst.notes}</div>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right font-mono-numbers font-black text-slate-900 text-sm">
                        {formatCurrency(inst.nominalAmount)}
                      </td>

                      <td className="px-4 py-3 text-right font-mono-numbers font-black text-emerald-600 text-sm">
                        {inst.paidAmount !== undefined ? formatCurrency(inst.paidAmount) : '—'}
                      </td>

                      <td className="px-4 py-3 text-center">
                        {isPaid ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                            Paga
                          </span>
                        ) : isOverdue ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
                            Atrasada ({daysOverdue}d)
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                            Pendente
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 font-mono-numbers text-slate-600">
                        {inst.paidDate ? formatDateBR(inst.paidDate) : '—'}
                      </td>

                      <td className="px-4 py-3 font-mono text-slate-600">
                        {inst.receiptNumber || '—'}
                      </td>

                      <td className="px-4 py-3 text-center">
                        {isPaid ? (
                          <button
                            onClick={() => onReversePayment(inst.id, contract.id)}
                            title="Estornar baixa"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => onOpenPaymentModal(inst, contract)}
                            title="Dar baixa / Lançar comprovante"
                            className="px-2.5 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors whitespace-nowrap"
                          >
                            Baixa
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
