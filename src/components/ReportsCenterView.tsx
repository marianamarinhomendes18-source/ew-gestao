import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Printer, 
  Building2, 
  Filter,
  CheckCircle2,
  Download,
  Check
} from 'lucide-react';
import { Contract } from '../types';
import { formatCurrency, formatDateBR } from '../utils/formatters';
import { printElement } from '../utils/printHelper';
import { downloadGeneralSalesReportPDF } from '../utils/pdfGenerator';

interface ReportsCenterViewProps {
  contracts: Contract[];
  onExportCSV: () => void;
}

export const ReportsCenterView: React.FC<ReportsCenterViewProps> = ({
  contracts,
  onExportCSV,
}) => {
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [reportType, setReportType] = useState('vendas_liquidez');
  const [selectedBuyer, setSelectedBuyer] = useState('all');
  const [selectedUnit, setSelectedUnit] = useState('all');

  const filteredContracts = contracts.filter((c) => {
    if (selectedBuyer !== 'all' && c.id !== selectedBuyer) return false;
    if (selectedUnit !== 'all' && c.id !== selectedUnit) return false;
    return true;
  });

  const totalVgv = filteredContracts.reduce((acc, c) => acc + c.totalContractedAmount, 0);
  const totalPrincipal = filteredContracts.reduce((acc, c) => acc + c.principalAmount, 0);
  const totalInterest = filteredContracts.reduce((acc, c) => acc + c.agreedOrEstimatedInterest, 0);

  let totalReceived = 0;
  filteredContracts.forEach((c) => {
    c.installments.forEach((inst) => {
      if (inst.paidAmount) totalReceived += inst.paidAmount;
    });
  });

  const totalBalance = totalVgv - totalReceived;

  const handleDownloadPDF = () => {
    try {
      downloadGeneralSalesReportPDF(filteredContracts);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error('Erro ao gerar PDF de relatórios:', err);
    }
  };

  const handlePrint = () => {
    handleDownloadPDF();
    printElement('printable-reports-center-paper', {
      title: 'Relatorio_Corporativo_Predio_EW',
    });
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header and Controls matching image_a260535a.png */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4 no-print">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Printer className="w-5 h-5 text-blue-900" />
              <h2 className="text-xl font-extrabold text-blue-950 tracking-tight">
                Central de Relatórios Corporativos
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Gere relatórios impressos ou exporte em planilha compatível com Excel e PDF.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors shadow-2xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Exportar Excel / CSV</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-colors shadow-2xs"
              title="Salvar e baixar arquivo PDF oficial no celular ou computador"
            >
              {downloadSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span className="text-emerald-200">PDF Salvo!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-white" />
                  <span>Salvar / Baixar PDF</span>
                </>
              )}
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-black text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / PDF</span>
            </button>
          </div>
        </div>

        {/* Filters Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block font-bold text-slate-600 mb-1">
              TIPO DE RELATÓRIO
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-blue-700"
            >
              <option value="vendas_liquidez">Relatório Executivo de Vendas & Liquidez</option>
              <option value="fluxo_analitico">Extrato Analítico de Recebíveis</option>
              <option value="amortizacao">Quadro de Amortização Contratual</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-600 mb-1">
              COMPRADOR
            </label>
            <select
              value={selectedBuyer}
              onChange={(e) => setSelectedBuyer(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-blue-700"
            >
              <option value="all">Todos os Compradores</option>
              {contracts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.buyer.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-600 mb-1">
              UNIDADE
            </label>
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-blue-700"
            >
              <option value="all">Todas as Unidades</option>
              {contracts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.unit.unitNumber}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Official Report Document Paper (Exact replica of image_a260535a.png) */}
      <div
        id="printable-reports-center-paper"
        className="bg-white border border-slate-200/90 rounded-2xl p-8 lg:p-12 shadow-sm space-y-8 font-sans print:p-0 print:border-none print:shadow-none"
      >
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b-2 border-slate-900">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-950 text-white flex items-center justify-center font-black text-sm shadow-xs">
              EW
            </div>
            <div>
              <h1 className="text-xl font-black text-blue-950 tracking-tight">
                PRÉDIO EW EMPREENDIMENTOS
              </h1>
              <div className="text-xs text-slate-500 font-medium mt-0.5">
                PRÉDIO EW Incorporações Ltda • CNPJ: 54.892.103/0001-44
              </div>
              <div className="text-[11px] text-slate-400">
                Gestão Financeira & Imobiliária Segregada
              </div>
            </div>
          </div>

          <div className="text-left sm:text-right text-xs text-slate-600">
            <strong className="text-blue-950 uppercase tracking-wider block text-xs">
              RELATÓRIO EXECUTIVO DE VENDAS & LIQUIDEZ
            </strong>
            <div className="mt-0.5">Data de Emissão: {new Date().toLocaleDateString('pt-BR')}</div>
            <div className="text-blue-900 font-bold">
              Operações Ativas do Empreendimento ({filteredContracts.length})
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              AUTENTICIDADE: EW-DB-SYSTEM
            </div>
          </div>
        </div>

        {/* 4 Summary KPIs matching screenshot */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-2">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              VGV FILTRADO
            </span>
            <div className="text-xl font-black text-blue-950 font-mono-numbers">
              {formatCurrency(totalVgv)}
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              RECEBIDO EM DINHEIRO
            </span>
            <div className="text-xl font-black text-emerald-600 font-mono-numbers">
              {formatCurrency(totalReceived)}
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              JUROS CONVENCIONADOS
            </span>
            <div className="text-xl font-black text-purple-700 font-mono-numbers">
              {formatCurrency(totalInterest)}
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              SALDO A RECEBER
            </span>
            <div className="text-xl font-black text-sky-600 font-mono-numbers">
              {formatCurrency(totalBalance)}
            </div>
          </div>
        </div>

        {/* Data Table matching screenshot */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-blue-950 text-white uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="px-4 py-3">COMPRADOR</th>
                <th className="px-4 py-3">UNIDADE</th>
                <th className="px-4 py-3 text-right">VGV</th>
                <th className="px-4 py-3 text-right">DINHEIRO</th>
                <th className="px-4 py-3 text-right">JUROS</th>
                <th className="px-4 py-3 text-right">TOTAL QUITADO</th>
                <th className="px-4 py-3 text-right">SALDO DEVEDOR</th>
                <th className="px-4 py-3 text-center">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredContracts.map((c) => {
                const rec = c.installments.reduce((acc, i) => acc + (i.paidAmount || 0), 0);
                const bal = c.totalContractedAmount - rec;
                const paidCount = c.installments.filter((i) => i.paidDate).length;

                return (
                  <tr key={c.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-bold text-slate-900">
                      {c.buyer.name}
                    </td>

                    <td className="px-4 py-3 text-slate-700 font-semibold">
                      {c.unit.unitNumber}
                    </td>

                    <td className="px-4 py-3 text-right font-mono-numbers font-medium text-slate-800">
                      {formatCurrency(c.totalContractedAmount)}
                    </td>

                    <td className="px-4 py-3 text-right font-mono-numbers font-bold text-emerald-600">
                      {formatCurrency(rec)}
                    </td>

                    <td className="px-4 py-3 text-right font-mono-numbers text-purple-700 font-semibold">
                      {c.agreedOrEstimatedInterest > 0
                        ? formatCurrency(c.agreedOrEstimatedInterest)
                        : 'R$ 0,00'}
                    </td>

                    <td className="px-4 py-3 text-right font-mono-numbers font-black text-slate-900">
                      {formatCurrency(rec)}
                    </td>

                    <td className="px-4 py-3 text-right font-mono-numbers font-black text-sky-700">
                      {formatCurrency(bal)}
                    </td>

                    <td className="px-4 py-3 text-center font-medium text-slate-500 text-[11px]">
                      {paidCount} pagas / {c.installments.length - paidCount} abertas
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-100 font-bold border-t border-slate-300">
              <tr>
                <td colSpan={2} className="px-4 py-3 uppercase text-[11px] text-slate-800">
                  Total Geral Consolidado ({filteredContracts.length} Operações)
                </td>
                <td className="px-4 py-3 text-right font-mono-numbers">{formatCurrency(totalVgv)}</td>
                <td className="px-4 py-3 text-right font-mono-numbers text-emerald-700">{formatCurrency(totalReceived)}</td>
                <td className="px-4 py-3 text-right font-mono-numbers text-purple-800">{formatCurrency(totalInterest)}</td>
                <td className="px-4 py-3 text-right font-mono-numbers text-slate-950">{formatCurrency(totalReceived)}</td>
                <td className="px-4 py-3 text-right font-mono-numbers text-sky-800">{formatCurrency(totalBalance)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Footer & Signature matching image_a260535a.png */}
        <div className="pt-10 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <div>
            <strong className="text-slate-800">PRÉDIO EW Empreendimentos & Participações</strong>
            <div className="text-[11px]">Documento emitido eletronicamente pela plataforma de gestão integrada.</div>
          </div>
          <div className="text-center sm:text-right">
            <strong className="text-slate-900 block">Diretoria Financeira / Controladoria</strong>
            <span className="text-[11px] text-slate-400">Auditoria Contratual Oficial</span>
          </div>
        </div>
      </div>
    </div>
  );
};
