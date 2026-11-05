import React, { useState, useMemo } from 'react';
import { 
  FileCheck2, 
  Search, 
  Printer, 
  Eye, 
  Ban, 
  AlertTriangle, 
  CheckCircle2, 
  Filter,
  DollarSign,
  ArrowUpDown
} from 'lucide-react';
import { PaymentReceipt } from '../types';
import { formatCurrency, formatDateBR } from '../utils/formatters';
import { cancelReceipt } from '../utils/storage';
import { OfficialPaymentReceiptPrintView } from './OfficialPaymentReceiptPrintView';

interface ReceiptsListViewProps {
  receipts: PaymentReceipt[];
  onRefreshReceipts: () => void;
}

export const ReceiptsListView: React.FC<ReceiptsListViewProps> = ({
  receipts,
  onRefreshReceipts,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'ativo' | 'cancelado'>('todos');
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentReceipt | null>(null);
  const [cancellingReceipt, setCancellingReceipt] = useState<PaymentReceipt | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const stats = useMemo(() => {
    let totalCount = receipts.length;
    let activeCount = 0;
    let cancelledCount = 0;
    let activeTotalAmount = 0;

    receipts.forEach((r) => {
      if (r.status === 'ativo') {
        activeCount++;
        activeTotalAmount += r.receivedAmount;
      } else {
        cancelledCount++;
      }
    });

    return { totalCount, activeCount, cancelledCount, activeTotalAmount };
  }, [receipts]);

  const filteredReceipts = useMemo(() => {
    return receipts.filter((r) => {
      if (statusFilter !== 'todos' && r.status !== statusFilter) return false;
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      return (
        r.receiptNumber.toLowerCase().includes(q) ||
        r.buyerName.toLowerCase().includes(q) ||
        r.unitNumber.toLowerCase().includes(q) ||
        r.contractCode.toLowerCase().includes(q) ||
        r.recipientName.toLowerCase().includes(q)
      );
    });
  }, [receipts, statusFilter, searchQuery]);

  const handleConfirmCancel = () => {
    if (!cancellingReceipt) return;
    if (!cancelReason.trim()) {
      alert('Por favor, informe a justificativa formal para o cancelamento do recibo.');
      return;
    }

    cancelReceipt(cancellingReceipt.id, cancelReason);
    setCancellingReceipt(null);
    setCancelReason('');
    onRefreshReceipts();
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-blue-900" />
            <h2 className="text-xl font-extrabold text-blue-950 tracking-tight">
              Recibos Oficiais de Pagamento
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Numeração sequencial contínua com histórico inalterável de quitações do PRÉDIO EW.
          </p>
        </div>

        <div className="text-xs font-medium text-slate-500 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl">
          Protocolos gerados automaticamente a cada baixa realizada na carteira.
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 block tracking-wider">
            Total Emitidos
          </span>
          <div className="text-2xl font-black text-blue-950 font-mono-numbers mt-1">
            {stats.totalCount}
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Histórico completo</span>
        </div>

        <div className="bg-white border border-emerald-200 rounded-2xl p-4 shadow-xs bg-emerald-50/20">
          <span className="text-[10px] font-extrabold uppercase text-emerald-700 block tracking-wider">
            Total Quitado Ativo
          </span>
          <div className="text-2xl font-black text-emerald-800 font-mono-numbers mt-1">
            {formatCurrency(stats.activeTotalAmount)}
          </div>
          <span className="text-[11px] text-emerald-600 mt-0.5 block">Recebimentos válidos</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] font-extrabold uppercase text-blue-900 block tracking-wider">
            Recibos Válidos
          </span>
          <div className="text-2xl font-black text-blue-950 font-mono-numbers mt-1">
            {stats.activeCount}
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Em pleno vigor</span>
        </div>

        <div className="bg-white border border-rose-200 rounded-2xl p-4 shadow-xs bg-rose-50/20">
          <span className="text-[10px] font-extrabold uppercase text-rose-700 block tracking-wider">
            Recibos Cancelados
          </span>
          <div className="text-2xl font-black text-rose-700 font-mono-numbers mt-1">
            {stats.cancelledCount}
          </div>
          <span className="text-[11px] text-rose-600 mt-0.5 block">Números preservados</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setStatusFilter('todos')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              statusFilter === 'todos' ? 'bg-white text-blue-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todos ({stats.totalCount})
          </button>
          <button
            onClick={() => setStatusFilter('ativo')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              statusFilter === 'ativo' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Ativos ({stats.activeCount})
          </button>
          <button
            onClick={() => setStatusFilter('cancelado')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              statusFilter === 'cancelado' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cancelados ({stats.cancelledCount})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por comprador, unidade ou nº..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-900 text-slate-800 placeholder-slate-400"
          />
        </div>
      </div>

      {/* Receipts Table / Mobile Cards */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        {filteredReceipts.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <FileCheck2 className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="font-bold text-slate-700">Nenhum recibo encontrado</p>
            <p className="text-xs text-slate-400 mt-1">
              Os recibos são emitidos automaticamente sempre que você realiza uma baixa em Controle de Pagamentos.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredReceipts.map((r) => {
              const isCancelled = r.status === 'cancelado';
              return (
                <div
                  key={r.id}
                  className={`p-4 lg:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                    isCancelled ? 'bg-rose-50/20 opacity-80' : 'hover:bg-slate-50/80'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-black text-sm text-blue-950 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-300">
                        Nº {r.receiptNumber}
                      </span>
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                          isCancelled
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {r.status}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        Data: {formatDateBR(r.receivedDate)}
                      </span>
                    </div>

                    <div className="text-sm font-extrabold text-slate-900">
                      {r.buyerName}{' '}
                      <span className="text-xs font-normal text-slate-500">
                        • Unidade <strong className="text-blue-950">{r.unitNumber}</strong> ({r.contractCode})
                      </span>
                    </div>

                    <div className="text-xs text-slate-500">
                      Ref: <strong className="text-slate-700">{r.installmentDescription}</strong> • Método:{' '}
                      <strong className="uppercase text-slate-700">{r.paymentMethod}</strong> • Favorecido:{' '}
                      <span className="text-slate-800">{r.recipientName}</span>
                    </div>

                    {isCancelled && r.canceledReason && (
                      <div className="text-xs text-rose-700 font-medium pt-1">
                        Cancelado em {formatDateBR(r.canceledAt?.slice(0, 10) || '')}: {r.canceledReason}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        VALOR QUITADO
                      </span>
                      <span
                        className={`text-lg font-black font-mono-numbers ${
                          isCancelled ? 'line-through text-slate-400' : 'text-emerald-700'
                        }`}
                      >
                        {formatCurrency(r.receivedAmount)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setSelectedReceipt(r)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-950 font-bold border border-blue-200 rounded-lg text-xs transition-colors shadow-2xs"
                        title="Ver e Imprimir Recibo"
                      >
                        <Printer className="w-3.5 h-3.5 text-blue-800" />
                        <span>Ver / PDF</span>
                      </button>

                      {!isCancelled && (
                        <button
                          onClick={() => setCancellingReceipt(r)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-rose-50 text-rose-700 font-bold border border-rose-200 rounded-lg text-xs transition-colors shadow-2xs"
                          title="Cancelar Recibo"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Cancelar</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* View / Print Modal */}
      {selectedReceipt && (
        <OfficialPaymentReceiptPrintView
          receipt={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}

      {/* Cancel Confirmation Modal */}
      {cancellingReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  Cancelar Recibo Nº {cancellingReceipt.receiptNumber}?
                </h3>
                <p className="text-xs text-slate-500">
                  Esta ação é irreversível e ficará registrada na auditoria fiscal.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
              <div><strong>Comprador:</strong> {cancellingReceipt.buyerName}</div>
              <div><strong>Unidade:</strong> {cancellingReceipt.unitNumber}</div>
              <div><strong>Valor:</strong> {formatCurrency(cancellingReceipt.receivedAmount)}</div>
              <div><strong>Ref:</strong> {cancellingReceipt.installmentDescription}</div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Justificativa formal do cancelamento (Obrigatório) *
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Ex: Erro de digitação no valor, estorno bancário acordado com comprador..."
                rows={3}
                className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setCancellingReceipt(null);
                  setCancelReason('');
                }}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={!cancelReason.trim()}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl transition-colors shadow-xs"
              >
                Confirmar Cancelamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
