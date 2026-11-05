import React from 'react';
import { 
  Building2, 
  User, 
  Calendar, 
  DollarSign, 
  AlertTriangle, 
  FileText, 
  Printer, 
  ArrowRight,
  ShieldAlert,
  Car,
  Home,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { Contract } from '../types';
import { formatCurrency, formatDateBR } from '../utils/formatters';

interface ContractsListProps {
  contracts: Contract[];
  onSelectContract: (contractId: string) => void;
  onPrintContractStatement: (contract: Contract) => void;
  onOpenNewClient?: () => void;
}

export const ContractsList: React.FC<ContractsListProps> = ({
  contracts,
  onSelectContract,
  onPrintContractStatement,
  onOpenNewClient,
}) => {
  return (
    <div className="space-y-6 pb-16">
      {/* Section Header matching screenshot aesthetic */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-extrabold text-blue-950 tracking-tight">
            Contratos & Compradores · PRÉDIO EW
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestão individualizada das operações formalizadas do empreendimento.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onOpenNewClient && (
            <button
              onClick={onOpenNewClient}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-950 hover:bg-blue-900 rounded-xl transition-colors shadow-2xs"
            >
              <User className="w-3.5 h-3.5 text-sky-300" />
              <span>+ Incluir Novo Comprador</span>
            </button>
          )}
          <div className="text-xs text-sky-800 bg-sky-50 px-3 py-1.5 rounded-xl border border-sky-200 font-medium hidden md:block">
            {contracts.length} Contratos Ativos
          </div>
        </div>
      </div>

      {/* Contracts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {contracts.map((contract) => {
          const totalReceived = contract.installments.reduce(
            (acc, i) => acc + (i.paidAmount || 0),
            0
          );
          const remainingBalance = contract.totalContractedAmount - totalReceived;
          const paidInstallments = contract.installments.filter((i) => i.paidDate).length;
          const progressPercent = (totalReceived / contract.totalContractedAmount) * 100;

          return (
            <div
              key={contract.id}
              className="bg-white border border-slate-200/90 hover:border-blue-400 rounded-2xl p-6 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header Card: Operação & Código */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-blue-950 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                      {contract.operationNumber}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-500">
                      {contract.code}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    ATIVO
                  </span>
                </div>

                {/* Unidade e Comprador */}
                <div className="space-y-3 mb-5">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                      UNIDADE IMOBILIÁRIA
                    </span>
                    <div className="text-lg font-black text-blue-950">
                      {contract.unit.unitNumber}
                    </div>
                    <div className="text-xs text-slate-600 font-medium">
                      {contract.unit.position}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                      <span>{contract.unit.bedrooms} Quartos ({contract.unit.suites} Suíte)</span>
                      {contract.unit.hasGourmetBalcony && <span>• Varanda Gourmet</span>}
                      {contract.unit.carParkingSpaces > 0 ? (
                        <span>• {contract.unit.carParkingSpaces} Vaga Auto</span>
                      ) : (
                        <span>• Sem vaga auto</span>
                      )}
                      {contract.unit.motorcycleParkingSpaces > 0 && (
                        <span>• Guarda de moto</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                      COMPRADOR(A)
                    </span>
                    <div className="text-base font-bold text-slate-900">
                      {contract.buyer.name}
                    </div>
                    <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2 mt-0.5">
                      <span>Profissão: {contract.buyer.profession}</span>
                      <span>•</span>
                      <span>Estado Civil: {contract.buyer.maritalStatus}</span>
                    </div>

                    {/* Alerta de Documentação / CPF Pendente (Op 01) */}
                    {contract.buyer.personalDocsStatus === 'pendente' && (
                      <div className="mt-2.5 text-xs bg-amber-50 border border-amber-200 text-amber-900 p-2.5 rounded-xl flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                        <span>CPF e documentos pessoais pendentes de complementação formal.</span>
                      </div>
                    )}

                    {/* Alerta de Juros Estimados (Op 02) */}
                    {contract.rules.hasEstimatedInterest && (
                      <div className="mt-2.5 text-xs bg-purple-50 border border-purple-200 text-purple-900 p-2.5 rounded-xl flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 shrink-0 text-purple-600" />
                        <span>Juros de R$ 12.217,44 estimados. Conferir antes da assinatura definitiva.</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Mini Metric strip */}
                <div className="grid grid-cols-3 gap-2 bg-slate-50/80 rounded-xl p-3 my-4 border border-slate-100 text-center">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      RECEBIDO
                    </span>
                    <strong className="text-xs font-bold text-emerald-600 font-mono-numbers">
                      {formatCurrency(totalReceived)}
                    </strong>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      PRINCIPAL
                    </span>
                    <strong className="text-xs font-bold text-slate-800 font-mono-numbers">
                      {formatCurrency(contract.principalAmount)}
                    </strong>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      JUROS
                    </span>
                    <strong className="text-xs font-bold text-purple-700 font-mono-numbers">
                      {contract.agreedOrEstimatedInterest > 0
                        ? formatCurrency(contract.agreedOrEstimatedInterest)
                        : 'R$ 0,00'}
                    </strong>
                  </div>
                </div>

                {/* Progresso de Pagamento & Saldo */}
                <div className="space-y-1.5 mb-5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-sky-800">
                      Saldo a Receber: <strong className="text-blue-950 font-mono-numbers">{formatCurrency(remainingBalance)}</strong>
                    </span>
                    <span className="text-slate-500 font-mono-numbers text-[11px]">
                      {paidInstallments} de {contract.installments.length} parcelas ({progressPercent.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <button
                  onClick={() => onPrintContractStatement(contract)}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-colors shadow-2xs"
                  title="Imprimir Extrato Completo da Unidade"
                >
                  <Printer className="w-3.5 h-3.5 text-blue-900" />
                  <span>Imprimir Extrato</span>
                </button>

                <button
                  onClick={() => onSelectContract(contract.id)}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-xl transition-colors shadow-xs"
                >
                  <span>Abrir Dossiê</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
