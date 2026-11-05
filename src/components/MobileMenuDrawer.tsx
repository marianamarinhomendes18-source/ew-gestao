import React from 'react';
import { 
  X, 
  LayoutDashboard, 
  MessageSquare, 
  Users, 
  CreditCard, 
  Building, 
  Percent, 
  Printer, 
  Landmark, 
  Download, 
  RotateCcw,
  CheckCircle2
} from 'lucide-react';

interface MobileMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeModule: string;
  setActiveModule: (module: string) => void;
  onExportCSV: () => void;
  onResetData: () => void;
}

export const MobileMenuDrawer: React.FC<MobileMenuDrawerProps> = ({
  isOpen,
  onClose,
  activeModule,
  setActiveModule,
  onExportCSV,
  onResetData,
}) => {
  if (!isOpen) return null;

  const handleSelect = (mod: string) => {
    setActiveModule(mod);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 no-print animate-in fade-in duration-150">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-base font-extrabold text-blue-950">
              Menu Geral · PRÉDIO EW
            </h3>
            <span className="text-xs text-slate-500">Módulos de gestão financeira e operacional</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modules List */}
        <div className="p-4 overflow-y-auto space-y-1.5 text-xs">
          <button
            onClick={() => handleSelect('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-left transition-colors ${
              activeModule === 'dashboard' ? 'bg-blue-900 text-white' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard Executivo</span>
          </button>

          <button
            onClick={() => handleSelect('cobranca')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold text-left transition-colors ${
              activeModule === 'cobranca' ? 'bg-blue-900 text-white' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <MessageSquare className="w-4 h-4" />
              <span>Central de Cobrança (WhatsApp)</span>
            </div>
            <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center">1</span>
          </button>

          <button
            onClick={() => handleSelect('compradores')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-left transition-colors ${
              activeModule === 'compradores' ? 'bg-blue-900 text-white' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Contratos & Compradores</span>
          </button>

          <button
            onClick={() => handleSelect('pagamentos')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-left transition-colors ${
              activeModule === 'pagamentos' ? 'bg-blue-900 text-white' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Controle de Pagamentos (136 parcelas)</span>
          </button>

          <button
            onClick={() => handleSelect('recibos')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-left transition-colors ${
              activeModule === 'recibos' ? 'bg-blue-900 text-white' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Recibos Oficiais de Pagamento</span>
          </button>

          <button
            onClick={() => handleSelect('custos')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold text-left transition-colors ${
              activeModule === 'custos' ? 'bg-blue-900 text-white' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <Landmark className="w-4 h-4 text-amber-500" />
              <span>Módulo Custos & Obras</span>
            </div>
            <span className="px-1.5 py-0.5 rounded-md bg-amber-500 text-white text-[9px] font-black">IA</span>
          </button>

          <button
            onClick={() => handleSelect('unidades')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-left transition-colors ${
              activeModule === 'unidades' ? 'bg-blue-900 text-white' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Unidades & Modelo 3D</span>
          </button>

          <button
            onClick={() => handleSelect('relatorios')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-left transition-colors ${
              activeModule === 'relatorios' ? 'bg-blue-900 text-white' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>Central de Relatórios Corporativos</span>
          </button>

          <button
            onClick={() => handleSelect('mora')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-left transition-colors ${
              activeModule === 'mora' ? 'bg-blue-900 text-white' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Percent className="w-4 h-4" />
            <span>Juros, Multas & Atualização (Mora 2%)</span>
          </button>

          <button
            onClick={() => handleSelect('banco')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-left transition-colors ${
              activeModule === 'banco' ? 'bg-blue-900 text-white' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Landmark className="w-4 h-4" />
            <span>Dados Bancários & Auditoria</span>
          </button>

          <div className="pt-3 border-t border-slate-200 space-y-2">
            <button
              onClick={() => {
                onExportCSV();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl"
            >
              <Download className="w-4 h-4 text-blue-900" />
              <span>Exportar Planilha Excel / CSV</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
