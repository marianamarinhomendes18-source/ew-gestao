import React, { useState } from 'react';
import { Calendar, X, ExternalLink, CheckCircle2, Clock, AlertTriangle, Printer, Download, Check } from 'lucide-react';
import { Contract, Installment } from '../types';
import { formatCurrency, formatDateBR } from '../utils/formatters';
import { printElement } from '../utils/printHelper';
import { downloadMonthlyReceiptsDetailPDF } from '../utils/pdfGenerator';

interface MonthlyReceiptsDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMonth: string;
  contracts: Contract[];
  initialFilter?: 'todas' | 'pagas' | 'pendentes' | 'atrasadas';
  onSelectContract: (contractId: string) => void;
  onOpenPaymentModal?: (installment: Installment, contract: Contract) => void;
}

interface ItemRow {
  contract: Contract;
  installment: Installment;
  isPaid: boolean;
  isOverdue: boolean;
  isPending: boolean;
}

export const MonthlyReceiptsDetailModal: React.FC<MonthlyReceiptsDetailModalProps> = ({
  isOpen,
  onClose,
  selectedMonth,
  contracts,
  initialFilter = 'todas',
  onSelectContract,
  onOpenPaymentModal,
}) => {
  const [filter, setFilter] = useState<'todas' | 'pagas' | 'pendentes' | 'atrasadas'>(initialFilter);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const todayStr = '2026-11-03';

  // Format month title
  const getMonthTitle = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const mIdx = parseInt(month, 10) - 1;
    return `${months[mIdx] || month} / ${year}`;
  };

  const handleDownloadPDF = () => {
    try {
      downloadMonthlyReceiptsDetailPDF(selectedMonth, contracts);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error('Erro ao gerar PDF do mês:', err);
    }
  };

  const handlePrint = () => {
    handleDownloadPDF();
    printElement('printable-monthly-detail-paper', {
      title: `Detalhamento_Recebimentos_${selectedMonth}_Predio_EW`,
    });
  };

  // Collect all installments for selected month
  const allItems: ItemRow[] = [];
  contracts.forEach((contract) => {
    contract.installments.forEach((installment) => {
      if (installment.dueDate.startsWith(selectedMonth)) {
        const isPaid = !!installment.paidDate || !!installment.paidAmount;
        const isOverdue = !isPaid && installment.dueDate < todayStr;
        const isPending = !isPaid && !isOverdue;
        allItems.push({
          contract,
          installment,
          isPaid,
          isOverdue,
          isPending,
        });
      }
    });
  });

  // Sort by due date
  allItems.sort((a, b) => a.installment.dueDate.localeCompare(b.installment.dueDate));

  const paidList = allItems.filter((i) => i.isPaid);
  const pendingList = allItems.filter((i) => i.isPending);
  const overdueList = allItems.filter((i) => i.isOverdue);

  const displayedList = allItems.filter((item) => {
    if (filter === 'pagas') return item.isPaid;
    if (filter === 'pendentes') return item.isPending;
    if (filter === 'atrasadas') return item.isOverdue;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white text-slate-900 rounded-t-3xl sm:rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom duration-200">
        {/* Header matching image_32b61fa4.png */}
        <div className="bg-blue-950 text-white p-4 sm:p-5 flex items-start justify-between border-b border-blue-900">
          <div>
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-2.5 sm:hidden" />
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-sky-400 shrink-0" />
              <h3 className="text-base sm:text-lg font-black tracking-tight font-sans">
                Detalhamento de Recebimentos — {getMonthTitle(selectedMonth)}
              </h3>
            </div>
            <p className="text-xs text-sky-200 font-medium mt-0.5 ml-7">
              Lançamentos e parcelas registradas para o período
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors shadow-2xs"
              title="Baixar arquivo PDF oficial do mês"
            >
              {downloadSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span className="text-emerald-200">Baixado!</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-white" />
                  <span>Baixar PDF</span>
                </>
              )}
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-2xs"
              title="Imprimir ou Salvar Detalhamento em PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Imprimir / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-sky-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Tabs matching image_32b61fa4.png */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border-b border-slate-200 overflow-x-auto text-xs shrink-0">
          <button
            onClick={() => setFilter('todas')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
              filter === 'todas'
                ? 'bg-blue-950 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
            }`}
          >
            Todas ({allItems.length})
          </button>

          <button
            onClick={() => setFilter('pagas')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
              filter === 'pagas'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            Pagas ({paidList.length})
          </button>

          <button
            onClick={() => setFilter('pendentes')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
              filter === 'pendentes'
                ? 'bg-amber-500 text-white shadow-2xs'
                : 'text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            Pendentes ({pendingList.length})
          </button>

          <button
            onClick={() => setFilter('atrasadas')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
              filter === 'atrasadas'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            Atrasadas ({overdueList.length})
          </button>
        </div>

        {/* List of Installment Cards matching image_32b61fa4.png */}
        <div
          id="printable-monthly-detail-paper"
          className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3.5 bg-[#f8fafc] print:p-0 print:bg-white print:overflow-visible"
        >
          {displayedList.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Calendar className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-600">Nenhuma parcela encontrada para este filtro.</p>
              <p className="text-xs text-slate-400 mt-1">Selecione outra categoria ou outro mês de referência.</p>
            </div>
          ) : (
            displayedList.map(({ contract, installment, isPaid, isOverdue, isPending }) => {
              // Border color based on status
              const cardBorderClass = isPaid
                ? 'border-2 border-emerald-300 bg-white'
                : isOverdue
                ? 'border-2 border-rose-300 bg-white'
                : 'border-2 border-amber-300 bg-white';

              return (
                <div
                  key={`${contract.id}-${installment.id}`}
                  className={`${cardBorderClass} rounded-2xl p-4 shadow-2xs transition-all flex flex-col justify-between`}
                >
                  {/* Top Line: Buyer Name + UNIDADE Badge + Code */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-base font-bold text-slate-900 leading-tight">
                        {contract.buyer.name}
                      </h4>
                      <span className="bg-blue-950 text-white font-black text-[10px] px-2 py-0.5 rounded-md uppercase tracking-wide">
                        UNIDADE {contract.unit.unitNumber}
                      </span>
                    </div>

                    <span className="text-[10px] text-slate-400 font-mono shrink-0">
                      {contract.code}
                    </span>
                  </div>

                  {/* Second Line: Parcela details and Vencimento */}
                  <div className="text-xs text-slate-600 mt-2 flex items-center flex-wrap gap-1">
                    <span>Parcela: <strong className="text-slate-800">{installment.order ? `#${installment.order} · ` : ''}{installment.description}</strong></span>
                    <span className="text-slate-400">•</span>
                    <span>Vencimento: <strong className="text-slate-800">{formatDateBR(installment.dueDate)}</strong></span>
                    {isPaid && (
                      <>
                        <span className="text-slate-400">•</span>
                        <span className="text-emerald-700 font-semibold">
                          Pago em: {formatDateBR(installment.paidDate)}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Third Line: VALOR + Status Badge + Ver Dossiê Button */}
                  <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        VALOR
                      </span>
                      <strong className={`text-lg font-black font-mono-numbers block ${
                        isPaid ? 'text-emerald-700' : isOverdue ? 'text-rose-700' : 'text-slate-900'
                      }`}>
                        {formatCurrency(installment.paidAmount || installment.nominalAmount)}
                      </strong>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Status pill matching screenshots */}
                      {isPaid && (
                        <span className="px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-bold shadow-2xs">
                          Paga
                        </span>
                      )}
                      {isPending && (
                        <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold">
                          Pendente
                        </span>
                      )}
                      {isOverdue && (
                        <span className="px-3 py-1 rounded-full bg-rose-500 text-white text-xs font-bold shadow-2xs">
                          Atrasada
                        </span>
                      )}

                      {/* Optional direct payment action for pending/overdue */}
                      {!isPaid && onOpenPaymentModal && (
                        <button
                          onClick={() => {
                            onOpenPaymentModal(installment, contract);
                            onClose();
                          }}
                          className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-2xs"
                        >
                          Baixar
                        </button>
                      )}

                      {/* Ver Dossiê button matching image_32b61fa4.png */}
                      <button
                        onClick={() => {
                          onSelectContract(contract.id);
                          onClose();
                        }}
                        className="px-3 py-1.5 text-xs font-bold text-blue-950 hover:bg-slate-50 border border-slate-300 rounded-xl transition-colors shadow-2xs"
                      >
                        Ver Dossiê
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer matching image_32b61fa4.png */}
        <div className="p-3.5 sm:p-4 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500 font-medium">
            Total de {displayedList.length} parcelas exibidas
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-colors shadow-2xs"
          >
            Fechar Detalhamento
          </button>
        </div>
      </div>
    </div>
  );
};
