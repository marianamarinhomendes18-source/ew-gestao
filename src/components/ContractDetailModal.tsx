import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  PlusCircle, 
  RotateCcw, 
  Edit3, 
  Trash2,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Layers,
  LayoutList,
  Table as TableIcon,
  FileCheck2
} from 'lucide-react';
import { Contract, Installment, PaymentReceipt } from '../types';
import { formatCurrency, formatDateBR, calculateDaysOverdue } from '../utils/formatters';
import { loadReceipts, createReceiptForPayment } from '../utils/storage';
import { EditInstallmentModal } from './EditInstallmentModal';
import { OfficialPaymentReceiptPrintView } from './OfficialPaymentReceiptPrintView';

interface ContractDetailModalProps {
  contract: Contract;
  onClose: () => void;
  onOpenPaymentModal: (installment: Installment, contract: Contract) => void;
  onReversePayment: (installmentId: string, contractId: string) => void;
  onPrintContractStatement: (contract: Contract) => void;
  onOpenAddInstallment: (contract: Contract, defaultType: 'mensal' | 'intermediaria') => void;
  onDeleteInstallment: (contractId: string, installmentId: string) => void;
  onEditInstallment: (contractId: string, updatedInstallment: Installment) => void;
}

export const ContractDetailModal: React.FC<ContractDetailModalProps> = ({
  contract,
  onClose,
  onOpenPaymentModal,
  onReversePayment,
  onPrintContractStatement,
  onOpenAddInstallment,
  onDeleteInstallment,
  onEditInstallment,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'pending' | 'paid'>('all');
  const [displayMode, setDisplayMode] = useState<'cards' | 'table'>('cards');
  const [deletingInstallment, setDeletingInstallment] = useState<Installment | null>(null);
  const [editingInstallment, setEditingInstallment] = useState<Installment | null>(null);
  const [activeReceiptForPrint, setActiveReceiptForPrint] = useState<PaymentReceipt | null>(null);

  // Financial calculations
  const totalReceived = contract.installments.reduce(
    (acc, i) => acc + (i.paidAmount || 0),
    0
  );
  const remainingBalance = contract.totalContractedAmount - totalReceived;
  const paidCount = contract.installments.filter((i) => !!i.paidDate).length;

  const filteredInstallments = contract.installments.filter((i) => {
    const isPaid = !!i.paidDate;
    if (filterType === 'pending' && isPaid) return false;
    if (filterType === 'paid' && !isPaid) return false;
    return true;
  });

  const confirmDelete = () => {
    if (deletingInstallment) {
      onDeleteInstallment(contract.id, deletingInstallment.id);
      setDeletingInstallment(null);
    }
  };

  const handleGenerateOrViewReceipt = (inst: Installment) => {
    if (inst.paidDate) {
      const allReceipts = loadReceipts();
      const existing = allReceipts.find(
        (r) => r.installmentId === inst.id || (inst.receiptNumber && r.receiptNumber === inst.receiptNumber)
      );

      if (existing) {
        setActiveReceiptForPrint(existing);
      } else {
        const prevBal = contract.installments
          .filter((i) => !i.paidDate || i.id === inst.id)
          .reduce((sum, i) => sum + i.nominalAmount, 0);
        const newBal = Math.max(0, prevBal - (inst.paidAmount || inst.nominalAmount));

        const newRec = createReceiptForPayment({
          contract,
          installment: inst,
          receivedAmount: inst.paidAmount || inst.nominalAmount,
          paymentMethod: inst.paymentMethod || 'pix',
          receivedDate: inst.paidDate,
          previousBalance: prevBal,
          newBalance: newBal,
          recipientName: 'Igor Antunes / Rodrigo Lopes',
          notes: inst.notes,
        });

        setActiveReceiptForPrint(newRec);
      }
    } else {
      // Abre a tela de pagamento / baixa para emissão oficial do recibo
      onOpenPaymentModal(inst, contract);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 lg:p-6 no-print">
      <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-5xl max-h-[96vh] sm:max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-300">
        
        {/* 1. Modal Header matching image_abe871f2.png (Deep Blue / Navy Gradient) */}
        <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-sky-700 p-4 sm:p-6 lg:p-7 text-white relative shrink-0">
          {/* Top Pills */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2 pr-10">
            <span className="bg-white/20 backdrop-blur-xs text-white text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-2.5 sm:px-3 py-0.5 rounded-full">
              DOSSIÊ FINANCEIRO & CONTRATUAL OFICIAL
            </span>
            <span className="bg-white/20 backdrop-blur-xs text-white text-[10px] sm:text-[11px] font-bold uppercase px-2 py-0.5 rounded-full">
              PRÉDIO EW
            </span>
          </div>

          {/* Big Buyer Name */}
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-white mb-1">
            {contract.buyer.name}
          </h2>

          {/* Subtitle with bullet points */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-sky-100 font-medium">
            <span>CPF: {contract.buyer.cpf}</span>
            <span className="hidden xs:inline">•</span>
            <span>Unidade: {contract.unit.unitNumber} ({contract.unit.position})</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">Profissão: {contract.buyer.profession}</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">Estado Civil: {contract.buyer.maritalStatus}</span>
          </div>

          {/* Close button X */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
            title="Fechar Dossiê"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Modal Body matching image_abe871f2.png */}
        <div className="p-3 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6 flex-1 bg-slate-50/50 text-sm">
          {/* Top 4 Metrics Strip */}
          <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 shadow-xs grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div>
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5 sm:mb-1">
                VGV DO NEGÓCIO
              </span>
              <div className="text-lg sm:text-xl lg:text-2xl font-black text-blue-950 font-mono-numbers">
                {formatCurrency(contract.totalContractedAmount)}
              </div>
            </div>

            <div>
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5 sm:mb-1">
                PAGO EM DINHEIRO
              </span>
              <div className="text-lg sm:text-xl lg:text-2xl font-black text-emerald-600 font-mono-numbers">
                {formatCurrency(totalReceived)}
              </div>
            </div>

            <div>
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5 sm:mb-1">
                JUROS PACTUADOS
              </span>
              <div className="text-lg sm:text-xl lg:text-2xl font-black text-purple-700 font-mono-numbers">
                {contract.agreedOrEstimatedInterest > 0
                  ? formatCurrency(contract.agreedOrEstimatedInterest)
                  : 'R$ 0,00'}
              </div>
            </div>

            <div>
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5 sm:mb-1">
                SALDO A RECEBER
              </span>
              <div className="text-lg sm:text-xl lg:text-2xl font-black text-sky-600 font-mono-numbers">
                {formatCurrency(remainingBalance)}
              </div>
            </div>
          </div>

          {/* Contract Info Card */}
          <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-extrabold text-blue-950">
                  Contrato: {contract.code} — {contract.unit.unitNumber}
                </h3>
                <span className="bg-blue-950 text-white text-[9px] sm:text-[10px] font-black uppercase px-2 py-0.5 rounded">
                  ATIVO
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onPrintContractStatement(contract)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors"
                >
                  <Printer className="w-3.5 h-3.5 text-blue-900" />
                  <span>Imprimir Extrato</span>
                </button>
              </div>
            </div>

            {/* Gray box with contract rules */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs text-slate-700 space-y-1">
              <div>
                {contract.specialRulesDescription[0]} {contract.specialRulesDescription[1]}
              </div>
              <div className="pt-0.5 text-slate-600 font-medium">
                <strong>Multa:</strong> {contract.rules.finePercent.toFixed(2)}% &nbsp;•&nbsp; 
                <strong>Juros:</strong> {contract.rules.monthlyInterestRate.toFixed(2)}% a.m. pro rata die &nbsp;•&nbsp; 
                <strong>Atualização:</strong> Legalmente cabível
              </div>
              {contract.rules.estimatedInterestNote && (
                <div className="pt-0.5 text-purple-800 font-semibold">
                  {contract.rules.estimatedInterestNote}
                </div>
              )}
            </div>
          </div>

          {/* Section: PROGRAMAÇÃO DE PARCELAS matching image_abe871f2.png */}
          <div className="space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <span className="text-blue-900 font-bold">💳</span>
                <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wide text-blue-950">
                  PROGRAMAÇÃO DE PARCELAS ({contract.installments.length})
                </h3>
              </div>

              {/* Action buttons matching screenshot */}
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                {/* Segmented Filter */}
                <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg text-xs font-semibold">
                  <button
                    onClick={() => setFilterType('all')}
                    className={`px-2.5 py-1 rounded transition-all ${
                      filterType === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                    }`}
                  >
                    Todas ({contract.installments.length})
                  </button>
                  <button
                    onClick={() => setFilterType('pending')}
                    className={`px-2.5 py-1 rounded transition-all ${
                      filterType === 'pending' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                    }`}
                  >
                    Abertas ({contract.installments.length - paidCount})
                  </button>
                  <button
                    onClick={() => setFilterType('paid')}
                    className={`px-2.5 py-1 rounded transition-all ${
                      filterType === 'paid' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                    }`}
                  >
                    Pagas ({paidCount})
                  </button>
                </div>

                {/* View toggle (Cards vs Table) */}
                <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg text-xs font-semibold">
                  <button
                    onClick={() => setDisplayMode('cards')}
                    className={`px-2 py-1 rounded flex items-center gap-1 transition-all ${
                      displayMode === 'cards' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                    }`}
                    title="Exibição em Cards (Ideal para Celular)"
                  >
                    <LayoutList className="w-3.5 h-3.5" />
                    <span className="hidden xs:inline">Cards</span>
                  </button>
                  <button
                    onClick={() => setDisplayMode('table')}
                    className={`px-2 py-1 rounded flex items-center gap-1 transition-all ${
                      displayMode === 'table' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                    }`}
                    title="Exibição em Tabela Completa"
                  >
                    <TableIcon className="w-3.5 h-3.5" />
                    <span className="hidden xs:inline">Tabela</span>
                  </button>
                </div>

                {/* + Adicionar Parcela */}
                <button
                  onClick={() => onOpenAddInstallment(contract, 'mensal')}
                  className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-white bg-blue-950 hover:bg-blue-900 rounded-lg shadow-2xs transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>+ Parcela</span>
                </button>

                {/* + Adicionar Intermediária */}
                <button
                  onClick={() => onOpenAddInstallment(contract, 'intermediaria')}
                  className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-2xs transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>+ Intermediária</span>
                </button>
              </div>
            </div>

            {/* 1. Mobile Cards View (Top para Celular) */}
            {displayMode === 'cards' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {filteredInstallments.map((inst, idx) => {
                  const isPaid = !!inst.paidDate;
                  const days = calculateDaysOverdue(inst.dueDate);
                  const isOverdue = !isPaid && days > 0;
                  const parcelCode = `P-${(idx + 1).toString().padStart(2, '0')}`;

                  return (
                    <div 
                      key={inst.id}
                      className={`bg-white border rounded-xl p-3.5 shadow-2xs transition-all flex flex-col justify-between ${
                        isPaid 
                          ? 'border-emerald-200 bg-emerald-50/20' 
                          : isOverdue 
                            ? 'border-rose-200 bg-rose-50/20' 
                            : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-blue-950 text-xs font-mono-numbers">
                              {parcelCode}
                            </span>
                            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                              {inst.type}
                            </span>
                            {isPaid ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-0.5">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Paga
                              </span>
                            ) : isOverdue ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 flex items-center gap-0.5">
                                <AlertTriangle className="w-3 h-3 text-rose-600" />
                                Atrasada ({days}d)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-0.5">
                                <Clock className="w-3 h-3 text-amber-600" />
                                Pendente
                              </span>
                            )}
                          </div>
                          <div className="text-xs font-bold text-slate-900 mt-1">
                            {inst.description}
                          </div>
                          {inst.notes && (
                            <div className="text-[11px] text-slate-500 mt-0.5 italic">
                              {inst.notes}
                            </div>
                          )}
                        </div>

                        <div className="text-right">
                          <div className="text-[10px] text-slate-400 font-semibold uppercase">Valor</div>
                          <div className="text-base font-black text-slate-900 font-mono-numbers">
                            {formatCurrency(inst.nominalAmount)}
                          </div>
                          {inst.paidAmount !== undefined && (
                            <div className="text-[11px] font-bold text-emerald-600 font-mono-numbers">
                              Pago: {formatCurrency(inst.paidAmount)}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Footer with Details & Touch-friendly Action Buttons */}
                      <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1 text-slate-600 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>Venc: <strong className="text-slate-900 font-mono-numbers">{formatDateBR(inst.dueDate)}</strong></span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {/* Botão Gerar / Ver Recibo */}
                          <button
                            onClick={() => handleGenerateOrViewReceipt(inst)}
                            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
                              isPaid
                                ? 'bg-blue-50 hover:bg-blue-100 text-blue-950 border border-blue-200'
                                : 'bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-900 border border-slate-200'
                            }`}
                            title={isPaid ? 'Ver / Imprimir Recibo Oficial' : 'Dar Baixa e Gerar Recibo'}
                          >
                            <FileCheck2 className="w-3.5 h-3.5 text-blue-800" />
                            <span>Recibo</span>
                          </button>

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
                              title="Lançar recebimento / Baixa"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Baixa</span>
                            </button>
                          )}

                          {/* Botão de Editar ao lado da lixeira */}
                          <button
                            onClick={() => setEditingInstallment(inst)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar Parcela"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete installment button */}
                          <button
                            onClick={() => setDeletingInstallment(inst)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Excluir Parcela"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 2. Full Table View matching image_abe871f2.png */}
            {displayMode === 'table' && (
              <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">PARCELA</th>
                        <th className="px-4 py-3">TIPO</th>
                        <th className="px-4 py-3">DESCRIÇÃO / NOTAS</th>
                        <th className="px-4 py-3">VENCIMENTO</th>
                        <th className="px-4 py-3 text-right">VALOR ORIGINAL</th>
                        <th className="px-4 py-3 text-right">VALOR PAGO</th>
                        <th className="px-4 py-3 text-center">STATUS</th>
                        <th className="px-4 py-3 text-center">AÇÕES</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans">
                      {filteredInstallments.map((inst, idx) => {
                        const isPaid = !!inst.paidDate;
                        const days = calculateDaysOverdue(inst.dueDate);
                        const isOverdue = !isPaid && days > 0;
                        const parcelCode = `P-${(idx + 1).toString().padStart(2, '0')}`;

                        return (
                          <tr key={inst.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-4 py-3 font-bold text-slate-900 font-mono-numbers">
                              {parcelCode}
                            </td>

                            <td className="px-4 py-3 text-slate-700 font-medium capitalize">
                              {inst.type}
                            </td>

                            <td className="px-4 py-3 text-slate-600 max-w-xs">
                              <span className="font-medium text-slate-800">{inst.description}</span>
                              {inst.notes && (
                                <div className="text-[11px] text-slate-500 mt-0.5">{inst.notes}</div>
                              )}
                            </td>

                            <td className="px-4 py-3 font-mono-numbers text-slate-700">
                              {formatDateBR(inst.dueDate)}
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
                                  Atrasada ({days}d)
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                                  Pendente
                                </span>
                              )}
                            </td>

                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                {/* Botão Gerar / Ver Recibo na Tabela */}
                                <button
                                  onClick={() => handleGenerateOrViewReceipt(inst)}
                                  title={isPaid ? 'Ver / Imprimir Recibo Oficial' : 'Dar Baixa e Gerar Recibo'}
                                  className="p-1.5 text-blue-900 hover:bg-blue-50 rounded-lg transition-colors font-bold"
                                >
                                  <FileCheck2 className="w-3.5 h-3.5" />
                                </button>

                                {isPaid ? (
                                  <button
                                    onClick={() => onReversePayment(inst.id, contract.id)}
                                    title="Estornar baixa de pagamento"
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => onOpenPaymentModal(inst, contract)}
                                    title="Dar baixa / Lançar comprovante"
                                    className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors font-bold"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {/* Botão de Editar ao lado da lixeira na Tabela */}
                                <button
                                  onClick={() => setEditingInstallment(inst)}
                                  title="Editar Parcela"
                                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>

                                {/* Delete Installment (Excluir parcela) */}
                                <button
                                  onClick={() => setDeletingInstallment(inst)}
                                  title="Excluir Parcela"
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
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
        </div>

        {/* 3. Modal Footer matching image_abe871f2.png */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 font-medium hidden sm:block">
            {contract.installments.length} parcelas registradas · VGV: {formatCurrency(contract.totalContractedAmount)}
          </div>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors shadow-2xs"
          >
            Fechar Dossiê
          </button>
        </div>

      </div>

      {/* Confirmation Dialog for Installment Deletion */}
      {deletingInstallment && (
        <div className="fixed inset-0 z-60 bg-black/60 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-300 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm">Excluir Parcela?</h4>
                <p className="text-xs text-slate-500">Esta ação é irreversível.</p>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
              <div><strong>Descrição:</strong> {deletingInstallment.description}</div>
              <div><strong>Vencimento:</strong> {formatDateBR(deletingInstallment.dueDate)}</div>
              <div><strong>Valor:</strong> <span className="font-bold text-rose-600 font-mono-numbers">{formatCurrency(deletingInstallment.nominalAmount)}</span></div>
            </div>

            <p className="text-[11px] text-slate-500">
              O VGV e o saldo a receber do contrato serão recalculados automaticamente no sistema.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingInstallment(null)}
                className="px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors"
              >
                Sim, Excluir Parcela
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição de Parcela */}
      {editingInstallment && (
        <EditInstallmentModal
          contract={contract}
          installment={editingInstallment}
          onClose={() => setEditingInstallment(null)}
          onSaveInstallment={onEditInstallment}
        />
      )}

      {/* Modal de Recibo Oficial para Impressão / Salvar PDF */}
      {activeReceiptForPrint && (
        <OfficialPaymentReceiptPrintView
          receipt={activeReceiptForPrint}
          onClose={() => setActiveReceiptForPrint(null)}
        />
      )}
    </div>
  );
};
