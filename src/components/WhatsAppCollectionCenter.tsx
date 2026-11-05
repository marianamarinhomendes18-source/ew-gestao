import React, { useState, useMemo } from 'react';
import { 
  MessageSquare, 
  Copy, 
  Key, 
  Landmark, 
  Search, 
  Check, 
  Clock, 
  AlertTriangle, 
  Calendar, 
  Send,
  UserCheck
} from 'lucide-react';
import { Contract, Installment, BankDetails } from '../types';
import { formatCurrency, formatDateBR, calculateContractCharges } from '../utils/formatters';

interface WhatsAppCollectionCenterProps {
  contracts: Contract[];
  bankDetails: BankDetails;
  onNavigateToBankDetails: () => void;
  onOpenPaymentModal: (installment: Installment, contract: Contract) => void;
}

const PIX_OPTIONS = [
  {
    id: 'igor',
    label: 'OPÇÃO 1 — Igor Antunes',
    holder: 'Igor Antunes',
    key: 'iradsk@icloud.com',
    type: 'E-mail',
  },
  {
    id: 'rodrigo',
    label: 'OPÇÃO 2 — Rodrigo Lopes',
    holder: 'Rodrigo Lopes',
    key: '114.926.377-69',
    type: 'CPF',
  },
];

export const WhatsAppCollectionCenter: React.FC<WhatsAppCollectionCenterProps> = ({
  contracts,
  bankDetails,
  onNavigateToBankDetails,
  onOpenPaymentModal,
}) => {
  const [activeTab, setActiveTab] = useState<'overdue' | 'today' | 'upcoming'>('overdue');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedPixKey, setCopiedPixKey] = useState<string | null>(null);

  // Data de referência de início de operação
  const referenceDateStr = '2026-11-03';

  // Coleta todas as parcelas pendentes com contrato associado
  const pendingInstallments = useMemo(() => {
    const list: { inst: Installment; contract: Contract; daysOverdue: number; isToday: boolean; isUpcoming: boolean }[] = [];

    contracts.forEach((contract) => {
      contract.installments.forEach((inst) => {
        if (!inst.paidDate) {
          const due = inst.dueDate;
          const isOverdue = due < referenceDateStr;
          const isToday = due === referenceDateStr;
          const isUpcoming = due > referenceDateStr && due <= '2026-12-05';

          const charges = calculateContractCharges(
            inst.nominalAmount,
            inst.dueDate,
            referenceDateStr,
            contract.rules.finePercent,
            contract.rules.monthlyInterestRate
          );

          list.push({
            inst,
            contract,
            daysOverdue: charges.daysOverdue,
            isToday,
            isUpcoming,
          });
        }
      });
    });

    return list;
  }, [contracts]);

  const overdueList = pendingInstallments.filter((p) => p.daysOverdue > 0);
  const todayList = pendingInstallments.filter((p) => p.isToday);
  const upcomingList = pendingInstallments.filter((p) => p.isUpcoming || (!p.daysOverdue && !p.isToday)).slice(0, 8);

  const displayedList = useMemo(() => {
    let base = activeTab === 'overdue' ? overdueList : activeTab === 'today' ? todayList : upcomingList;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      base = base.filter(
        (item) =>
          item.contract.buyer.name.toLowerCase().includes(q) ||
          item.contract.unit.unitNumber.toLowerCase().includes(q) ||
          item.inst.description.toLowerCase().includes(q)
      );
    }
    return base;
  }, [activeTab, overdueList, todayList, upcomingList, searchQuery]);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  const handleCopyPix = (keyVal: string) => {
    navigator.clipboard.writeText(keyVal);
    setCopiedPixKey(keyVal);
    setTimeout(() => setCopiedPixKey(null), 2500);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header com opções PIX Oficiais */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-900" />
              <h2 className="text-xl font-extrabold text-blue-950 tracking-tight">
                Central de Cobrança Inteligente & WhatsApp
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Geração de mensagens personalizadas oficiais com dados bancários e chaves PIX do PRÉDIO EW.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onNavigateToBankDetails}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors shadow-2xs"
            >
              <Landmark className="w-3.5 h-3.5 text-blue-900" />
              <span>Dados Bancários Gerais</span>
            </button>
          </div>
        </div>

        {/* PIX Options Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100">
          {PIX_OPTIONS.map((opt) => {
            const isCopied = copiedPixKey === opt.key;
            return (
              <div
                key={opt.id}
                className="flex items-center justify-between p-3 rounded-xl bg-blue-50/60 border border-blue-200/80 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 font-bold text-blue-950">
                    <UserCheck className="w-3.5 h-3.5 text-blue-800" />
                    <span>{opt.label}</span>
                  </div>
                  <div className="font-mono text-slate-600 font-medium">
                    PIX: <span className="text-blue-900 font-bold select-all">{opt.key}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleCopyPix(opt.key)}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-blue-100 text-blue-950 font-bold border border-blue-300 rounded-lg transition-colors shadow-2xs shrink-0 ml-2"
                  title={`Copiar chave PIX de ${opt.holder}`}
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copiada!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-blue-800" />
                      <span>📋 Copiar chave PIX</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('overdue')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'overdue'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Valores Vencidos</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeTab === 'overdue' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-700'
              }`}
            >
              {overdueList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('today')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'today'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Vence Hoje</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeTab === 'today' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
              }`}
            >
              {todayList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('upcoming')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'upcoming'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Próximos Vencimentos</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeTab === 'upcoming' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-900'
              }`}
            >
              {upcomingList.length}
            </span>
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por cliente ou unidade..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-900 text-slate-800 placeholder-slate-400"
          />
        </div>
      </div>

      {/* Cards List */}
      <div className="space-y-4">
        {displayedList.length === 0 ? (
          <div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center text-slate-500">
            <Check className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <p className="font-bold text-slate-800">Nenhuma parcela pendente nesta categoria</p>
            <p className="text-xs text-slate-400 mt-1">Todos os pagamentos foram devidamente baixados ou não há registros.</p>
          </div>
        ) : (
          displayedList.map(({ inst, contract, daysOverdue }, idx) => {
            const charges = calculateContractCharges(
              inst.nominalAmount,
              inst.dueDate,
              referenceDateStr,
              contract.rules.finePercent,
              contract.rules.monthlyInterestRate
            );

            const initialLetter = contract.buyer.name.charAt(0);
            const totalToCharge = charges.daysOverdue > 0 ? charges.totalUpdatedAmount : inst.nominalAmount;

            const messageText = `Olá, ${contract.buyer.name}! Tudo bem?

Estamos passando para lembrar que a parcela referente à unidade ${contract.unit.unitNumber}, com vencimento em ${formatDateBR(inst.dueDate)}, está disponível para pagamento.

Valor atualizado: ${formatCurrency(totalToCharge)}.

Dados para pagamento (escolha uma das opções oficiais):

OPÇÃO 1: Igor Antunes
Chave PIX: iradsk@icloud.com

OPÇÃO 2: Rodrigo Lopes
Chave PIX: 114.926.377-69

Após a efetivação, favor enviar o comprovante por aqui para emissão do seu Recibo Oficial de Quitação do PRÉDIO EW.

Agradecemos!
PRÉDIO EW Empreendimento`;

            const phone = contract.buyer.phone ? contract.buyer.phone.replace(/\D/g, '') : '5521987654321';
            const waLink = `https://wa.me/${phone}?text=${encodeURIComponent(messageText)}`;

            return (
              <div
                key={inst.id}
                className="bg-white border border-slate-200/90 rounded-2xl p-5 lg:p-6 shadow-xs space-y-4"
              >
                {/* Header of the Card */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 text-blue-950 font-black text-sm flex items-center justify-center shrink-0">
                      {initialLetter}
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-blue-950">
                        {contract.buyer.name}
                      </h3>
                      <div className="text-xs text-slate-500">
                        Unidade: <strong className="text-slate-800">{contract.unit.unitNumber}</strong> • Parcela: {inst.description} • Vencimento: <strong className="text-slate-700">{formatDateBR(inst.dueDate)}</strong>
                        {daysOverdue > 0 && (
                          <span className="ml-2 font-bold text-rose-600">
                            ({daysOverdue} dias de atraso)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      VALOR A COBRAR
                    </span>
                    <span className={`text-lg font-black font-mono-numbers ${daysOverdue > 0 ? 'text-rose-600' : 'text-blue-950'}`}>
                      {formatCurrency(totalToCharge)}
                    </span>
                  </div>
                </div>

                {/* Preformatted Message Preview */}
                <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4 font-mono text-[11px] leading-relaxed text-slate-700 whitespace-pre-line max-h-56 overflow-y-auto">
                  {messageText}
                </div>

                {/* Bottom Actions */}
                <div className="pt-2 flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-t border-slate-100">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-slate-500 mr-1">Chaves PIX:</span>
                    <button
                      onClick={() => handleCopyPix('iradsk@icloud.com')}
                      className="px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-blue-100 border border-slate-300 rounded-md transition-colors"
                    >
                      {copiedPixKey === 'iradsk@icloud.com' ? '✓ Copiado Igor' : '📋 PIX Igor'}
                    </button>
                    <button
                      onClick={() => handleCopyPix('114.926.377-69')}
                      className="px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-blue-100 border border-slate-300 rounded-md transition-colors"
                    >
                      {copiedPixKey === '114.926.377-69' ? '✓ Copiado Rodrigo' : '📋 PIX Rodrigo'}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full lg:w-auto">
                    <button
                      onClick={() => copyToClipboard(messageText, idx)}
                      className="flex items-center justify-center gap-1 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      {copiedIndex === idx ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
                      <span>{copiedIndex === idx ? 'Copiada!' : 'Copiar Texto'}</span>
                    </button>

                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>

                    <button
                      onClick={() => onOpenPaymentModal(inst, contract)}
                      className="flex items-center justify-center px-3 py-2 text-xs font-bold text-blue-900 hover:text-white bg-blue-50 hover:bg-blue-900 border border-blue-200 rounded-lg transition-colors col-span-2 sm:col-span-1"
                    >
                      Dar Baixa
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
