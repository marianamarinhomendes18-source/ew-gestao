import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  FileText, 
  FileSpreadsheet, 
  ExternalLink,
  DollarSign,
  TrendingUp,
  Building,
  Car,
  ChevronRight,
  ShieldCheck,
  Percent
} from 'lucide-react';
import { Contract, Installment } from '../types';
import { formatCurrency, formatDateBR } from '../utils/formatters';
import { MonthlyReceiptsDetailModal } from './MonthlyReceiptsDetailModal';
import { downloadMonthlyReceiptsDetailPDF } from '../utils/pdfGenerator';

interface DashboardOverviewProps {
  contracts: Contract[];
  onSelectContract: (contractId: string) => void;
  onOpenPaymentModal: (installment: Installment, contract: Contract) => void;
  onViewSchedule: () => void;
  onExportCSV: () => void;
  onOpenPDF?: () => void;
  onOpenNewClient?: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  contracts,
  onSelectContract,
  onOpenPaymentModal,
  onViewSchedule,
  onExportCSV,
  onOpenPDF,
  onOpenNewClient,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-11');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailModalFilter, setDetailModalFilter] = useState<'todas' | 'pagas' | 'pendentes' | 'atrasadas'>('todas');

  const handleOpenDetailModal = (filterType: 'todas' | 'pagas' | 'pendentes' | 'atrasadas' = 'todas') => {
    setDetailModalFilter(filterType);
    setIsDetailModalOpen(true);
  };

  const handleTriggerPDF = () => {
    try {
      downloadMonthlyReceiptsDetailPDF(selectedMonth, contracts);
    } catch (err) {
      console.error('Erro ao baixar PDF do mês:', err);
    }
    if (onOpenPDF) {
      onOpenPDF();
    }
  };

  // Totais consolidados
  const totalContracted = contracts.reduce((acc, c) => acc + c.totalContractedAmount, 0);
  const totalPrincipal = contracts.reduce((acc, c) => acc + c.principalAmount, 0);
  const totalInterest = contracts.reduce((acc, c) => acc + c.agreedOrEstimatedInterest, 0);

  // Total de recebimentos confirmados
  let totalReceived = 0;
  contracts.forEach((c) => {
    c.installments.forEach((inst) => {
      if (inst.paidAmount) {
        totalReceived += inst.paidAmount;
      }
    });
  });

  const remainingBalance = totalContracted - totalReceived;
  const percentReceived = totalContracted > 0 ? (totalReceived / totalContracted) * 100 : 0;
  const percentRemaining = 100 - percentReceived;

  // Parcelas do mês selecionado (padrão Nov/2026 onde ocorrem as primeiras entradas)
  let monthScheduled = 0;
  let monthReceived = 0;
  let monthPending = 0;
  let monthOverdue = 0;
  const todayStr = '2026-11-03';

  contracts.forEach((c) => {
    c.installments.forEach((inst) => {
      if (inst.dueDate.startsWith(selectedMonth)) {
        monthScheduled += inst.nominalAmount;
        if (inst.paidAmount) {
          monthReceived += inst.paidAmount;
        } else {
          monthPending += inst.nominalAmount;
          if (inst.dueDate < todayStr) {
            monthOverdue += inst.nominalAmount;
          }
        }
      }
    });
  });

  // Previsões futuras (3m, 6m, 12m, 24m a partir de Nov/2026)
  let next3m = 0;
  let next6m = 0;
  let next12m = 0;
  let next24m = 0;

  contracts.forEach((c) => {
    c.installments.forEach((inst) => {
      const d = inst.dueDate;
      // 3m: Nov/26 a Jan/27
      if (d >= '2026-11-01' && d <= '2027-01-31') next3m += inst.nominalAmount;
      // 6m: Nov/26 a Abr/27
      if (d >= '2026-11-01' && d <= '2027-04-30') next6m += inst.nominalAmount;
      // 12m: Nov/26 a Out/27
      if (d >= '2026-11-01' && d <= '2027-10-31') next12m += inst.nominalAmount;
      // 24m: Nov/26 a Out/28
      if (d >= '2026-11-01' && d <= '2028-10-31') next24m += inst.nominalAmount;
    });
  });

