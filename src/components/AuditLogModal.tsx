import React, { useRef } from 'react';
import { 
  X, 
  History, 
  Download, 
  Upload, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import { AuditLogEntry, Contract } from '../types';
import { formatDateTimeBR, formatCurrency } from '../utils/formatters';

interface AuditLogModalProps {
  logs: AuditLogEntry[];
  contracts: Contract[];
  onClose: () => void;
  onExportJSON: () => void;
  onImportJSON: (importedContracts: Contract[]) => void;
  onResetAllData: () => void;
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({
  logs,
  contracts,
  onClose,
  onExportJSON,
  onImportJSON,
  onResetAllData,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (parsed.contracts && Array.isArray(parsed.contracts)) {
          onImportJSON(parsed.contracts);
          alert('Backup importado com sucesso!');
          onClose();
        } else {
          alert('Arquivo de backup inválido.');
        }
      } catch (err) {
        alert('Erro ao processar arquivo JSON.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetConfirm = () => {
    if (
      window.confirm(
        'ATENÇÃO: Deseja realmente reiniciar o sistema para o estado original dos contratos (R$ 0,00 de recebimentos)? Todos os lançamentos serão revertidos.'
      )
    ) {
      onResetAllData();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 no-print">
      <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-slate-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-sky-700 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <History className="w-5 h-5 text-sky-300" />
            <div>
              <h3 className="text-base font-extrabold text-white tracking-tight">
                Auditoria & Gestão de Dados · PRÉDIO EW
              </h3>
              <p className="text-xs text-sky-100">
                Histórico de baixas, estornos e opções de backup do sistema
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs bg-slate-50/50">
          {/* Action Tools */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-2xs">
            <div>
              <strong className="text-slate-900 block text-sm">Backup do Banco de Dados</strong>
              <span className="text-slate-500">
                Salvar ou restaurar o estado completo com todos os lançamentos
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onExportJSON}
                className="flex items-center gap-1.5 px-3 py-1.5 font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-blue-900" />
                <span>Exportar JSON</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-xl transition-colors shadow-2xs"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Restaurar JSON</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />

              <button
                onClick={handleResetConfirm}
                className="flex items-center gap-1.5 px-3 py-1.5 font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors"
                title="Reiniciar para R$ 0,00 recebidos"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Resetar Dados</span>
              </button>
            </div>
          </div>

          {/* Audit Log Entries List */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Registros de Movimentação ({logs.length})
            </h4>

            {logs.length === 0 ? (
              <div className="p-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
                Nenhum lançamento ou alteração registrada até o momento.
              </div>
            ) : (
              <div className="space-y-2">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1 shadow-2xs"
                  >
                    <div className="flex items-center justify-between text-slate-500">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          log.action === 'pagamento'
                            ? 'bg-emerald-100 text-emerald-800'
                            : log.action === 'estorno'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {log.action}
                        </span>
                        <strong className="text-slate-900">{log.description}</strong>
                        <span>•</span>
                        <span>{log.unitNumber}</span>
                      </div>
                      <span className="font-mono text-[11px] text-slate-400">{formatDateTimeBR(log.timestamp)}</span>
                    </div>

                    <div className="text-slate-700">{log.details}</div>
                    {log.amount !== undefined && (
                      <div className="font-mono text-emerald-600 font-bold">
                        Valor: {formatCurrency(log.amount)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-colors shadow-2xs"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
