import React, { useState } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardOverview } from './components/DashboardOverview';
import { ContractsList } from './components/ContractsList';
import { ContractDetailModal } from './components/ContractDetailModal';
import { InstallmentsScheduleView } from './components/InstallmentsScheduleView';
import { Building3DView } from './components/Building3DView';
import { LateFeeCalculatorModal } from './components/LateFeeCalculatorModal';
import { WhatsAppCollectionCenter } from './components/WhatsAppCollectionCenter';
import { ReportsCenterView } from './components/ReportsCenterView';
import { BankDetailsAndAuditView } from './components/BankDetailsAndAuditView';
import { PaymentModal } from './components/PaymentModal';
import { NewContractModal } from './components/NewContractModal';
import { AddInstallmentModal } from './components/AddInstallmentModal';
import { ReceiptPrintView } from './components/ReceiptPrintView';
import { AuditLogModal } from './components/AuditLogModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { MobileMenuDrawer } from './components/MobileMenuDrawer';
import { ReceiptsListView } from './components/ReceiptsListView';
import { CostsModuleView } from './components/CostsModuleView';
import { Contract, Installment, AuditLogEntry, BankDetails, PaymentReceipt } from './types';
import { 
  loadContracts, 
  saveContracts, 
  loadAuditLog, 
  addAuditEntry, 
  resetAllData, 
  exportContractsJSON, 
  exportInstallmentsCSV,
  loadBankDetails,
  saveBankDetails,
  loadReceipts,
  createReceiptForPayment
} from './utils/storage';
import { formatCurrency, formatDateBR } from './utils/formatters';