  return (
    <div className="space-y-5 sm:space-y-6 pb-16">
      {/* 1. Módulo Mensal: "Recebimentos de [Mês / Ano]" matching image_e5ed7c3b.png */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3 sm:space-y-4">
        {/* Row Header */}
        <div className="flex flex-col gap-2.5 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
            <h2 className="text-base sm:text-lg font-extrabold text-blue-950 tracking-tight">
              Recebimentos de {selectedMonth === '2026-11' ? 'Novembro / 2026' : selectedMonth === '2026-12' ? 'Dezembro / 2026' : selectedMonth}
            </h2>
            <span className="text-xs text-slate-400 hidden md:inline">· Toque em qualquer card para ver a lista de parcelas</span>
          </div>

          {/* Controls Strip: Two rows on mobile matching image_e5ed7c3b.png */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            {/* Mobile Line 1: Select + PDF + Planilha */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-white border-2 border-slate-300 text-slate-900 text-xs font-bold rounded-xl px-2.5 sm:px-3 py-1.5 focus:outline-none focus:border-blue-900 shadow-2xs"
              >
                <option value="2026-11">📅 Novembro / 2026</option>
                <option value="2026-12">📅 Dezembro / 2026</option>
                <option value="2027-01">📅 Janeiro / 2027</option>
                <option value="2027-02">📅 Fevereiro / 2027</option>
                <option value="2027-03">📅 Março / 2027 (Complemento)</option>
                <option value="2027-04">📅 Abril / 2027</option>
                <option value="2027-05">📅 Maio / 2027</option>
                <option value="2027-06">📅 Junho / 2027</option>
                <option value="2027-07">📅 Julho / 2027</option>
                <option value="2027-08">📅 Agosto / 2027 (Interm. 1)</option>
                <option value="2027-09">📅 Setembro / 2027</option>
                <option value="2027-10">📅 Outubro / 2027</option>
                <option value="2027-11">📅 Novembro / 2027</option>
                <option value="2027-12">📅 Dezembro / 2027</option>
                <option value="2028-01">📅 Janeiro / 2028</option>
                <option value="2028-02">📅 Fevereiro / 2028</option>
                <option value="2028-03">📅 Março / 2028</option>
                <option value="2028-04">📅 Abril / 2028 (Interm. 2)</option>
                <option value="2028-05">📅 Maio / 2028</option>
                <option value="2028-06">📅 Junho / 2028</option>
                <option value="2028-07">📅 Julho / 2028</option>
                <option value="2028-08">📅 Agosto / 2028</option>
                <option value="2028-09">📅 Setembro / 2028 (Etapa II Zana)</option>
                <option value="2028-10">📅 Outubro / 2028</option>
                <option value="2028-11">📅 Novembro / 2028 (Interm. 51k)</option>
                <option value="2028-12">📅 Dezembro / 2028 (Interm. 3)</option>
                <option value="2029-01">📅 Janeiro / 2029</option>
                <option value="2029-02">📅 Fevereiro / 2029</option>
                <option value="2029-03">📅 Março / 2029</option>
                <option value="2029-04">📅 Abril / 2029</option>
                <option value="2029-05">📅 Maio / 2029</option>
                <option value="2029-06">📅 Junho / 2029</option>
                <option value="2029-07">📅 Julho / 2029</option>
                <option value="2029-08">📅 Agosto / 2029</option>
                <option value="2029-09">📅 Setembro / 2029 (Finais)</option>
                <option value="2029-10">📅 Outubro / 2029 (Conclusão)</option>
              </select>

              {/* [ 🖨 PDF ] button matching image_e5ed7c3b.png */}
              <button
                onClick={handleTriggerPDF}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors shadow-2xs"
                title="Imprimir ou Salvar Relatório em PDF"
              >
                <FileText className="w-3.5 h-3.5 text-rose-600" />
                <span>PDF</span>
              </button>

              {/* [ 📄 Planilha ] button matching image_e5ed7c3b.png */}
              <button
                onClick={onExportCSV}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors shadow-2xs"
                title="Baixar Planilha Excel / CSV"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Planilha</span>
              </button>
            </div>

            {/* Mobile Line 2: [ Detalhes ↗ ] button matching image_e5ed7c3b.png and image_32b61fa4.png */}
            <div>
              <button
                onClick={() => handleOpenDetailModal('todas')}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-950 hover:bg-blue-900 rounded-lg transition-colors shadow-2xs"
                title="Abrir Detalhamento de Recebimentos do Mês"
              >
                <span>Detalhes</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* 4 Monthly Stat Cards in 2x2 grid matching the exact borders & text from image_e5ed7c3b.png */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {/* 1. RECEBIDO NO MÊS (Green Border-2) */}
          <div 
            onClick={() => handleOpenDetailModal('pagas')}
            className="border-2 border-emerald-500 bg-white rounded-2xl p-3 sm:p-4 shadow-2xs cursor-pointer hover:shadow-xs transition-shadow flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-emerald-700 mb-1">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">RECEBIDO NO MÊS</span>
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
              </div>
              <div className="text-base sm:text-2xl font-black text-emerald-600 font-mono-numbers">
                {formatCurrency(monthReceived)}
              </div>
              <div className="text-[10px] sm:text-xs text-slate-500 mt-0.5">Recebido em dinheiro</div>
            </div>
            <div className="mt-2.5 sm:mt-3 pt-2 border-t border-slate-100 text-[10px] sm:text-[11px] font-medium text-slate-600 flex items-center justify-between">
              <span>Toque p/ ver detalhes</span>
              <ChevronRight className="w-3 h-3 text-emerald-600" />
            </div>
          </div>

          {/* 2. PREVISTO NO MÊS (Navy Blue Border-2) */}
          <div 
            onClick={() => handleOpenDetailModal('todas')}
            className="border-2 border-blue-900 bg-white rounded-2xl p-3 sm:p-4 shadow-2xs cursor-pointer hover:shadow-xs transition-shadow flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-blue-900 mb-1">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">PREVISTO NO MÊS</span>
                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-900 shrink-0" />
              </div>
              <div className="text-base sm:text-2xl font-black text-blue-950 font-mono-numbers">
                {formatCurrency(monthScheduled)}
              </div>
              <div className="text-[10px] sm:text-xs text-slate-500 mt-0.5">Total programado</div>
            </div>
            <div className="mt-2.5 sm:mt-3 pt-2 border-t border-slate-100 text-[10px] sm:text-[11px] font-medium text-slate-600 flex items-center justify-between">
              <span>Toque p/ ver todas</span>
              <ChevronRight className="w-3 h-3 text-blue-900" />
            </div>
          </div>

          {/* 3. PENDENTE NO MÊS (Amber/Orange Border-2) */}
          <div 
            onClick={() => handleOpenDetailModal('pendentes')}
            className="border-2 border-amber-400 bg-white rounded-2xl p-3 sm:p-4 shadow-2xs cursor-pointer hover:shadow-xs transition-shadow flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-amber-600 mb-1">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">PENDENTE NO MÊS</span>
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 shrink-0" />
              </div>
              <div className="text-base sm:text-2xl font-black text-amber-600 font-mono-numbers">
                {formatCurrency(monthPending)}
              </div>
              <div className="text-[10px] sm:text-xs text-slate-500 mt-0.5">A vencer ou em cobrança</div>
            </div>
            <div className="mt-2.5 sm:mt-3 pt-2 border-t border-slate-100 text-[10px] sm:text-[11px] font-medium text-slate-600 flex items-center justify-between">
              <span>Toque p/ ver pendências</span>
              <ChevronRight className="w-3 h-3 text-amber-600" />
            </div>
          </div>

          {/* 4. VALORES VENCIDOS (Red Border-2) */}
          <div 
            onClick={() => handleOpenDetailModal('atrasadas')}
            className="border-2 border-rose-500 bg-white rounded-2xl p-3 sm:p-4 shadow-2xs cursor-pointer hover:shadow-xs transition-shadow flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-rose-600 mb-1">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">VALORES VENCIDOS</span>
                <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-500 shrink-0" />
              </div>
              <div className="text-base sm:text-2xl font-black text-rose-600 font-mono-numbers">
                {formatCurrency(monthOverdue)}
              </div>
              <div className="text-[10px] sm:text-xs text-slate-500 mt-0.5">Atrasos em aberto</div>
            </div>
            <div className="mt-2.5 sm:mt-3 pt-2 border-t border-slate-100 text-[10px] sm:text-[11px] font-medium text-slate-600 flex items-center justify-between">
              <span>Toque p/ ver atrasos</span>
              <ChevronRight className="w-3 h-3 text-rose-600" />
            </div>
          </div>
        </div>
      </div>


      {/* 2. Three Big Metric Banners matching screenshot */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* VGV TOTAL NEGOCIADO */}
        <div className="bg-white border-2 border-slate-200/90 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
            VGV TOTAL NEGOCIADO
          </span>
          <div className="text-3xl font-black text-blue-950 font-mono-numbers">
            {formatCurrency(totalContracted)}
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            4 operações ativas do empreendimento
          </p>
        </div>

        {/* TOTAL GERAL RECEBIDO */}
        <div className="bg-white border-2 border-emerald-200 rounded-2xl p-5 shadow-xs relative">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
            TOTAL GERAL RECEBIDO
          </span>
          <div className="text-3xl font-black text-emerald-600 font-mono-numbers">
            {formatCurrency(totalReceived)}
          </div>
          <span className="absolute top-5 right-5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            {percentReceived.toFixed(1)}% do VGV
          </span>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Soma de entradas + parcelas quitadas
          </p>
        </div>

        {/* SALDO A RECEBER */}
        <div className="bg-white border-2 border-sky-200 rounded-2xl p-5 shadow-xs relative">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
            SALDO A RECEBER
          </span>
          <div className="text-3xl font-black text-sky-600 font-mono-numbers">
            {formatCurrency(remainingBalance)}
          </div>
          <span className="absolute top-5 right-5 text-[11px] font-bold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
            {percentRemaining.toFixed(1)}% restante
          </span>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Fluxo contratual futuro
          </p>
        </div>
      </div>

      {/* 3. Discriminativo Especial: Sem misturar dinheiro com ativos / juros */}
      <div className="space-y-2">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-600 px-1">
          DISCRIMINAÇÃO DOS VALORES RECEBIDOS (SEM MISTURAR DINHEIRO COM ATIVOS IMOBILIZADOS)
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Em Dinheiro */}
          <div className="bg-white border border-emerald-200/90 rounded-xl p-4 shadow-2xs">
            <div className="flex items-center justify-between text-emerald-700 text-xs font-bold mb-1">
              <span>1. RECEBIDO EM DINHEIRO (LIQUIDEZ)</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
            <div className="text-2xl font-black text-emerald-600 font-mono-numbers">
              {formatCurrency(totalReceived)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              TED, Pix e parcelas quitadas mediante lançamento de comprovantes.
            </p>
          </div>

          {/* Card 2: Valor Principal */}
          <div className="bg-white border border-blue-200/90 rounded-xl p-4 shadow-2xs">
            <div className="flex items-center justify-between text-blue-900 text-xs font-bold mb-1">
              <span>2. VALOR PRINCIPAL CONTRATADO</span>
              <Building className="w-3.5 h-3.5 text-blue-800" />
            </div>
            <div className="text-2xl font-black text-blue-900 font-mono-numbers">
              {formatCurrency(totalPrincipal)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Zana (250k), Jennifer (320k), Carla Cob 01 (420k) e Joyce & Wagner Cob 04 (420k).
            </p>
          </div>

          {/* Card 3: Juros Convencionados / Estimados */}
          <div className="bg-white border border-purple-200/90 rounded-xl p-4 shadow-2xs">
            <div className="flex items-center justify-between text-purple-800 text-xs font-bold mb-1">
              <span>3. JUROS REMUNERATÓRIOS EXPRESSOS</span>
              <Percent className="w-3.5 h-3.5 text-purple-700" />
            </div>
            <div className="text-2xl font-black text-purple-700 font-mono-numbers">
              {formatCurrency(totalInterest)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Zana (10k conv.), Jennifer (12.217,44 est.), Carla Cob 01 (12k conv.) e Joyce Cob 04 (15k conv.).
            </p>
          </div>
        </div>
      </div>

      {/* 4. OPERAÇÕES ATIVAS DA CONSTRUTORA / EMPREENDIMENTO (Cards matching image_6f675baf.png) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-blue-950 tracking-tight">
                OPERAÇÕES ATIVAS DO EMPREENDIMENTO
              </h3>
              <span className="w-5 h-5 rounded-full bg-blue-900 text-white text-[11px] flex items-center justify-center font-bold">
                {contracts.length}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Todas as unidades e compradores com contratos ativos do PRÉDIO EW.
            </p>
          </div>

          {/* Action Controls & Segmented [Cards] [Tabela] */}
          <div className="flex items-center gap-2">
            {onOpenNewClient && (
              <button
                onClick={onOpenNewClient}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-950 hover:bg-blue-900 rounded-lg shadow-2xs transition-colors"
                title="Cadastrar Novo Cliente"
              >
                <span>+ Novo Cliente</span>
              </button>
            )}

            <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1 rounded-md transition-all ${
                  viewMode === 'cards'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Cards
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1 rounded-md transition-all ${
                  viewMode === 'table'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tabela
              </button>
            </div>
          </div>
        </div>

        {/* View Mode: CARDS (Identical to image_6f675baf.png) */}
        {/* View Mode: CARDS (Identical to image_af46357d.png) */}
        {viewMode === 'cards' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contracts.map((contract) => {
              const contractReceived = contract.installments.reduce(
                (acc, i) => acc + (i.paidAmount || 0),
                0
              );
              const contractBalance = contract.totalContractedAmount - contractReceived;
              const percentPaid = (contractReceived / contract.totalContractedAmount) * 100;

              return (
                <div
                  key={contract.id}
                  onClick={() => onSelectContract(contract.id)}
                  className="bg-white border border-slate-200/90 hover:border-blue-400 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    {/* Top row: Name & Valor Negócio matching image_af46357d.png */}
                    <div className="flex items-start justify-between gap-2 mb-0.5">
                      <div className="pr-2">
                        <h4 className="text-base font-bold text-slate-900 group-hover:text-blue-900 transition-colors leading-snug">
                          {contract.buyer.name}
                        </h4>
                        <div className="text-xs text-slate-500 font-medium mt-0.5">
                          Unidade: <strong className="text-slate-900 font-bold">{contract.unit.unitNumber}</strong>
                          {contract.code.includes('COB') && (
                            <span className="ml-2 text-[9px] bg-sky-500 text-white font-bold px-1.5 py-0.2 rounded">
                              COBERTURA
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          VALOR NEGÓCIO
                        </span>
                        <span className="text-base sm:text-lg font-black text-slate-950 font-mono-numbers block">
                          {formatCurrency(contract.totalContractedAmount)}
                        </span>
                      </div>
                    </div>

                    {/* 3 Mini Columns: DINHEIRO | PERMUTAS | BENS/DIREITOS matching image_af46357d.png */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-50/90 rounded-xl p-2.5 my-3.5 border border-slate-100 text-center">
                      <div>
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">
                          DINHEIRO
                        </span>
                        <strong className="text-xs font-bold text-emerald-600 font-mono-numbers block mt-0.5">
                          {formatCurrency(contractReceived > 0 ? contractReceived : contract.principalAmount)}
                        </strong>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                          PERMUTAS
                        </span>
                        <strong className="text-xs font-bold text-blue-800 font-mono-numbers block mt-0.5">
                          R$ 0,00
                        </strong>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider block">
                          BENS/DIREITOS
                        </span>
                        <strong className="text-xs font-bold text-purple-700 font-mono-numbers block mt-0.5">
                          R$ 0,00
                        </strong>
                      </div>
                    </div>

                    {/* Progress Bar & Saldo a Receber matching image_af46357d.png */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-sky-600 font-bold">
                          Saldo a Receber: <strong className="text-sky-600 font-mono-numbers font-black">{formatCurrency(contractBalance)}</strong>
                        </span>
                        <span className="text-slate-500 font-mono-numbers text-[11px] font-medium">
                          {percentPaid.toFixed(0)}% pago
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-600 h-full transition-all duration-300 rounded-full"
                          style={{ width: `${Math.max(percentPaid, 0)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bottom Footer Link in Cyan matching image_af46357d.png */}
                  <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-sky-500 hover:text-sky-600">
                    <span>Toque para ver parcelas e histórico</span>
                    <ChevronRight className="w-4 h-4 text-sky-500 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* View Mode: TABELA */
          <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Código / Operação</th>
                    <th className="px-5 py-3.5">Unidade</th>
                    <th className="px-5 py-3.5">Comprador(es)</th>
                    <th className="px-5 py-3.5 text-right">Principal</th>
                    <th className="px-5 py-3.5 text-right">Juros</th>
                    <th className="px-5 py-3.5 text-right">Total Contratado</th>
                    <th className="px-5 py-3.5 text-right">Recebido</th>
                    <th className="px-5 py-3.5 text-right">Saldo Devedor</th>
                    <th className="px-5 py-3.5 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {contracts.map((c) => {
                    const rec = c.installments.reduce((acc, i) => acc + (i.paidAmount || 0), 0);
                    const bal = c.totalContractedAmount - rec;
                    return (
                      <tr 
                        key={c.id} 
                        onClick={() => onSelectContract(c.id)}
                        className="hover:bg-slate-50 cursor-pointer"
                      >
                        <td className="px-5 py-3.5 font-bold text-blue-950">{c.code}</td>
                        <td className="px-5 py-3.5 font-medium text-slate-800">{c.unit.unitNumber}</td>
                        <td className="px-5 py-3.5 font-semibold text-slate-900">{c.buyer.name}</td>
                        <td className="px-5 py-3.5 text-right font-mono-numbers text-slate-700">{formatCurrency(c.principalAmount)}</td>
                        <td className="px-5 py-3.5 text-right font-mono-numbers text-purple-700 font-semibold">{c.agreedOrEstimatedInterest > 0 ? formatCurrency(c.agreedOrEstimatedInterest) : '-'}</td>
                        <td className="px-5 py-3.5 text-right font-mono-numbers font-bold text-slate-950">{formatCurrency(c.totalContractedAmount)}</td>
                        <td className="px-5 py-3.5 text-right font-mono-numbers font-bold text-emerald-600">{formatCurrency(rec)}</td>
                        <td className="px-5 py-3.5 text-right font-mono-numbers font-bold text-sky-700">{formatCurrency(bal)}</td>
                        <td className="px-5 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => onSelectContract(c.id)}
                            className="px-2.5 py-1 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg"
                          >
                            Dossiê
                          </button>
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

      {/* 5. PREVISÃO DOS PRÓXIMOS MESES (Deep Blue Banner matching image_045920c6.png) */}
      <div className="bg-[#0b285b] bg-gradient-to-br from-[#0c2f6d] to-[#124288] rounded-3xl p-5 sm:p-6 text-white shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/15">
          <h3 className="text-sm font-extrabold tracking-wide uppercase text-sky-300">
            PREVISÃO DOS PRÓXIMOS MESES
          </h3>
          <button
            onClick={onViewSchedule}
            className="px-3.5 py-1.5 text-xs font-bold bg-white text-blue-950 hover:bg-slate-100 rounded-xl shadow-xs transition-colors active:scale-95"
          >
            Ver Fluxo Completo
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Próximos 3m */}
          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-4 border border-white/10 text-center">
            <span className="text-[11px] font-semibold text-sky-200 block mb-1">
              Próximos 3m
            </span>
            <div className="text-lg sm:text-2xl font-black font-mono-numbers text-white">
              {formatCurrency(next3m)}
            </div>
          </div>

          {/* Próximos 6m */}
          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-4 border border-white/10 text-center">
            <span className="text-[11px] font-semibold text-sky-200 block mb-1">
              Próximos 6m
            </span>
            <div className="text-lg sm:text-2xl font-black font-mono-numbers text-white">
              {formatCurrency(next6m)}
            </div>
          </div>

          {/* Próximos 12m */}
          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-4 border border-white/10 text-center">
            <span className="text-[11px] font-semibold text-sky-200 block mb-1">
              Próximos 12m
            </span>
            <div className="text-lg sm:text-2xl font-black font-mono-numbers text-white">
              {formatCurrency(next12m)}
            </div>
          </div>

          {/* Próximos 24m */}
          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-4 border border-white/10 text-center">
            <span className="text-[11px] font-semibold text-sky-200 block mb-1">
              Próximos 24m
            </span>
            <div className="text-lg sm:text-2xl font-black font-mono-numbers text-white">
              {formatCurrency(next24m)}
            </div>
          </div>
        </div>
      </div>

      {/* Detalhamento de Recebimentos Modal matching image_32b61fa4.png */}
      <MonthlyReceiptsDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        selectedMonth={selectedMonth}
        contracts={contracts}
        initialFilter={detailModalFilter}
        onSelectContract={onSelectContract}
        onOpenPaymentModal={onOpenPaymentModal}
      />
    </div>
  );
};
