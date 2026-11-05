import React, { useState } from 'react';
import { Printer, Download, X, Layers, Building, CheckCircle2, Clock, AlertTriangle, Check } from 'lucide-react';
import { CostItem } from '../types';
import { formatCurrency, formatDateBR, formatDateTimeBR } from '../utils/formatters';
import { printElement } from '../utils/printHelper';
import { downloadCostReportPDF } from '../utils/pdfGenerator';

interface CostReportPrintModalProps {
  costs: CostItem[];
  periodLabel: string;
  onClose: () => void;
}

export const CostReportPrintModal: React.FC<CostReportPrintModalProps> = ({
  costs,
  periodLabel,
  onClose,
}) => {
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const today = new Date().toISOString().slice(0, 10);

  const totalAmount = costs.reduce((sum, c) => sum + c.totalAmount, 0);
  let totalPaid = 0;
  let totalPending = 0;
  let totalOverdue = 0;

  const byCat: Record<string, number> = {};
  const bySupplier: Record<string, number> = {};

  costs.forEach((c) => {
    if (c.status === 'PAGO') {
      totalPaid += c.totalAmount;
    } else {
      totalPending += c.totalAmount;
      if (c.dueDate && c.dueDate < today) {
        totalOverdue += c.totalAmount;
      }
    }
    byCat[c.category] = (byCat[c.category] || 0) + c.totalAmount;
    if (c.supplier) {
      bySupplier[c.supplier] = (bySupplier[c.supplier] || 0) + c.totalAmount;
    }
  });

  const catList = Object.entries(byCat).sort((a, b) => b[1] - a[1]);

  const handleDownloadPDF = () => {
    try {
      downloadCostReportPDF(costs, periodLabel);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error('Erro ao gerar PDF de custos:', err);
    }
  };

  const handlePrint = () => {
    handleDownloadPDF();
    printElement('printable-cost-report-paper', {
      title: `Relatorio_Custos_Predio_EW_${periodLabel.replace(/[^a-zA-Z0-9]/g, '_')}`,
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 lg:p-6 print:p-0 print:bg-white print:static">
      <div className="bg-white text-slate-900 rounded-2xl w-full max-w-4xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden print:max-h-none print:shadow-none print:border-none print:w-full print:rounded-none">
        {/* Screen Toolbar (hidden during print) */}
        <div className="no-print p-3 sm:p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 gap-2 shrink-0">
          <div className="flex items-center gap-2 truncate">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 shrink-0">
              Relatório em PDF
            </span>
            <span className="text-xs text-slate-400 hidden sm:inline">·</span>
            <span className="text-xs text-slate-300 truncate font-semibold">
              Custos da Obra — {periodLabel}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors shadow-xs"
              title="Salvar e baixar arquivo PDF oficial de custos no celular ou PC"
            >
              {downloadSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span className="text-emerald-200">PDF Salvo!</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-white" />
                  <span>Salvar / Baixar PDF</span>
                </>
              )}
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-black text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-xs"
              title="Imprimir ou Salvar Documento em PDF"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Helpful Mobile Banner */}
        <div className="no-print bg-blue-50 border-b border-blue-200 px-4 py-2 flex items-center justify-between text-[11px] text-blue-900 font-medium">
          <span className="flex items-center gap-1.5">
            📱 <strong>Dica Celular/PC:</strong> Toque em <strong>Imprimir / PDF</strong> para abrir a impressão do sistema ou em <strong>Salvar Arquivo</strong> para baixar o PDF completo sem cortes.
          </span>
        </div>

        {/* Printable Paper Document */}
        <div
          id="printable-cost-report-paper"
          className="p-6 sm:p-8 lg:p-10 overflow-y-auto bg-white text-slate-900 flex-1 space-y-6 font-sans print:overflow-visible print:p-0 print:space-y-4"
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-950 text-white flex items-center justify-center font-black text-base shadow-xs shrink-0">
                EW
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-blue-950 tracking-tight uppercase">
                  PRÉDIO EW — RELATÓRIO DE CUSTOS & OBRAS
                </h1>
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mt-0.5">
                  Gestão Financeira & Execução Orçamentária da Obra
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Período: <strong className="text-slate-800">{periodLabel}</strong> • Emissão: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="text-[10px] uppercase font-mono text-slate-400">Auditoria Oficial</div>
              <div className="text-sm font-black font-mono text-blue-950">
                CUSTOS-{costs.length}
              </div>
              <div className="text-[11px] text-slate-600">
                Total de {costs.length} despesa(s)
              </div>
            </div>
          </div>

          {/* 4 KPI Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 print:grid-cols-4">
            <div className="border border-slate-300 rounded-xl p-3 bg-slate-50">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">TOTAL DE CUSTOS</span>
              <div className="text-lg font-black text-blue-950 font-mono-numbers mt-1">
                {formatCurrency(totalAmount)}
              </div>
            </div>

            <div className="border border-emerald-300 rounded-xl p-3 bg-emerald-50/50">
              <span className="text-[10px] font-bold uppercase text-emerald-800 block">TOTAL PAGO</span>
              <div className="text-lg font-black text-emerald-700 font-mono-numbers mt-1">
                {formatCurrency(totalPaid)}
              </div>
            </div>

            <div className="border border-amber-300 rounded-xl p-3 bg-amber-50/50">
              <span className="text-[10px] font-bold uppercase text-amber-800 block">A PAGAR / PENDENTE</span>
              <div className="text-lg font-black text-amber-700 font-mono-numbers mt-1">
                {formatCurrency(totalPending)}
              </div>
            </div>

            <div className="border border-rose-300 rounded-xl p-3 bg-rose-50/50">
              <span className="text-[10px] font-bold uppercase text-rose-800 block">VALORES VENCIDOS</span>
              <div className="text-lg font-black text-rose-700 font-mono-numbers mt-1">
                {formatCurrency(totalOverdue)}
              </div>
            </div>
          </div>

          {/* Categories Breakdown */}
          {catList.length > 0 && (
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/40 page-break-inside-avoid">
              <h3 className="text-xs font-black uppercase text-blue-950 tracking-wider mb-2 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-900" />
                Resumo por Categoria
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-xs">
                {catList.map(([cat, amount]) => {
                  const pct = totalAmount > 0 ? (amount / totalAmount) * 100 : 0;
                  return (
                    <div key={cat} className="p-2 bg-white border border-slate-200 rounded-lg">
                      <span className="text-[11px] font-bold text-slate-700 truncate block">{cat}</span>
                      <div className="font-mono font-black text-blue-950 text-xs mt-0.5">
                        {formatCurrency(amount)}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">{pct.toFixed(1)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Itemized Table of Costs */}
          <div className="space-y-2">
            <h3 className="text-xs font-black uppercase text-blue-950 tracking-wider">
              Discriminação Analítica dos Lançamentos ({costs.length})
            </h3>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-extrabold uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Cód.</th>
                    <th className="py-2.5 px-3">Data</th>
                    <th className="py-2.5 px-3">Fornecedor</th>
                    <th className="py-2.5 px-3">Item / Descrição</th>
                    <th className="py-2.5 px-3">Categoria</th>
                    <th className="py-2.5 px-3 text-center">Qtd</th>
                    <th className="py-2.5 px-3 text-right">Valor Total</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-center">Anexos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {costs.map((c) => {
                    const isPaid = c.status === 'PAGO';
                    const isOverdue = !isPaid && c.dueDate && c.dueDate < today;
                    return (
                      <tr key={c.id} className="hover:bg-slate-50 page-break-inside-avoid">
                        <td className="py-2 px-3 font-mono font-bold text-slate-900">{c.code}</td>
                        <td className="py-2 px-3 text-slate-600 font-mono">{formatDateBR(c.date)}</td>
                        <td className="py-2 px-3 font-bold text-slate-800">{c.supplier}</td>
                        <td className="py-2 px-3 text-slate-800">
                          <span className="font-semibold">{c.item}</span>
                          {c.description && (
                            <span className="text-[11px] text-slate-500 block">{c.description}</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-slate-600">{c.category}</td>
                        <td className="py-2 px-3 text-center font-mono text-slate-600">
                          {c.quantity} {c.unit}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-blue-950">
                          {formatCurrency(c.totalAmount)}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded-md text-[10px] font-black uppercase ${
                              isPaid
                                ? 'bg-emerald-100 text-emerald-800'
                                : isOverdue
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {isOverdue ? 'Atraso' : c.status}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center font-mono text-[11px] text-slate-500">
                          {c.documents.length > 0 ? `${c.documents.length} doc(s)` : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 border-t-2 border-slate-300 font-black text-xs text-slate-900">
                    <td colSpan={6} className="py-3 px-3 uppercase text-right">
                      Total Geral do Relatório:
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-sm text-blue-950">
                      {formatCurrency(totalAmount)}
                    </td>
                    <td colSpan={2} className="py-3 px-3 text-center text-[11px] text-slate-600 font-normal">
                      {costs.length} registros
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Signatures & Certification */}
          <div className="pt-8 border-t border-slate-300 grid grid-cols-2 gap-8 text-center text-xs text-slate-600 page-break-inside-avoid">
            <div>
              <div className="border-b border-slate-400 mb-2 w-3/4 mx-auto"></div>
              <p className="font-bold text-slate-900">Gestão de Obras / Suprimentos</p>
              <p className="text-[10px] text-slate-400">PRÉDIO EW Empreendimentos</p>
            </div>
            <div>
              <div className="border-b border-slate-400 mb-2 w-3/4 mx-auto"></div>
              <p className="font-bold text-slate-900">Diretoria Financeira & Auditoria</p>
              <p className="text-[10px] text-slate-400">Igor Antunes / Rodrigo Lopes</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
