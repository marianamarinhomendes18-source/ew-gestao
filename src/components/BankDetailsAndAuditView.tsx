import React, { useState } from 'react';
import { 
  Landmark, 
  Copy, 
  Check, 
  Save, 
  ShieldCheck, 
  History,
  RotateCcw
} from 'lucide-react';
import { AuditLogEntry, BankDetails } from '../types';
import { formatDateTimeBR } from '../utils/formatters';

interface BankDetailsAndAuditViewProps {
  bankDetails: BankDetails;
  onSaveBankDetails: (updated: BankDetails) => void;
  auditLogs: AuditLogEntry[];
}

export const BankDetailsAndAuditView: React.FC<BankDetailsAndAuditViewProps> = ({
  bankDetails,
  onSaveBankDetails,
  auditLogs,
}) => {
  const [form, setForm] = useState<BankDetails>(bankDetails);
  const [copiedPix, setCopiedPix] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleCopyPix = () => {
    navigator.clipboard.writeText(form.pixKey);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveBankDetails(form);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header matching image_5c7f6c99.png */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-2">
          <Landmark className="w-5 h-5 text-blue-900" />
          <h2 className="text-xl font-extrabold text-blue-950 tracking-tight">
            Dados Bancários Oficiais & Auditoria do Sistema
          </h2>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Gerencie a conta recebedora oficial e consulte a trilha de auditoria.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Conta Recebedora Oficial matching screenshot */}
        <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Landmark className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-950">
                CONTA RECEBEDORA DA CONSTRUTORA
              </h3>
            </div>

            <button
              onClick={handleCopyPix}
              className="text-xs font-bold text-sky-700 hover:text-sky-900 flex items-center gap-1"
            >
              {copiedPix ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedPix ? 'Copiado!' : 'Copiar Pix'}</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Razão Social (Favorecido)
              </label>
              <input
                type="text"
                value={form.recipientName}
                onChange={(e) => setForm({ ...form, recipientName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-blue-700"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nome Fantasia
                </label>
                <input
                  type="text"
                  value={form.tradingName}
                  onChange={(e) => setForm({ ...form, tradingName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-blue-700"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  CNPJ Oficial
                </label>
                <input
                  type="text"
                  value={form.cnpj}
                  onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-medium focus:outline-none focus:border-blue-700"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Instituição Bancária
              </label>
              <input
                type="text"
                value={form.bankName}
                onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-blue-700"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Agência
                </label>
                <input
                  type="text"
                  value={form.agency}
                  onChange={(e) => setForm({ ...form, agency: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-blue-700"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Conta Corrente
                </label>
                <input
                  type="text"
                  value={form.account}
                  onChange={(e) => setForm({ ...form, account: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-blue-700"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Chave Pix Oficial (Aleatória / E-mail / CNPJ)
              </label>
              <input
                type="text"
                value={form.pixKey}
                onChange={(e) => setForm({ ...form, pixKey: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono text-[11px] focus:outline-none focus:border-blue-700"
              />
            </div>

            {savedSuccess && (
              <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-center font-bold">
                Dados bancários atualizados com sucesso!
              </div>
            )}

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-1.5 py-2.5 font-bold text-white bg-blue-950 hover:bg-blue-900 rounded-xl transition-colors shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Dados Bancários</span>
            </button>
          </form>
        </div>

        {/* Right Column: Trilha de Auditoria matching image_5c7f6c99.png */}
        <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-2xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-900" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-950">
                TRILHA DE AUDITORIA & HISTÓRICO DE OPERAÇÕES
              </h3>
            </div>
            <span className="text-xs font-bold text-slate-400">
              {auditLogs.length} registros auditados
            </span>
          </div>

          <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
            {auditLogs.length === 0 ? (
              <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                Nenhum log registrado até o momento.
              </div>
            ) : (
              auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="bg-white border border-slate-200 rounded-xl p-4 space-y-1 shadow-2xs hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <strong className="text-blue-950 text-xs font-black uppercase">
                      {log.action === 'pagamento' ? 'BAIXA_PAGAMENTO • PARCELA' : log.action === 'estorno' ? 'ESTORNO • PARCELA' : 'ATUALIZACAO • CONFIGURACOES'}
                    </strong>
                    <span className="text-[11px] font-mono text-slate-400">
                      {formatDateTimeBR(log.timestamp)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700">
                    {log.description} — {log.details}
                  </p>

                  <div className="text-[10px] text-slate-400 pt-1 font-mono">
                    Autor: diretoria@predioew.com.br • ID: {log.id.slice(-4)}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="text-[11px] text-center text-slate-400 pt-2 border-t border-slate-100">
            Todas as baixas, alterações de vencimento e cadastros permanecem salvos e auditados.
          </div>
        </div>
      </div>
    </div>
  );
};