export default function App() {
  const [contracts, setContracts] = useState<Contract[]>(() => loadContracts());
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => loadAuditLog());
  const [bankDetails, setBankDetails] = useState<BankDetails>(() => loadBankDetails());
  const [receipts, setReceipts] = useState<PaymentReceipt[]>(() => loadReceipts());
  
  // Navigation: matches left sidebar and mobile bottom nav
  const [activeModule, setActiveModule] = useState<string>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Modal states
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const [paymentTarget, setPaymentTarget] = useState<{ installment: Installment; contract: Contract } | null>(null);
  const [printTarget, setPrintTarget] = useState<{ contract: Contract; singleInstallment?: Installment } | null>(null);
  const [isGeneralReportPdfOpen, setIsGeneralReportPdfOpen] = useState<boolean>(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState<boolean>(false);
  const [addInstallmentTarget, setAddInstallmentTarget] = useState<{ contract: Contract; defaultType: 'mensal' | 'intermediaria' } | null>(null);

  const updateContracts = (newContracts: Contract[]) => {
    setContracts(newContracts);
    saveContracts(newContracts);
  };

  const handleSaveBankDetails = (updated: BankDetails) => {
    setBankDetails(updated);
    saveBankDetails(updated);
    addAuditEntry({
      action: 'edicao',
      contractCode: 'SISTEMA',
      unitNumber: 'Todas',
      description: 'Atualização dos Dados Bancários Oficiais',
      details: `Favorecido: ${updated.recipientName} · Chave Pix: ${updated.pixKey}`,
    });
    setAuditLogs(loadAuditLog());
  };

  // 1. Incluir Novo Cliente / Contrato
  const handleAddContract = (newContract: Contract) => {
    const updatedContracts = [...contracts, newContract];
    updateContracts(updatedContracts);
    addAuditEntry({
      action: 'novo_contrato',
      contractCode: newContract.code,
      unitNumber: newContract.unit.unitNumber,
      description: `Novo Comprador Cadastrado: ${newContract.buyer.name}`,
      details: `Unidade: ${newContract.unit.unitNumber} · VGV: ${formatCurrency(newContract.totalContractedAmount)} com ${newContract.installments.length} parcelas.`,
      amount: newContract.totalContractedAmount,
    });
    setAuditLogs(loadAuditLog());
    setSelectedContractId(newContract.id);
  };

  // 2. Adicionar Parcela a um Contrato Existente
  const handleAddInstallment = (contractId: string, newInst: Installment) => {
    const updated = contracts.map((c) => {
      if (c.id !== contractId) return c;
      const newInstallments = [...c.installments, newInst].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
      const newTotal = newInstallments.reduce((sum, i) => sum + i.nominalAmount, 0);
      return {
        ...c,
        installments: newInstallments,
        totalContractedAmount: newTotal,
      };
    });

    updateContracts(updated);
    addAuditEntry({
      action: 'edicao',
      contractCode: contractId,
      unitNumber: 'Contrato',
      description: `Inclusão de Parcela: ${newInst.description}`,
      details: `Vencimento: ${formatDateBR(newInst.dueDate)} · Valor: ${formatCurrency(newInst.nominalAmount)}`,
      amount: newInst.nominalAmount,
    });
    setAuditLogs(loadAuditLog());
    setAddInstallmentTarget(null);
  };

  // 3. Excluir Parcela de um Contrato Existente
  const handleDeleteInstallment = (contractId: string, installmentId: string) => {
    let deletedInst: Installment | null = null;
    const updated = contracts.map((c) => {
      if (c.id !== contractId) return c;
      deletedInst = c.installments.find((i) => i.id === installmentId) || null;
      const newInstallments = c.installments.filter((i) => i.id !== installmentId);
      const newTotal = newInstallments.reduce((sum, i) => sum + i.nominalAmount, 0);
      return {
        ...c,
        installments: newInstallments,
        totalContractedAmount: newTotal,
      };
    });

    updateContracts(updated);
    if (deletedInst) {
      const d = deletedInst as Installment;
      addAuditEntry({
        action: 'edicao',
        contractCode: contractId,
        unitNumber: 'Contrato',
        description: `Exclusão de Parcela: ${d.description}`,
        details: `Parcela de ${formatCurrency(d.nominalAmount)} (Vencimento ${formatDateBR(d.dueDate)}) excluída do cronograma.`,
        amount: d.nominalAmount,
      });
      setAuditLogs(loadAuditLog());
    }
  };

  // 4. Editar Parcela de um Contrato Existente
  const handleEditInstallment = (contractId: string, updatedInst: Installment) => {
    const updated = contracts.map((c) => {
      if (c.id !== contractId) return c;
      const newInstallments = c.installments
        .map((i) => (i.id === updatedInst.id ? updatedInst : i))
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
      const newTotal = newInstallments.reduce((sum, i) => sum + i.nominalAmount, 0);
      return {
        ...c,
        installments: newInstallments,
        totalContractedAmount: newTotal,
      };
    });

    updateContracts(updated);
    addAuditEntry({
      action: 'edicao',
      contractCode: contractId,
      unitNumber: 'Contrato',
      description: `Edição de Parcela: ${updatedInst.description}`,
      details: `Vencimento: ${formatDateBR(updatedInst.dueDate)} · Novo Valor: ${formatCurrency(updatedInst.nominalAmount)}`,
      amount: updatedInst.nominalAmount,
    });
    setAuditLogs(loadAuditLog());
  };

  // 4. Lançamento de Pagamento / Baixa
  const handleConfirmPayment = (
    installmentId: string,
    contractId: string,
    paymentData: {
      paidAmount: number;
      paidDate: string;
      paymentMethod: 'pix' | 'ted' | 'boleto' | 'deposito' | 'outro';
      receiptNumber: string;
      lateFeeApplied?: number;
      interestApplied?: number;
      discountApplied?: number;
      paymentProofNote?: string;
    }
  ) => {
    let updatedTargetContract: Contract | null = null;
    let updatedTargetInstallment: Installment | null = null;

    // Gerar Recibo Oficial Sequencial automaticamente
    const foundContract = contracts.find((c) => c.id === contractId);
    const foundInst = foundContract?.installments.find((i) => i.id === installmentId);
    let generatedReceiptNumber = paymentData.receiptNumber;

    if (foundContract && foundInst) {
      const prevBal = foundContract.installments
        .filter((i) => !i.paidDate)
        .reduce((sum, i) => sum + i.nominalAmount, 0);
      const newBal = Math.max(0, prevBal - paymentData.paidAmount);

      const officialRec = createReceiptForPayment({
        contract: foundContract,
        installment: foundInst,
        receivedAmount: paymentData.paidAmount,
        paymentMethod: paymentData.paymentMethod,
        receivedDate: paymentData.paidDate,
        previousBalance: prevBal,
        newBalance: newBal,
        recipientName: 'Igor Antunes / Rodrigo Lopes',
        pixKey: bankDetails.pixKey,
        notes: paymentData.paymentProofNote,
      });

      generatedReceiptNumber = officialRec.receiptNumber;
      setReceipts(loadReceipts());
    }

    const newContracts = contracts.map((c) => {
      if (c.id !== contractId) return c;

      const newInstallments = c.installments.map((inst) => {
        if (inst.id !== installmentId) return inst;

        const updatedInst: Installment = {
          ...inst,
          paidAmount: paymentData.paidAmount,
          paidDate: paymentData.paidDate,
          paymentMethod: paymentData.paymentMethod,
          receiptNumber: generatedReceiptNumber,
          lateFeeApplied: paymentData.lateFeeApplied || 0,
          interestApplied: paymentData.interestApplied || 0,
          discountApplied: paymentData.discountApplied || 0,
          paymentProofNote: paymentData.paymentProofNote,
        };

        updatedTargetInstallment = updatedInst;
        return updatedInst;
      });

      const updatedContract: Contract = {
        ...c,
        installments: newInstallments,
      };

      updatedTargetContract = updatedContract;
      return updatedContract;
    });

    updateContracts(newContracts);

    if (updatedTargetContract && updatedTargetInstallment) {
      const contractRef: Contract = updatedTargetContract;
      const instRef: Installment = updatedTargetInstallment;
      addAuditEntry({
        action: 'pagamento',
        contractCode: contractRef.code,
        unitNumber: contractRef.unit.unitNumber,
        description: `Baixa: ${instRef.description}`,
        details: `Comprador: ${contractRef.buyer.name} · Data: ${formatDateBR(paymentData.paidDate)} · Recibo Oficial: ${generatedReceiptNumber} (${paymentData.paymentMethod.toUpperCase()})`,
        amount: paymentData.paidAmount,
      });
      setAuditLogs(loadAuditLog());
    }

    setPaymentTarget(null);

    if (updatedTargetContract && updatedTargetInstallment) {
      setPrintTarget({
        contract: updatedTargetContract,
        singleInstallment: updatedTargetInstallment,
      });
    }
  };

  const handleReversePayment = (installmentId: string, contractId: string) => {
    if (!window.confirm('Deseja realmente estornar a baixa desta parcela? O valor retornará para o saldo em aberto.')) {
      return;
    }

    let contractRef: Contract | null = null;
    let instRef: Installment | null = null;

    const newContracts = contracts.map((c) => {
      if (c.id !== contractId) return c;

      const newInstallments = c.installments.map((inst) => {
        if (inst.id !== installmentId) return inst;
        instRef = inst;

        const updated: Installment = { ...inst };
        delete updated.paidAmount;
        delete updated.paidDate;
        delete updated.paymentMethod;
        delete updated.receiptNumber;
        delete updated.lateFeeApplied;
        delete updated.interestApplied;
        delete updated.discountApplied;
        delete updated.paymentProofNote;
        return updated;
      });

      contractRef = { ...c, installments: newInstallments };
      return contractRef;
    });

    updateContracts(newContracts);

    if (contractRef && instRef) {
      const c = contractRef as Contract;
      const i = instRef as Installment;
      addAuditEntry({
        action: 'estorno',
        contractCode: c.code,
        unitNumber: c.unit.unitNumber,
        description: `Estorno de Pagamento: ${i.description}`,
        details: `Lançamento desfeito para o comprador ${c.buyer.name}. Parcela voltou ao status pendente.`,
        amount: i.paidAmount,
      });
      setAuditLogs(loadAuditLog());
    }
  };

  const handleResetData = () => {
    const initial = resetAllData();
    setContracts(initial);
    setAuditLogs(loadAuditLog());
  };

  const handleImportJSON = (imported: Contract[]) => {
    updateContracts(imported);
    addAuditEntry({
      action: 'edicao',
      contractCode: 'SISTEMA',
      unitNumber: 'Todas',
      description: 'Importação de Backup',
      details: 'Banco de dados restaurado a partir de arquivo JSON de backup.',
    });
    setAuditLogs(loadAuditLog());
  };

  const handleQuickPayment = () => {
    for (const c of contracts) {
      const pending = c.installments.find((i) => !i.paidDate);
      if (pending) {
        setPaymentTarget({ installment: pending, contract: c });
        return;
      }
    }
    if (contracts[0]?.installments[0]) {
      setPaymentTarget({ installment: contracts[0].installments[0], contract: contracts[0] });
    }
  };

  const activeContractForModal = contracts.find((c) => c.id === selectedContractId) || null;

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-slate-900 flex flex-col font-sans pb-16 lg:pb-0">
      {/* Top Header */}
      <Header
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        onOpenAuditLog={() => setActiveModule('banco')}
        onExportCSV={() => exportInstallmentsCSV(contracts)}
        onExportPDF={() => setIsGeneralReportPdfOpen(true)}
        onExportJSON={() => exportContractsJSON(contracts)}
        onQuickPayment={handleQuickPayment}
        onOpenNewClient={() => setIsNewClientModalOpen(true)}
      />

      {/* Main Container with Sidebar + Content */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Left Sidebar */}
        <Sidebar
          activeModule={activeModule}
          setActiveModule={(mod) => setActiveModule(mod)}
        />

        {/* Content Viewport */}
        <main className="flex-1 p-3.5 sm:p-5 lg:p-6 overflow-y-auto">
          {activeModule === 'dashboard' && (
            <DashboardOverview
              contracts={contracts}
              onSelectContract={(id) => setSelectedContractId(id)}
              onOpenPaymentModal={(inst, contract) => setPaymentTarget({ installment: inst, contract })}
              onViewSchedule={() => setActiveModule('pagamentos')}
              onExportCSV={() => exportInstallmentsCSV(contracts)}
              onOpenPDF={() => setIsGeneralReportPdfOpen(true)}
              onOpenNewClient={() => setIsNewClientModalOpen(true)}
            />
          )}

          {activeModule === 'cobranca' && (
            <WhatsAppCollectionCenter
              contracts={contracts}
              bankDetails={bankDetails}
              onNavigateToBankDetails={() => setActiveModule('banco')}
              onOpenPaymentModal={(inst, contract) => setPaymentTarget({ installment: inst, contract })}
            />
          )}

          {activeModule === 'compradores' && (
            <ContractsList
              contracts={contracts}
              onSelectContract={(id) => setSelectedContractId(id)}
              onPrintContractStatement={(contract) => setPrintTarget({ contract })}
              onOpenNewClient={() => setIsNewClientModalOpen(true)}
            />
          )}

          {(activeModule === 'pagamentos' || activeModule === 'fluxo') && (
            <InstallmentsScheduleView
              contracts={contracts}
              onOpenPaymentModal={(inst, contract) => setPaymentTarget({ installment: inst, contract })}
              onReversePayment={handleReversePayment}
              onExportCSV={() => exportInstallmentsCSV(contracts)}
            />
          )}

          {activeModule === 'unidades' && (
            <Building3DView
              contracts={contracts}
              onSelectContract={(id) => setSelectedContractId(id)}
            />
          )}

          {activeModule === 'relatorios' && (
            <ReportsCenterView
              contracts={contracts}
              onExportCSV={() => exportInstallmentsCSV(contracts)}
            />
          )}

          {activeModule === 'banco' && (
            <BankDetailsAndAuditView
              bankDetails={bankDetails}
              onSaveBankDetails={handleSaveBankDetails}
              auditLogs={auditLogs}
            />
          )}

          {activeModule === 'mora' && (
            <LateFeeCalculatorModal contracts={contracts} />
          )}

          {activeModule === 'recibos' && (
            <ReceiptsListView
              receipts={receipts}
              onRefreshReceipts={() => setReceipts(loadReceipts())}
            />
          )}

          {activeModule === 'custos' && (
            <CostsModuleView />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (thumb friendly, 90% mobile usage) */}
      <MobileBottomNav
        activeModule={activeModule}
        setActiveModule={setActiveModule}
        onQuickPayment={handleQuickPayment}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
      />

      {/* Mobile Menu Drawer */}
      <MobileMenuDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        activeModule={activeModule}
        setActiveModule={setActiveModule}
        onExportCSV={() => exportInstallmentsCSV(contracts)}
        onResetData={handleResetData}
      />

      {/* Dossiê Financeiro Modal */}
      {activeContractForModal && (
        <ContractDetailModal
          contract={activeContractForModal}
          onClose={() => setSelectedContractId(null)}
          onOpenPaymentModal={(inst, contract) => setPaymentTarget({ installment: inst, contract })}
          onReversePayment={handleReversePayment}
          onPrintContractStatement={(contract) => setPrintTarget({ contract })}
          onOpenAddInstallment={(contract, defaultType) => setAddInstallmentTarget({ contract, defaultType })}
          onDeleteInstallment={handleDeleteInstallment}
          onEditInstallment={handleEditInstallment}
        />
      )}

      {/* Add New Installment Modal */}
      {addInstallmentTarget && (
        <AddInstallmentModal
          contract={addInstallmentTarget.contract}
          defaultType={addInstallmentTarget.defaultType}
          onClose={() => setAddInstallmentTarget(null)}
          onAddInstallment={handleAddInstallment}
        />
      )}

      {/* Add New Client / Contract Modal */}
      {isNewClientModalOpen && (
        <NewContractModal
          onClose={() => setIsNewClientModalOpen(false)}
          onAddContract={handleAddContract}
          existingContractsCount={contracts.length}
        />
      )}

      {/* Payment / Baixa Modal */}
      {paymentTarget && (
        <PaymentModal
          installment={paymentTarget.installment}
          contract={paymentTarget.contract}
          onClose={() => setPaymentTarget(null)}
          onConfirmPayment={handleConfirmPayment}
        />
      )}

      {/* Print View for Individual Statements & Receipts */}
      {printTarget && (
        <ReceiptPrintView
          contract={printTarget.contract}
          singleInstallment={printTarget.singleInstallment}
          onExportCSV={() => exportInstallmentsCSV(contracts)}
          onClose={() => setPrintTarget(null)}
        />
      )}

      {/* General Executive PDF Report */}
      {isGeneralReportPdfOpen && (
        <ReceiptPrintView
          allContracts={contracts}
          onExportCSV={() => exportInstallmentsCSV(contracts)}
          onClose={() => setIsGeneralReportPdfOpen(false)}
        />
      )}

      {/* Audit Log Modal */}
      {isAuditModalOpen && (
        <AuditLogModal
          logs={auditLogs}
          contracts={contracts}
          onClose={() => setIsAuditModalOpen(false)}
          onExportJSON={() => exportContractsJSON(contracts)}
          onImportJSON={handleImportJSON}
          onResetAllData={handleResetData}
        />
      )}
    </div>
  );
}
