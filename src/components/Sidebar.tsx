import React from 'react';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Users, 
  CreditCard, 
  MessageSquare, 
  Building, 
  Percent, 
  BarChart3, 
  Scale, 
  FileText, 
  Printer, 
  Landmark,
  ShieldCheck
} from 'lucide-react';

interface SidebarProps {
  activeModule: string;
  setActiveModule: (module: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  setActiveModule,
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard Executivo', icon: LayoutDashboard },
    { id: 'fluxo', label: 'Fluxo Financeiro', icon: TrendingUp },
    { id: 'compradores', label: 'Compradores', icon: Users },
    { id: 'pagamentos', label: 'Controle de Pagamentos', icon: CreditCard },
    { id: 'recibos', label: 'Recibos de Pagamento', icon: ShieldCheck },
    { id: 'custos', label: 'Módulo Custos & Obras', icon: Landmark, badge: 'IA', badgeColor: 'bg-amber-500' },
    { id: 'cobranca', label: 'Central de Cobrança (WhatsApp)', icon: MessageSquare, badge: '1', badgeColor: 'bg-rose-500' },
    { id: 'unidades', label: 'Unidades & Modelo 3D', icon: Building },
    { id: 'mora', label: 'Juros, Multas & Atualização', icon: Percent },
    { id: 'relatorios', label: 'Relatórios & Exportação', icon: Printer },
    { id: 'banco', label: 'Dados Bancários & Auditoria', icon: Landmark },
  ];

  return (
    <aside className="w-64 shrink-0 bg-white border-r border-slate-200/90 min-h-[calc(100vh-65px)] flex flex-col justify-between p-4 no-print hidden lg:flex">
      <div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3 px-3">
          MÓDULOS CORPORATIVOS
        </div>

        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveModule(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span className={`w-5 h-5 rounded-full ${item.badgeColor} text-white text-[10px] flex items-center justify-center font-bold`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Status Card matching image_6f675baf.png */}
      <div className="bg-sky-50/80 border border-sky-100 rounded-xl p-3.5 text-xs">
        <div className="flex items-center gap-2 text-blue-950 font-bold mb-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span>Gestão PRÉDIO EW Ativa</span>
        </div>
        <p className="text-[11px] text-sky-800">
          Base independente: 4 unidades oficiais cadastradas e auditadas.
        </p>
      </div>
    </aside>
  );
};
