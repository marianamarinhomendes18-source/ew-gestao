import React, { useState } from 'react';
import { X, UserPlus, Building, DollarSign, Calendar, CheckCircle2 } from 'lucide-react';
import { Contract, Installment } from '../types';

interface NewContractModalProps {
  onClose: () => void;
  onAddContract: (newContract: Contract) => void;
  existingContractsCount: number;
}

export const NewContractModal: React.FC<NewContractModalProps> = ({
  onClose,
  onAddContract,
  existingContractsCount,
}) => {
  const [buyerName, setBuyerName] = useState('');
  const [cpf, setCpf] = useState('');
  const [rg, setRg] = useState('');
  const [phone, setPhone] = useState('');
  const [profession, setProfession] = useState('Empresário(a)');
  const [maritalStatus, setMaritalStatus] = useState('Solteiro(a)');

  const [unitNumber, setUnitNumber] = useState('');
  const [position, setPosition] = useState('Frente com varanda gourmet');
  const [bedrooms, setBedrooms] = useState(2);
  const [suites, setSuites] = useState(1);
  const [carSpaces, setCarSpaces] = useState(1);
  const [motoSpaces, setMotoSpaces] = useState(0);

  const [principalAmount, setPrincipalAmount] = useState<number>(350000);
  const [interestAmount, setInterestAmount] = useState<number>(0);

  // Geração rápida de parcelas iniciais
  const [signalAmount, setSignalAmount] = useState<number>(30000);
  const [signalDate, setSignalDate] = useState<string>('2026-11-03');
  const [installmentsCount, setInstallmentsCount] = useState<number>(24);
  const [monthlyAmount, setMonthlyAmount] = useState<number>(10000);
  const [startMonthDate, setStartMonthDate] = useState<string>('2026-12-10');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!buyerName || !unitNumber || principalAmount <= 0) {
      setErrorMessage('Por favor preencha o nome do comprador, número da unidade e valor contratado.');
      return;
    }
    setErrorMessage(null);

    const nextOpNum = existingContractsCount + 1;
    const opNumberStr = `OPERAÇÃO ${nextOpNum.toString().padStart(2, '0')}`;
    const cleanUnitId = unitNumber.replace(/\D/g, '') || Math.floor(100 + Math.random() * 900).toString();
    const contractCode = `EW-CTR-2026-${cleanUnitId}`;
    const contractId = `ew-ctr-${Date.now().toString().slice(-4)}`;

    const totalContracted = Number(principalAmount) + Number(interestAmount);

    // Gera parcelas
    const installments: Installment[] = [];
    let order = 1;

    // Sinal se houver
    if (signalAmount > 0) {
      installments.push({
        id: `${contractId}-parc-${order}`,
        contractId,
        order,
        description: 'Sinal / Entrada',
        dueDate: signalDate,
        nominalAmount: Number(signalAmount),
        type: 'entrada',
      });
      order++;
    }

    // Parcelas mensais
    if (installmentsCount > 0 && monthlyAmount > 0) {
      const [startYear, startMonth, startDay] = startMonthDate.split('-').map(Number);
      let curYear = startYear;
      let curMonth = startMonth;

      for (let i = 0; i < installmentsCount; i++) {
        const mStr = curMonth.toString().padStart(2, '0');
        const dStr = (startDay || 10).toString().padStart(2, '0');
        const due = `${curYear}-${mStr}-${dStr}`;

        installments.push({
          id: `${contractId}-parc-${order}`,
          contractId,
          order,
          description: `Mensalidade ${(i + 1).toString().padStart(2, '0')}/${installmentsCount.toString().padStart(2, '0')}`,
          dueDate: due,
          nominalAmount: Number(monthlyAmount),
          type: 'mensal',
        });
        order++;

        curMonth++;
        if (curMonth > 12) {
          curMonth = 1;
          curYear++;
        }
      }
    }

    const newContract: Contract = {
      id: contractId,
      code: contractCode,
      operationNumber: opNumberStr,
      buyer: {
        name: buyerName,
        cpf: cpf || 'Pendente de complementação',
        rg: rg || undefined,
        maritalStatus,
        profession,
        personalDocsStatus: cpf ? 'completo' : 'pendente',
      },
      unit: {
        type: unitNumber.toLowerCase().includes('cob') ? 'cobertura' : 'apartamento',
        unitNumber,
        position,
        bedrooms: Number(bedrooms),
        suites: Number(suites),
        hasGourmetBalcony: true,
        carParkingSpaces: Number(carSpaces),
        motorcycleParkingSpaces: Number(motoSpaces),
      },
      principalAmount: Number(principalAmount),
      agreedOrEstimatedInterest: Number(interestAmount),
      totalContractedAmount: totalContracted,
      rules: {
        finePercent: 2.0,
        monthlyInterestRate: 1.0,
        hasEstimatedInterest: interestAmount > 0,
      },
      specialRulesDescription: [
        'Multa moratória contratual: 2,00%.',
        'Juros de mora: 1,00% ao mês, pro rata die.',
        'Atualização monetária quando legalmente cabível.',
      ],
      installments,
      status: 'ativo',
    };

    onAddContract(newContract);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 no-print animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-sky-700 p-5 sm:p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-200 block">
                Novo Contrato · PRÉDIO EW
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                Cadastrar Novo Cliente / Comprador
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs">
          {/* Section 1: Dados do Comprador */}
          <div className="space-y-3">
            <h3 className="font-extrabold text-blue-950 uppercase tracking-wide text-xs flex items-center gap-1.5 pb-1 border-b border-slate-100">
              <span>1. Dados Pessoais do Comprador</span>
            </h3>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Nome Completo *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Carlos Eduardo de Oliveira"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-blue-700"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  CPF
                </label>
                <input
                  type="text"
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-blue-700"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Telefone / WhatsApp
                </label>
                <input
                  type="text"
                  placeholder="21 99999-9999"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-blue-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Profissão
                </label>
                <input
                  type="text"
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-700"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Estado Civil
                </label>
                <input
                  type="text"
                  value={maritalStatus}
                  onChange={(e) => setMaritalStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-700"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Unidade Imobiliária */}
          <div className="space-y-3">
            <h3 className="font-extrabold text-blue-950 uppercase tracking-wide text-xs flex items-center gap-1.5 pb-1 border-b border-slate-100">
              <Building className="w-3.5 h-3.5 text-blue-900" />
              <span>2. Unidade do PRÉDIO EW</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Identificação da Unidade *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Apartamento 201 ou Cobertura 02"
                  value={unitNumber}
                  onChange={(e) => setUnitNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-blue-700"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Posição / Vista
                </label>
                <input
                  type="text"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Quartos</label>
                <input
                  type="number"
                  min="1"
                  value={bedrooms}
                  onChange={(e) => setBedrooms(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-900 font-bold text-center"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Suítes</label>
                <input
                  type="number"
                  min="0"
                  value={suites}
                  onChange={(e) => setSuites(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-900 font-bold text-center"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Vaga Auto</label>
                <input
                  type="number"
                  min="0"
                  value={carSpaces}
                  onChange={(e) => setCarSpaces(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-900 font-bold text-center"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Vaga Moto</label>
                <input
                  type="number"
                  min="0"
                  value={motoSpaces}
                  onChange={(e) => setMotoSpaces(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-900 font-bold text-center"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Condições Financeiras */}
          <div className="space-y-3">
            <h3 className="font-extrabold text-blue-950 uppercase tracking-wide text-xs flex items-center gap-1.5 pb-1 border-b border-slate-100">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              <span>3. Condições Financeiras Contratadas</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Valor Principal (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={principalAmount}
                  onChange={(e) => setPrincipalAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-black text-sm focus:outline-none focus:border-blue-700"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Juros Remuneratórios (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={interestAmount}
                  onChange={(e) => setInterestAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-purple-700 font-mono font-black text-sm focus:outline-none focus:border-blue-700"
                />
              </div>
            </div>

            {/* Gerador de parcelas */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
              <span className="font-bold text-slate-800 block text-xs">
                Programação Inicial de Pagamento
              </span>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Sinal / Entrada (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={signalAmount}
                    onChange={(e) => setSignalAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Vencimento do Sinal</label>
                  <input
                    type="date"
                    value={signalDate}
                    onChange={(e) => setSignalDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Qtd Mensais</label>
                  <input
                    type="number"
                    min="0"
                    value={installmentsCount}
                    onChange={(e) => setInstallmentsCount(parseInt(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono font-bold text-slate-900 text-center"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Valor Mensal (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={monthlyAmount}
                    onChange={(e) => setMonthlyAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">1ª Mensalidade</label>
                  <input
                    type="date"
                    value={startMonthDate}
                    onChange={(e) => setStartMonthDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 font-mono text-slate-900 text-[11px]"
                  />
                </div>
              </div>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Footer Action Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 font-bold text-white bg-blue-950 hover:bg-blue-900 rounded-xl transition-colors shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Salvar Contrato</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
