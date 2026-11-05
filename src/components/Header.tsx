import React, { useState, useRef, useEffect } from 'react';
import { 
  Building2, 
  Download, 
  RotateCw, 
  PlusCircle, 
  UserPlus,
  Menu,
  FileSpreadsheet,
  Printer,
  ChevronDown,
  CreditCard
} from 'lucide-react';

interface HeaderProps {
  onOpenMobileMenu?: () => void;
  onOpenAuditLog: () => void;
  onExportCSV: () => void;
  onExportPDF: () => void;
  onExportJSON: () => void;
  onQuickPayment: () => void;
  onOpenNewClient: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMobileMenu,
  onOpenAuditLog,
  onExportCSV,
  onExportPDF,
  onExportJSON,
  onQuickPayment,
  onOpenNewClient,
}) => {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200/90 px-2.5 sm:px-6 py-2 sm:py-2.5 shadow-2xs no-print">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
        {/* Left Side: Mobile Hamburger + Logo Zone */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Hamburger Icon for Mobile Drawer (matching image_e5ed7c3b.png) */}
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-1.5 -ml-1 text-slate-700 hover:text-blue-950 hover:bg-slate-100 rounded-lg transition-colors"
            title="Abrir Menu de Navegação"
            aria-label="Abrir Menu"
          >
            <Menu className="w-5 h-5 text-slate-800" />
          </button>

          {/* Circular Logo Zone matching reference */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-blue-950 border-2 border-sky-400 flex items-center justify-center text-white shadow-xs shrink-0">
              <Building2 className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-sky-300" />
            </div>
            <div>
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className="text-sm sm:text-base font-black tracking-tight text-blue-950 font-sans">
                  PRÉDIO EW
                </span>
                <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-sky-700 bg-sky-50 px-1 py-0.2 rounded border border-sky-200 hidden xs:inline">
                  EMPREENDIMENTO
                </span>
              </div>
              <div className="text-[10px] text-slate-500 font-medium truncate max-w-[110px] xs:max-w-none">
                Gestão...
              </div>
            </div>
          </div>
        </div>

        {/* Right Side Action Controls matching image_e5ed7c3b.png */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* + Novo Cliente (Desktop only) */}
          <button
            onClick={onOpenNewClient}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-950 hover:bg-blue-900 rounded-lg transition-colors shadow-2xs"
            title="Cadastrar Novo Comprador ou Contrato"
          >
            <UserPlus className="w-3.5 h-3.5 text-sky-300" />
            <span>Novo Cliente</span>
          </button>

          {/* Export Pill Dropdown [ ⬇ ⌄ ] matching image_e5ed7c3b.png */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg shadow-2xs transition-colors"
              title="Opções de Exportação (Planilha Excel e Relatório PDF)"
            >
              <Download className="w-3.5 h-3.5 text-sky-600" />
              <ChevronDown className="w-3 h-3 text-sky-600" />
            </button>

            {/* Dropdown Menu */}
            {showExportMenu && (
              <div className="absolute right-0 mt-1.5 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Exportar Dados
                </div>
                <button
                  onClick={() => {
                    setShowExportMenu(false);
                    onExportCSV();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-slate-700 hover:bg-slate-50 hover:text-emerald-700 transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <div>
                    <strong className="block font-semibold">Exportar Planilha (CSV)</strong>
                    <span className="text-[10px] text-slate-400">Compatível com Excel & Sheets</span>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setShowExportMenu(false);
                    onExportPDF();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-slate-700 hover:bg-slate-50 hover:text-blue-900 transition-colors"
                >
                  <Printer className="w-4 h-4 text-blue-900" />
                  <div>
                    <strong className="block font-semibold">Exportar Relatório (PDF)</strong>
                    <span className="text-[10px] text-slate-400">Imprimir ou Salvar em PDF</span>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Sincronizar (Desktop only) */}
          <button
            onClick={() => {
              window.location.reload();
            }}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition-colors"
            title="Sincronizar dados em tempo real"
          >
            <RotateCw className="w-3.5 h-3.5 text-sky-600" />
            <span>Sincronizar</span>
          </button>

          {/* + Baixa (Emerald Green Button matching image_e5ed7c3b.png) */}
          <button
            onClick={onQuickPayment}
            className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-all active:scale-95"
            title="Lançar recebimento / Baixa de parcela"
          >
            <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Baixa</span>
          </button>

          {/* Dark Square Avatar [ EW ] matching [ ZX ] in image_e5ed7c3b.png */}
          <div className="flex items-center gap-2">
            <div 
              onClick={onOpenAuditLog}
              className="w-8 h-8 rounded-lg bg-blue-950 text-white flex items-center justify-center font-black text-xs shadow-2xs cursor-pointer hover:bg-blue-900 transition-colors"
              title="Diretoria EW - Gestão Executiva"
            >
              EW
            </div>
            <div className="hidden xl:block text-left text-xs leading-tight">
              <strong className="text-slate-900 block font-bold text-[12px]">Diretoria EW</strong>
              <span className="text-[10px] text-slate-500">Gestão Executiva</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

