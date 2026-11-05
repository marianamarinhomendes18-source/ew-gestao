import React, { useState } from 'react';
import { Printer, X, AlertTriangle, CheckCircle, ShieldCheck, Download, Check } from 'lucide-react';
import { PaymentReceipt } from '../types';
import { formatCurrency, formatDateBR } from '../utils/formatters';
import { printElement } from '../utils/printHelper';
import { downloadOfficialReceiptPDF } from '../utils/pdfGenerator';

interface OfficialPaymentReceiptPrintViewProps {
  receipt: PaymentReceipt;
  onClose: () => void;
}

// Converte valor em reais para extenso simplificado
function valorPorExtenso(valor: number): string {
  // Para valores em reais mais comuns da obra
  const intVal = Math.floor(valor);
  const cents = Math.round((valor - intVal) * 100);
  let res = `${formatCurrency(valor)}`;
  if (cents > 0) {
    return `${res} (${intVal} reais e ${cents} centavos)`;
  }
  return `${res} (${intVal} reais)`;
}

export const OfficialPaymentReceiptPrintView: React.FC<OfficialPaymentReceiptPrintViewProps> = ({
  receipt,
  onClose,
}) => {
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const docTitle = `Recibo_Quitacao_${receipt.receiptNumber.replace(/[^a-zA-Z0-9]/g, '_')}_Predio_EW`;

  const handleDownloadPDF = () => {
    try {
      downloadOfficialReceiptPDF(receipt);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error('Erro ao gerar PDF do recibo:', err);
    }
  };

  const handlePrint = () => {
    handleDownloadPDF();
    printElement('printable-official-receipt-paper', { title: docTitle });
  };

  const isCancelled = receipt.status === 'cancelado';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto print:shadow-none print:border-none print:max-w-none print:w-full print:rounded-none">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="font-extrabold text-sm tracking-wide">
              Documento Oficial — Recibo de Quitação
            </span>
            <span className="bg-blue-800 text-white text-[11px] font-mono px-2 py-0.5 rounded-full font-bold">
              {receipt.receiptNumber}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
              title="Salvar e baixar arquivo PDF oficial do recibo"
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
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg text-xs font-black transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Fechar visualização"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Helpful Mobile Banner */}
        <div className="print:hidden bg-blue-50 border-b border-blue-200 px-4 py-2 flex items-center justify-between text-[11px] text-blue-900 font-medium">
          <span className="flex items-center gap-1.5">
            📱 <strong>Dica Celular/PC:</strong> Toque em <strong>Imprimir / PDF</strong> ou em <strong>Salvar Arquivo</strong> para baixar e arquivar o recibo sem cortes.
          </span>
        </div>

        {/* Printable Paper Content */}
        <div
          id="printable-official-receipt-paper"
          className="p-8 sm:p-10 text-slate-800 font-sans relative bg-white min-h-[700px] print:p-0 print:min-h-0"
        >
          {/* Watermark if Cancelled */}
          {isCancelled && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-15 rotate-[-25deg] select-none">
              <span className="text-8xl font-black text-rose-600 uppercase border-8 border-rose-600 p-6 rounded-3xl">
                CANCELADO
              </span>
            </div>
          )}

          {/* Header of Receipt */}
          <div className="border-b-2 border-slate-900 pb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-950 text-white font-black text-sm flex items-center justify-center tracking-tighter">
                  EW
                </div>
                <div>
                  <h1 className="text-xl font-black text-blue-950 tracking-tight leading-none uppercase">
                    PRÉDIO EW
                  </h1>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                    Empreendimento Imobiliário Residencial
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Gestão Financeira & Controle Oficial de Contratos
              </p>
            </div>

            <div className="sm:text-right">
              <div className="inline-block bg-slate-100 border border-slate-300 px-3 py-1.5 rounded-lg text-right">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  Nº DO RECIBO
                </span>
                <span className="text-lg font-black font-mono text-blue-950">
                  {receipt.receiptNumber}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1 font-mono">
                Emissão: {formatDateBR(receipt.createdAt ? receipt.createdAt.slice(0, 10) : receipt.receivedDate)}
              </div>
            </div>
          </div>

          {/* Cancellation Notice if applicable */}
          {isCancelled && (
            <div className="mt-4 p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong>DOCUMENTO CANCELADO EM {formatDateBR(receipt.canceledAt?.slice(0, 10) || '')}:</strong>{' '}
                {receipt.canceledReason || 'Cancelamento administrativo.'} Este comprovante perdeu qualquer eficácia financeira ou jurídica.
              </div>
            </div>
          )}

          {/* Title Box */}
          <div className="my-6 text-center bg-slate-50 border border-slate-200 rounded-xl py-3">
            <h2 className="text-sm font-black uppercase tracking-wider text-blue-950">
              RECIBO OFICIAL DE QUITAÇÃO DE OBRIGAÇÃO FINANCEIRA
            </h2>
          </div>

          {/* Amount Box */}
          <div className="mb-6 bg-blue-50/80 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
            <span className="text-xs font-bold text-blue-900 uppercase">
              Valor Recebido:
            </span>
            <span className="text-2xl font-black text-blue-950 font-mono-numbers">
              {formatCurrency(receipt.receivedAmount)}
            </span>
          </div>

          {/* Statement Text */}
          <div className="text-sm leading-relaxed text-slate-700 space-y-4 mb-6">
            <p>
              Recebemos de <strong className="text-slate-950 font-bold uppercase">{receipt.buyerName}</strong>
              {receipt.buyerCpf && receipt.buyerCpf !== 'Pendente de complementação' && (
                <span>, inscrito(a) no CPF/MF sob o nº <strong className="font-mono">{receipt.buyerCpf}</strong></span>
              )},
              a importância de <strong className="text-slate-950 font-bold">{valorPorExtenso(receipt.receivedAmount)}</strong>,
              referente ao pagamento da obrigação contratual discriminada abaixo:
            </p>

            {/* Obligation Details Card */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs space-y-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Unidade</span>
                  <span className="font-bold text-blue-950 text-sm">{receipt.unitNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Código Contrato</span>
                  <span className="font-mono font-bold text-slate-800">{receipt.contractCode}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Parcela Ref.</span>
                  <span className="font-bold text-slate-800">{receipt.installmentDescription}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Vencimento Original</span>
                  <span className="font-bold text-slate-800">{formatDateBR(receipt.installmentDueDate)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200/80">
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Forma de Pagamento</span>
                  <span className="font-bold text-slate-800 uppercase">{receipt.paymentMethod}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Data Efetivação</span>
                  <span className="font-bold text-emerald-700">{formatDateBR(receipt.receivedDate)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Favorecido / Recebedor</span>
                  <span className="font-bold text-slate-800">{receipt.recipientName}</span>
                </div>
              </div>
            </div>

            {/* Balance Progression Box */}
            <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-slate-500">Saldo devedor anterior: </span>
                <strong className="text-slate-700 font-mono">{formatCurrency(receipt.previousBalance)}</strong>
              </div>
              <div>
                <span className="text-emerald-800 font-bold">Amortizado neste ato: </span>
                <strong className="text-emerald-900 font-mono">{formatCurrency(receipt.receivedAmount)}</strong>
              </div>
              <div>
                <span className="text-slate-500">Novo saldo devedor: </span>
                <strong className="text-blue-950 font-black font-mono">{formatCurrency(receipt.newBalance)}</strong>
              </div>
            </div>

            <p className="text-xs text-slate-500 text-justify pt-1">
              Pelo presente, damos quitação irrevogável e irretratável tão somente do valor e da parcela especificados acima, permanecendo íntegras e válidas todas as demais obrigações contratuais, vincendas ou vencidas, ajustadas no respectivo Instrumento Particular de Promessa de Compra e Venda do PRÉDIO EW.
            </p>

            {receipt.notes && (
              <p className="text-xs text-slate-500 italic bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                Observações: {receipt.notes}
              </p>
            )}
          </div>

          {/* Signature Section */}
          <div className="mt-12 pt-6 border-t border-slate-200">
            <div className="text-right text-xs text-slate-600 mb-10">
              Rio de Janeiro — RJ, {formatDateBR(receipt.receivedDate)}.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4">
              <div className="text-center">
                <div className="border-t border-slate-800 pt-2 w-3/4 mx-auto">
                  <p className="text-xs font-extrabold text-blue-950 uppercase">{receipt.recipientName}</p>
                  <p className="text-[10px] text-slate-500">PRÉDIO EW Empreendimentos</p>
                  {receipt.pixKey && (
                    <p className="text-[9px] font-mono text-slate-400">PIX: {receipt.pixKey}</p>
                  )}
                </div>
              </div>

              <div className="text-center">
                <div className="border-t border-slate-400 pt-2 w-3/4 mx-auto">
                  <p className="text-xs font-bold text-slate-800 uppercase">{receipt.buyerName}</p>
                  <p className="text-[10px] text-slate-500">Comprador(a) / Pagador(a)</p>
                  <p className="text-[9px] font-mono text-slate-400">Visto / Reconhecimento</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer watermark note */}
          <div className="mt-12 text-center text-[10px] text-slate-400 font-mono border-t border-slate-100 pt-4">
            Controle Eletrônico de Quitações • ID: {receipt.id} • Autenticação de Auditoria: {receipt.sequentialNumber}
          </div>
        </div>
      </div>
    </div>
  );
};
