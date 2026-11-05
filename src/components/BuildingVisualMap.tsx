import React from 'react';
import { 
  Building, 
  Home, 
  Car, 
  CheckCircle2, 
  User, 
  ChevronRight
} from 'lucide-react';
import { Contract } from '../types';
import { formatCurrency } from '../utils/formatters';

interface BuildingVisualMapProps {
  contracts: Contract[];
  onSelectContract: (contractId: string) => void;
}

export const BuildingVisualMap: React.FC<BuildingVisualMapProps> = ({
  contracts,
  onSelectContract,
}) => {
  const getContractByUnit = (unitSnippet: string) => {
    return contracts.find((c) => c.unit.unitNumber.includes(unitSnippet));
  };

  const cob01 = getContractByUnit('01');
  const cob04 = getContractByUnit('04');
  const ap301 = getContractByUnit('301');
  const ap108 = getContractByUnit('108');

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-extrabold text-blue-950 tracking-tight">
            Unidades & Modelo Arquitetônico · PRÉDIO EW
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Distribuição vertical e mapa de ocupação das 4 unidades do empreendimento.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-lg font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>100% Comercializado (4 de 4 unidades formalizadas)</span>
        </div>
      </div>

      {/* Building Diagram */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 lg:p-8 space-y-8 shadow-xs">
        {/* Roof / Coberturas Level */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-blue-950 pb-2 border-b border-slate-200">
            <span className="flex items-center gap-2">
              <Building className="w-4 h-4 text-blue-900" />
              <span>Pavimento Cobertura · Unidades Privativas</span>
            </span>
            <span className="text-slate-500 font-mono-numbers">2 Unidades</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cob01 && (
              <div 
                onClick={() => onSelectContract(cob01.id)}
                className="bg-slate-50 border border-slate-200 hover:border-blue-400 rounded-2xl p-5 cursor-pointer transition-all hover:bg-white shadow-2xs group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-base font-extrabold text-blue-950 group-hover:text-blue-700">
                    {cob01.unit.unitNumber}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Comercializada
                  </span>
                </div>

                <div className="text-xs text-slate-700 mb-1 font-semibold">
                  Compradora: <strong className="text-slate-900">{cob01.buyer.name}</strong>
                </div>
                <div className="text-xs text-slate-500 space-y-1 mb-3">
                  <div>2 Quartos (1 Suíte) • Varandão Gourmet • Lavabo</div>
                  <div className="flex items-center gap-2 text-slate-600 font-medium">
                    <Car className="w-3.5 h-3.5 text-blue-900" />
                    <span>1 Vaga Auto • Espaço p/ Motocicleta</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Valor Total:</span>
                  <span className="font-mono-numbers font-black text-blue-950 text-sm">
                    {formatCurrency(cob01.totalContractedAmount)}
                  </span>
                </div>
              </div>
            )}

            {cob04 && (
              <div 
                onClick={() => onSelectContract(cob04.id)}
                className="bg-slate-50 border border-slate-200 hover:border-blue-400 rounded-2xl p-5 cursor-pointer transition-all hover:bg-white shadow-2xs group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-base font-extrabold text-blue-950 group-hover:text-blue-700">
                    {cob04.unit.unitNumber}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Comercializada
                  </span>
                </div>

                <div className="text-xs text-slate-700 mb-1 font-semibold">
                  Compradores: <strong className="text-slate-900">{cob04.buyer.name}</strong>
                </div>
                <div className="text-xs text-slate-500 space-y-1 mb-3">
                  <div>2 Quartos (1 Suíte) • Varandão Gourmet • Lavabo</div>
                  <div className="flex items-center gap-2 text-slate-600 font-medium">
                    <Car className="w-3.5 h-3.5 text-blue-900" />
                    <span>1 Vaga Auto • Sem vaga de moto</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Valor Total:</span>
                  <span className="font-mono-numbers font-black text-blue-950 text-sm">
                    {formatCurrency(cob04.totalContractedAmount)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 3rd Floor Level */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-blue-950 pb-2 border-b border-slate-200">
            <span className="flex items-center gap-2">
              <Home className="w-4 h-4 text-blue-900" />
              <span>3º Pavimento Tipo</span>
            </span>
            <span className="text-slate-500 font-mono-numbers">Apartamento de Frente</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ap301 && (
              <div 
                onClick={() => onSelectContract(ap301.id)}
                className="bg-slate-50 border border-slate-200 hover:border-blue-400 rounded-2xl p-5 cursor-pointer transition-all hover:bg-white shadow-2xs group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-base font-extrabold text-blue-950 group-hover:text-blue-700">
                    {ap301.unit.unitNumber}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Comercializada
                  </span>
                </div>

                <div className="text-xs text-slate-700 mb-1 font-semibold">
                  Compradora: <strong className="text-slate-900">{ap301.buyer.name}</strong>
                </div>
                <div className="text-xs text-slate-500 space-y-1 mb-3">
                  <div>Posição: {ap301.unit.position}</div>
                  <div>2 Quartos (1 Suíte) • Varanda gourmet de frente • Sem vaga de garagem</div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Total Projetado:</span>
                  <span className="font-mono-numbers font-black text-blue-950 text-sm">
                    {formatCurrency(ap301.totalContractedAmount)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 1st Floor Level */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-blue-950 pb-2 border-b border-slate-200">
            <span className="flex items-center gap-2">
              <Home className="w-4 h-4 text-blue-900" />
              <span>1º Pavimento Tipo</span>
            </span>
            <span className="text-slate-500 font-mono-numbers">Apartamento de Fundos</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ap108 && (
              <div 
                onClick={() => onSelectContract(ap108.id)}
                className="bg-slate-50 border border-slate-200 hover:border-blue-400 rounded-2xl p-5 cursor-pointer transition-all hover:bg-white shadow-2xs group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-base font-extrabold text-blue-950 group-hover:text-blue-700">
                    {ap108.unit.unitNumber}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Comercializada
                  </span>
                </div>

                <div className="text-xs text-slate-700 mb-1 font-semibold">
                  Compradora: <strong className="text-slate-900">{ap108.buyer.name}</strong>
                </div>
                <div className="text-xs text-slate-500 space-y-1 mb-3">
                  <div>Posição: {ap108.unit.position}</div>
                  <div>Sinal R$ 10k (arras confirmatórias) • Juros de R$ 10k convencionados</div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Total Contratado:</span>
                  <span className="font-mono-numbers font-black text-blue-950 text-sm">
                    {formatCurrency(ap108.totalContractedAmount)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
