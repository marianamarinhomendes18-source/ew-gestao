import React, { useState } from 'react';
import { Printer, X, Building2, CheckCircle2, FileSpreadsheet, Download, FileText, Check } from 'lucide-react';
import { Contract, Installment } from '../types';
import { formatCurrency, formatDateBR, formatDateTimeBR } from '../utils/formatters';
import { printElement } from '../utils/printHelper';
import { 
  downloadContractStatementPDF, 
  downloadGeneralSalesReportPDF 
} from '../utils/pdfGenerator';

interface ReceiptPrintViewProps {
  contract?: Contract | null;
  allContracts?: Contract[];
  singleInstallment?: Installment | null;
  onExportCSV?: () => void;
  onClose: () => void;
}

export const ReceiptPrintView: React.FC<ReceiptPrintViewProps> = ({
  contract,
  allContracts,
  singleInstallment,
  onExportCSV,
  onClose,
}) => {
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const isGeneralReport = !contract && !!allContracts && allContracts.length > 0;

  if (!contract && !isGeneralReport) return null;

  const docTitle = isGeneralReport 
    ? 'Relatorio_Geral_Vendas_Predio_EW' 
    : singleInstallment 
      ? `Recibo_${singleInstallment.receiptNumber || 'Individual'}_Predio_EW`
      : `Extrato_${contract?.buyer.name.replace(/[^a-zA-Z0-9]/g, '_')}_Predio_EW`;

  const handleDownloadPDF = () => {
    try {
      if (isGeneralReport && allContracts) {
        downloadGeneralSalesReportPDF(allContracts);
      } else if (contract) {
        downloadContractStatementPDF(contract);
      }
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error('Erro ao gerar PDF com jsPDF:', err);
    }
  };

  const handlePrint = () => {
    handleDownloadPDF();
    printElement('printable-receipt-document', { title: docTitle });
  };

  // Calculations for consolidated report
  const contractsList = allContracts || (contract ? [contract] : []);
  const totalVgv = contractsList.reduce((acc, c) => acc + c.totalContractedAmount, 0);
  const totalPrincipal = contractsList.reduce((acc, c) => acc + c.principalAmount, 0);
  const totalInterest = contractsList.reduce((acc, c) => acc + c.agreedOrEstimatedInterest, 0);

  let totalReceived = 0;
  contractsList.forEach((c) => {
    c.installments.forEach((inst) => {
      if (inst.paidAmount) totalReceived += inst.paidAmount;
    });
  });
  const totalBalance = totalVgv - totalReceived;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4 lg:p-6 print:p-0 print:bg-white print:static">
      {/* Modal Container */}
      <div className="bg-white text-slate-900 rounded-2xl w-full max-w-4xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden print:max-h-none print:shadow-none print:border-none print:w-full print:rounded-none">
        {/* Screen Toolbar (hidden in print) */}
        <div className="no-print p-3 sm:p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 gap-2 shrink-0">
          <div className="flex items-center gap-2 truncate">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 shrink-0">
              Visualização PDF
            </span>
            <span className="text-xs text-slate-400 hidden sm:inline">·</span>
            <span className="text-xs text-slate-300 truncate">
              {isGeneralReport 
                ? 'Relatório Executivo Geral de Vendas & Liquidez' 
                : singleInstallment 
                  ? 'Recibo Individual de Pagamento' 
                  : `Extrato Financeiro — ${contract?.buyer.name}`}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onExportCSV && (
              <button
                onClick={onExportCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700 rounded-lg transition-colors"
                title="Baixar Planilha Excel / CSV"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Planilha CSV</span>
              </button>
            )}

            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors shadow-xs"
              title="Salvar e baixar arquivo PDF oficial no celular ou computador"
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
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-black text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-sm"
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

        {/* Helpful Mobile Banner explaining how to save PDF */}
        <div className="no-print bg-blue-50 border-b border-blue-200 px-4 py-2 flex items-center justify-between text-[11px] text-blue-900 font-medium">
          <span className="flex items-center gap-1.5">
            📱 <strong>Dica Celular/PC:</strong> Toque em <strong>Imprimir / PDF</strong> para abrir a impressão do sistema ou em <strong>Salvar Arquivo</strong> para baixar o documento completo sem cortes.
          </span>
        </div>

        {/* Printable Document Paper */}
        <div
          id="printable-receipt-document"
          className="p-6 sm:p-8 lg:p-12 overflow-y-auto bg-white text-slate-900 flex-1 space-y-6 sm:space-y-8 font-sans print:overflow-visible print:p-0 print:max-h-none"
        >
          {/* Document Header */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-950 text-white flex items-center justify-center font-black text-sm shadow-xs shrink-0">
                EW
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black tracking-tight text-slate-950">
                  PRÉDIO EW
                </div>
                <div className="text-[11px] sm:text-xs font-semibold text-slate-600 uppercase tracking-wider mt-0.5">
                  Empreendimento Residencial · Gestão Financeira Segregada
                </div>
                <div className="text-[10px] sm:text-xs text-slate-500 mt-0.5">
                  Posição Oficial em {new Date().toLocaleDateString('pt-BR')}
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="text-[10px] font-mono uppercase text-slate-400">Documento Oficial</div>
              <div className="text-xs sm:text-sm font-bold font-mono text-slate-900">
                {isGeneralReport ? 'EW-REL-GERAL' : contract?.code}
              </div>
              <div className="text-[10px] sm:text-xs text-slate-600">
                {isGeneralReport ? 'Consolidado 4 Operações' : contract?.operationNumber}
              </div>
            </div>
          </div>

          {/* CASE 1: GENERAL EXECUTIVE REPORT FOR ALL CONTRACTS */}
          {isGeneralReport && (
            <div className="space-y-6">
              {/* 4 Summary KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 py-2 border-b border-slate-200 pb-5">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    VGV TOTAL
                  </span>
                  <div className="text-lg sm:text-xl font-black text-blue-950 font-mono-numbers">
                    {formatCurrency(totalVgv)}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    RECEBIDO EM DINHEIRO
                  </span>
                  <div className="text-lg sm:text-xl font-black text-emerald-600 font-mono-numbers">
                    {formatCurrency(totalReceived)}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    JUROS CONVENCIONADOS
                  </span>
                  <div className="text-lg sm:text-xl font-black text-purple-700 font-mono-numbers">
                    {formatCurrency(totalInterest)}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    SALDO A RECEBER
                  </span>
                  <div className="text-lg sm:text-xl font-black text-sky-600 font-mono-numbers">
                    {formatCurrency(totalBalance)}
                  </div>
                </div>
              </div>

              {/* Data Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-blue-950 text-white uppercase text-[10px] font-bold tracking-wider">
                    <tr>
                      <th className="px-3.5 py-2.5">COMPRADOR</th>
                      <th className="px-3.5 py-2.5">UNIDADE</th>
                      <th className="px-3.5 py-2.5 text-right">VGV</th>
                      <th className="px-3.5 py-2.5 text-right">PRINCIPAL</th>
                      <th className="px-3.5 py-2.5 text-right">JUROS</th>
                      <th className="px-3.5 py-2.5 text-right">QUITADO</th>
                      <th className="px-3.5 py-2.5 text-right">SALDO</th>
                      <th className="px-3.5 py-2.5 text-center">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {contractsList.map((c) => {
                      const rec = c.installments.reduce((acc, i) => acc + (i.paidAmount || 0), 0);
                      const bal = c.totalContractedAmount - rec;
                      const paidCount = c.installments.filter((i) => i.paidDate).length;

                      return (
                        <tr key={c.id} className="hover:bg-slate-50/70">
                          <td className="px-3.5 py-2.5 font-bold text-slate-900">{c.buyer.name}</td>
                          <td className="px-3.5 py-2.5 text-slate-700 font-medium">{c.unit.unitNumber}</td>
                          <td className="px-3.5 py-2.5 text-right font-mono-numbers font-medium text-slate-800">{formatCurrency(c.totalContractedAmount)}</td>
                          <td className="px-3.5 py-2.5 text-right font-mono-numbers text-slate-700">{formatCurrency(c.principalAmount)}</td>
                          <td className="px-3.5 py-2.5 text-right font-mono-numbers text-purple-700 font-semibold">{c.agreedOrEstimatedInterest > 0 ? formatCurrency(c.agreedOrEstimatedInterest) : '-'}</td>
                          <td className="px-3.5 py-2.5 text-right font-mono-numbers font-bold text-emerald-600">{formatCurrency(rec)}</td>
                          <td className="px-3.5 py-2.5 text-right font-mono-numbers font-bold text-sky-700">{formatCurrency(bal)}</td>
                          <td className="px-3.5 py-2.5 text-center font-medium text-slate-500 text-[11px]">{paidCount} pagas / {c.installments.length - paidCount} abertas</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-100 font-bold border-t border-slate-300">
                    <tr>
                      <td colSpan={2} className="px-3.5 py-2.5 uppercase text-[10px] text-slate-800">Total Consolidado</td>
                      <td className="px-3.5 py-2.5 text-right font-mono-numbers">{formatCurrency(totalVgv)}</td>
                      <td className="px-3.5 py-2.5 text-right font-mono-numbers">{formatCurrency(totalPrincipal)}</td>
                      <td className="px-3.5 py-2.5 text-right font-mono-numbers text-purple-800">{formatCurrency(totalInterest)}</td>
                      <td className="px-3.5 py-2.5 text-right font-mono-numbers text-emerald-700">{formatCurrency(totalReceived)}</td>
                      <td className="px-3.5 py-2.5 text-right font-mono-numbers text-sky-800">{formatCurrency(totalBalance)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* CASE 2: SINGLE INSTALLMENT RECEIPT */}
          {!isGeneralReport && singleInstallment && contract && (
            <div className="space-y-6">
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-center space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  Comprovante Oficial de Quitação de Parcela
                </span>
                <div className="text-3xl font-extrabold text-slate-950 font-mono">
                  {formatCurrency(singleInstallment.paidAmount || singleInstallment.nominalAmount)}
                </div>
                <div className="text-xs text-emerald-700 font-semibold flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>RECEBIMENTO CONFIRMADO E REGISTRADO</span>
                </div>
              </div>

              {/* Data Table */}
              <div className="grid grid-cols-2 gap-4 text-xs border border-slate-200 rounded-lg p-4">
                <div>
                  <span className="text-slate-500 block">Comprador(a):</span>
                  <strong className="text-sm text-slate-900">{contract.buyer.name}</strong>
                  <div className="text-slate-600 mt-0.5">CPF: {contract.buyer.cpf}</div>
                </div>

                <div>
                  <span className="text-slate-500 block">Unidade Imobiliária:</span>
                  <strong className="text-sm text-slate-900">{contract.unit.unitNumber}</strong>
                  <div className="text-slate-600 mt-0.5">{contract.unit.position}</div>
                </div>

                <div className="pt-3 border-t border-slate-200">
                  <span className="text-slate-500 block">Obrigação / Parcela:</span>
                  <strong className="text-slate-900">{singleInstallment.description}</strong>
                  <div className="text-slate-600">Vencimento Original: {formatDateBR(singleInstallment.dueDate)}</div>
                </div>

                <div className="pt-3 border-t border-slate-200">
                  <span className="text-slate-500 block">Dados da Baixa:</span>
                  <strong className="text-slate-900">
                    Data: {formatDateBR(singleInstallment.paidDate)} · {singleInstallment.paymentMethod?.toUpperCase()}
                  </strong>
                  <div className="text-slate-600">Comprovante: {singleInstallment.receiptNumber || '-'}</div>
                </div>
              </div>

              {singleInstallment.paymentProofNote && (
                <div className="text-xs bg-slate-50 p-3 rounded border border-slate-200 text-slate-700">
                  <strong>Observações do Lançamento:</strong> {singleInstallment.paymentProofNote}
                </div>
              )}
            </div>
          )}

          {/* CASE 3: INDIVIDUAL CONTRACT FULL STATEMENT */}
          {!isGeneralReport && !singleInstallment && contract && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 text-xs">
                {/* Comprador */}
                <div className="border border-slate-200 rounded-lg p-4 space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    Dados do Comprador
                  </span>
                  <div className="text-sm font-bold text-slate-900">{contract.buyer.name}</div>
                  <div><strong>CPF:</strong> {contract.buyer.cpf}</div>
                  <div><strong>Profissão:</strong> {contract.buyer.profession}</div>
                  <div><strong>Estado Civil:</strong> {contract.buyer.maritalStatus}</div>
                  {contract.buyer.coBuyer && (
                    <div><strong>Co-comprador:</strong> {contract.buyer.coBuyer.name} ({contract.buyer.coBuyer.cpf})</div>
                  )}
                </div>

                {/* Unidade & Resumo */}
                <div className="border border-slate-200 rounded-lg p-4 space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    Unidade & Posição Financeira
                  </span>
                  <div className="text-sm font-bold text-slate-900">{contract.unit.unitNumber}</div>
                  <div><strong>Localização:</strong> {contract.unit.position}</div>
                  <div><strong>Valor Contratado Total:</strong> {formatCurrency(contract.totalContractedAmount)}</div>
                  <div><strong>Total Amortizado / Pago:</strong> {formatCurrency(totalReceived)}</div>
                  <div><strong>Saldo Devedor Atual:</strong> <strong className="text-slate-950 font-bold">{formatCurrency(totalBalance)}</strong></div>
                </div>
              </div>

              {/* Installments Table */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2">
                  Demonstrativo Cronológico de Parcelas ({contract.installments.length} obrigações)
                </h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 uppercase font-bold border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2">Nº</th>
                        <th className="px-3 py-2">Descrição</th>
                        <th className="px-3 py-2">Vencimento</th>
                        <th className="px-3 py-2 text-right">Valor Nominal</th>
                        <th className="px-3 py-2 text-center">Status</th>
                        <th className="px-3 py-2">Data Baixa</th>
                        <th className="px-3 py-2 text-right">Valor Pago</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {contract.installments.map((inst) => (
                        <tr key={inst.id} className="text-slate-800">
                          <td className="px-3 py-1.5 font-mono">#{inst.order}</td>
                          <td className="px-3 py-1.5 font-medium">{inst.description}</td>
                          <td className="px-3 py-1.5 font-mono">{formatDateBR(inst.dueDate)}</td>
                          <td className="px-3 py-1.5 text-right font-mono font-medium">
                            {formatCurrency(inst.nominalAmount)}
                          </td>
                          <td className="px-3 py-1.5 text-center">
                            {inst.paidDate ? (
                              <span className="text-emerald-700 font-bold">PAGO</span>
                            ) : (
                              <span className="text-slate-500">PENDENTE</span>
                            )}
                          </td>
                          <td className="px-3 py-1.5 font-mono">
                            {inst.paidDate ? formatDateBR(inst.paidDate) : '-'}
                          </td>
                          <td className="px-3 py-1.5 text-right font-mono font-bold text-slate-900">
                            {inst.paidAmount !== undefined ? formatCurrency(inst.paidAmount) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 font-bold border-t border-slate-300">
                      <tr>
                        <td colSpan={3} className="px-3 py-2 uppercase">Total do Contrato</td>
                        <td className="px-3 py-2 text-right font-mono">{formatCurrency(contract.totalContractedAmount)}</td>
                        <td colSpan={2} className="px-3 py-2 text-right uppercase">Total Pago:</td>
                        <td className="px-3 py-2 text-right font-mono text-emerald-800">{formatCurrency(totalReceived)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Signatures Footer */}
          <div className="pt-8 sm:pt-12 mt-8 sm:mt-12 border-t border-slate-300 grid grid-cols-2 gap-8 text-center text-xs">
            <div>
              <div className="border-t border-slate-400 mx-auto w-3/4 mb-1"></div>
              <strong>PRÉDIO EW</strong>
              <div className="text-slate-500">Administração do Empreendimento</div>
            </div>
            <div>
              <div className="border-t border-slate-400 mx-auto w-3/4 mb-1"></div>
              <strong>{isGeneralReport ? 'Diretoria Executiva' : contract?.buyer.name}</strong>
              <div className="text-slate-500">{isGeneralReport ? 'Controladoria Financeira' : 'Comprador(a) / Promitente'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

