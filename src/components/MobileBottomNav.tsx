import React from 'react';
import { 
  LayoutGrid, 
  TrendingUp, 
  CreditCard, 
  Users, 
  MoreHorizontal 
} from 'lucide-react';

interface MobileBottomNavProps {
  activeModule: string;
  setActiveModule: (module: string) => void;
  onQuickPayment: () => void;
  onOpenMobileMenu: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeModule,
  setActiveModule,
  onQuickPayment,
  onOpenMobileMenu,
}) => {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 shadow-lg no-print">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {/* 1. Dashboard (with active dot below text matching image_e5ed7c3b.png) */}
        <button
          onClick={() => setActiveModule('dashboard')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
            activeModule === 'dashboard' ? 'text-blue-950 font-extrabold' : 'text-slate-400 hover:text-slate-700 font-medium'
          }`}
        >
          <LayoutGrid className={`w-5 h-5 ${activeModule === 'dashboard' ? 'text-sky-600' : 'text-slate-400'}`} />
          <span className="text-[10px] tracking-tight mt-0.5">Dashboard</span>
          {activeModule === 'dashboard' && (
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-0.5 animate-pulse" />
          )}
        </button>

        {/* 2. Fluxo */}
        <button
          onClick={() => setActiveModule('fluxo')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
            activeModule === 'fluxo' || activeModule === 'pagamentos' ? 'text-blue-950 font-extrabold' : 'text-slate-400 hover:text-slate-700 font-medium'
          }`}
        >
          <TrendingUp className={`w-5 h-5 ${activeModule === 'fluxo' || activeModule === 'pagamentos' ? 'text-sky-600' : 'text-slate-400'}`} />
          <span className="text-[10px] tracking-tight mt-0.5">Fluxo</span>
          {(activeModule === 'fluxo' || activeModule === 'pagamentos') && (
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-0.5" />
          )}
        </button>

        {/* 3. Baixas */}
        <button
          onClick={onQuickPayment}
          className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-slate-400 hover:text-emerald-700 transition-all font-medium active:scale-95"
          title="Lançar recebimento / Baixa"
        >
          <CreditCard className="w-5 h-5 text-slate-500 hover:text-emerald-600" />
          <span className="text-[10px] tracking-tight mt-0.5">Baixas</span>
        </button>

        {/* 4. Clientes */}
        <button
          onClick={() => setActiveModule('compradores')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
            activeModule === 'compradores' ? 'text-blue-950 font-extrabold' : 'text-slate-400 hover:text-slate-700 font-medium'
          }`}
        >
          <Users className={`w-5 h-5 ${activeModule === 'compradores' ? 'text-sky-600' : 'text-slate-400'}`} />
          <span className="text-[10px] tracking-tight mt-0.5">Clientes</span>
          {activeModule === 'compradores' && (
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-0.5" />
          )}
        </button>

        {/* 5. Mais (with red circle notification badge 1) */}
        <button
          onClick={onOpenMobileMenu}
          className="relative flex flex-col items-center justify-center py-1 px-3 rounded-xl text-slate-400 hover:text-slate-700 transition-all font-medium"
        >
          <span className="relative">
            <MoreHorizontal className="w-5 h-5 text-slate-500" />
            <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-extrabold flex items-center justify-center shadow-xs">
              1
            </span>
          </span>
          <span className="text-[10px] tracking-tight mt-0.5">Mais</span>
        </button>
      </div>
    </nav>
  );
};

