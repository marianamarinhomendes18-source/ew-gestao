import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Wallet,
  Camera,
  FileText,
  PlusCircle,
  TrendingDown,
  Clock,
  CheckCircle,
  AlertTriangle,
  Search,
  Filter,
  Download,
  Printer,
  Sparkles,
  Paperclip,
  Trash2,
  Edit,
  Eye,
  Check,
  X,
  UploadCloud,
  FileCheck,
  Calendar,
  Layers,
  Building,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  Maximize2,
  Package,
  FolderArchive,
  FileSpreadsheet
} from 'lucide-react';
import { CostItem, CostDocument, CostHistoryEntry } from '../types';
import { formatCurrency, formatDateBR, formatDateTimeBR } from '../utils/formatters';
import { 
  loadCosts, 
  saveCosts, 
  addCostItem, 
  updateCostItem, 
  deleteCostItem, 
  loadCostCategories, 
  saveCostCategories,
  getNextCostCode, 
  exportCostsCSV 
} from '../utils/storage';
import { saveDocument, getDocument, fileToCostDocument } from '../utils/documentStorage';
import { CostReportPrintModal } from './CostReportPrintModal';
import { exportCostAttachmentsZip } from '../utils/zipExportHelper';

const MONTH_OPTIONS = [
  { value: 'todos', label: '📅 TODOS OS MESES / TOTAL GERAL' },
  { value: '2026-11', label: '📅 Novembro / 2026' },
  { value: '2026-12', label: '📅 Dezembro / 2026' },
  { value: '2027-01', label: '📅 Janeiro / 2027' },
  { value: '2027-02', label: '📅 Fevereiro / 2027' },
  { value: '2027-03', label: '📅 Março / 2027' },
  { value: '2027-04', label: '📅 Abril / 2027' },
  { value: '2027-05', label: '📅 Maio / 2027' },
  { value: '2027-06', label: '📅 Junho / 2027' },
  { value: '2027-07', label: '📅 Julho / 2027' },
  { value: '2027-08', label: '📅 Agosto / 2027' },
  { value: '2027-09', label: '📅 Setembro / 2027' },
  { value: '2027-10', label: '📅 Outubro / 2027' },
  { value: '2027-11', label: '📅 Novembro / 2027' },
  { value: '2027-12', label: '📅 Dezembro / 2027' },
  { value: '2028-01', label: '📅 Janeiro / 2028' },
  { value: '2028-02', label: '📅 Fevereiro / 2028' },
  { value: '2028-03', label: '📅 Março / 2028' },
  { value: '2028-04', label: '📅 Abril / 2028' },
  { value: '2028-05', label: '📅 Maio / 2028' },
  { value: '2028-06', label: '📅 Junho / 2028' },
  { value: '2028-07', label: '📅 Julho / 2028' },
  { value: '2028-08', label: '📅 Agosto / 2028' },
  { value: '2028-09', label: '📅 Setembro / 2028' },
  { value: '2028-10', label: '📅 Outubro / 2028' },
  { value: '2028-11', label: '📅 Novembro / 2028' },
  { value: '2028-12', label: '📅 Dezembro / 2028' },
  { value: '2029-01', label: '📅 Janeiro / 2029' },
  { value: '2029-02', label: '📅 Fevereiro / 2029' },
  { value: '2029-03', label: '📅 Março / 2029' },
  { value: '2029-04', label: '📅 Abril / 2029' },
  { value: '2029-05', label: '📅 Maio / 2029' },
  { value: '2029-06', label: '📅 Junho / 2029' },
  { value: '2029-07', label: '📅 Julho / 2029' },
  { value: '2029-08', label: '📅 Agosto / 2029' },
  { value: '2029-09', label: '📅 Setembro / 2029' },
  { value: '2029-10', label: '📅 Outubro / 2029' },
];

function getMonthLabel(value: string): string {
  if (value === 'todos') return 'Todos os Meses (Total Geral da Obra)';
  const match = MONTH_OPTIONS.find((m) => m.value === value);
  return match ? match.label.replace('📅 ', '') : value;
}

export const CostsModuleView: React.FC = () => {
  const [costs, setCosts] = useState<CostItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'lista' | 'novo' | 'relatorios' | 'categorias'>('dashboard');
  const [selectedMonth, setSelectedMonth] = useState<string>('todos');

  // Input method inside "novo"
  const [inputMethod, setInputMethod] = useState<'ia_foto' | 'ia_texto' | 'manual'>('ia_foto');

  // State for AI photo parsing
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState(false);
  const [aiAnalysisError, setAiAnalysisError] = useState<string | null>(null);

  // State for AI text parsing
  const [naturalText, setNaturalText] = useState('');
  const [isAnalyzingText, setIsAnalyzingText] = useState(false);

  // State for AI Batch Parsing (Spreadsheets / Multi-row PDFs)
  const [batchCostItems, setBatchCostItems] = useState<Partial<CostItem>[] | null>(null);
  const [batchSummary, setBatchSummary] = useState<string | null>(null);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchSuccessMsg, setBatchSuccessMsg] = useState<string | null>(null);

  // Confirmation screen state
  const [draftCost, setDraftCost] = useState<Partial<CostItem> | null>(null);
  const [draftDocuments, setDraftDocuments] = useState<CostDocument[]>([]);
  const [isEditingDraft, setIsEditingDraft] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Filters for List view
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('todas');
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [filterType, setFilterType] = useState<string>('todos');

  // Document preview modal
  const [previewDoc, setPreviewDoc] = useState<CostDocument | null>(null);
  const [viewingCostDetails, setViewingCostDetails] = useState<CostItem | null>(null);

  // Category management
  const [newCatInput, setNewCatInput] = useState('');

  // Payment confirmation modal for a cost
  const [markingPaidCost, setMarkingPaidCost] = useState<CostItem | null>(null);
  const [paymentDateInput, setPaymentDateInput] = useState(new Date().toISOString().slice(0, 10));

  // State for PDF Report Modal
  const [showPdfReportModal, setShowPdfReportModal] = useState(false);
  const [pdfReportScope, setPdfReportScope] = useState<'mes' | 'todos'>('mes');

  // State for ZIP Export
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [zipProgress, setZipProgress] = useState<string | null>(null);
  const [zipSuccessMsg, setZipSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const extraDocInputRef = useRef<HTMLInputElement>(null);

  // Carregar dados locais
  const refreshData = () => {
    setCosts(loadCosts());
    setCategories(loadCostCategories());
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Custos filtrados pelo mês/ano selecionado para o módulo dinâmico
  const periodCosts = useMemo(() => {
    if (selectedMonth === 'todos') return costs;
    return costs.filter((c) => {
      const d = c.dueDate || c.date;
      return d.startsWith(selectedMonth);
    });
  }, [costs, selectedMonth]);

  // Contagem de documentos e anexos para badges
  const totalAttachmentsCount = useMemo(() => {
    return costs.reduce((sum, c) => sum + (c.documents?.length || 0), 0);
  }, [costs]);

  const periodAttachmentsCount = useMemo(() => {
    return periodCosts.reduce((sum, c) => sum + (c.documents?.length || 0), 0);
  }, [periodCosts]);

  // Handler para acionar download ZIP de anexos/comprovantes/notas
  const handleExportZip = async (scope: 'mes' | 'todos') => {
    const targetCosts = scope === 'mes' && selectedMonth !== 'todos' ? periodCosts : costs;
    const label = scope === 'mes' && selectedMonth !== 'todos' ? selectedMonth : 'TODOS_OS_MESES';

    const hasAnyDocs = targetCosts.some((c) => c.documents && c.documents.length > 0);
    if (!hasAnyDocs) {
      alert('Nenhum comprovante ou imagem arquivada foi encontrado no período selecionado.');
      return;
    }

    setIsExportingZip(true);
    setZipProgress('Iniciando empacotamento dos comprovantes...');
    setZipSuccessMsg(null);

    try {
      const res = await exportCostAttachmentsZip(targetCosts, label, (prog) => {
        setZipProgress(`Compactando anexo ${prog.current} de ${prog.total}: ${prog.currentFilename}...`);
      });

      setZipSuccessMsg(
        `📦 Arquivo ZIP baixado com sucesso! ${res.filesCount} comprovante(s) e notas fiscais empacotados.`
      );
      setTimeout(() => setZipSuccessMsg(null), 7000);
    } catch (err: any) {
      console.error(err);
      alert('Falha ao gerar arquivo ZIP: ' + (err.message || 'Erro durante a compactação.'));
    } finally {
      setIsExportingZip(false);
      setZipProgress(null);
    }
  };

  const handleOpenPdfReport = (scope: 'mes' | 'todos') => {
    setPdfReportScope(scope);
    setShowPdfReportModal(true);
  };

  // Estatísticas do período selecionado (Mês específico ou Todos)
  const periodStats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    let periodTotal = 0;
    let periodPaid = 0;
    let periodPending = 0;
    let periodOverdue = 0;

    periodCosts.forEach((c) => {
      periodTotal += c.totalAmount;
      if (c.status === 'PAGO') {
        periodPaid += c.totalAmount;
      } else {
        periodPending += c.totalAmount;
        if (c.dueDate && c.dueDate < today) {
          periodOverdue += c.totalAmount;
        }
      }
    });

    return {
      periodTotal,
      periodPaid,
      periodPending,
      periodOverdue,
    };
  }, [periodCosts]);

  // Estatísticas consolidadas totais (TOTAL GERAL DE TODOS OS MESES)
  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    let totalAll = 0;
    let totalPaid = 0;
    let totalPending = 0;
    let totalOverdue = 0;

    const byCat: Record<string, number> = {};
    const byType: Record<string, number> = {};
    const bySupplier: Record<string, number> = {};

    costs.forEach((c) => {
      totalAll += c.totalAmount;
      if (c.status === 'PAGO') {
        totalPaid += c.totalAmount;
      } else {
        totalPending += c.totalAmount;
        if (c.dueDate && c.dueDate < today) {
          totalOverdue += c.totalAmount;
        }
      }

      byCat[c.category] = (byCat[c.category] || 0) + c.totalAmount;
      byType[c.costType] = (byType[c.costType] || 0) + c.totalAmount;
      if (c.supplier) {
        bySupplier[c.supplier] = (bySupplier[c.supplier] || 0) + c.totalAmount;
      }
    });

    const topCategories = Object.entries(byCat)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);

    const topSuppliers = Object.entries(bySupplier)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6);

    return {
      totalAll,
      totalPaid,
      totalPending,
      totalOverdue,
      topCategories,
      topSuppliers,
      byType,
    };
  }, [costs]);

  // Handle Photo / PDF / Spreadsheet selection
  const handlePhotoSelect = (file: File) => {
    setPhotoFile(file);
    setAiAnalysisError(null);
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Submit Photo, PDF or Spreadsheet to AI
  const handleAnalyzePhoto = async () => {
    if (!photoFile || !photoPreview) {
      setAiAnalysisError('Selecione uma imagem, PDF ou planilha primeiro.');
      return;
    }

    setIsAnalyzingPhoto(true);
    setAiAnalysisError(null);

    try {
      const fileNameLower = photoFile.name.toLowerCase();
      const isSpreadsheet = 
        fileNameLower.endsWith('.xlsx') ||
        fileNameLower.endsWith('.xls') ||
        fileNameLower.endsWith('.csv') ||
        photoFile.type?.includes('sheet') ||
        photoFile.type?.includes('excel') ||
        photoFile.type?.includes('csv');

      const isPdf = 
        fileNameLower.endsWith('.pdf') ||
        photoFile.type === 'application/pdf' ||
        photoFile.type?.includes('pdf');

      // Salva documento como anexo se não for planilha em massa
      let costDoc: CostDocument | null = null;
      if (!isSpreadsheet) {
        costDoc = await fileToCostDocument(photoFile);
        await saveDocument(costDoc);
      }

      const response = await fetch('/api/gemini/parse-cost-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: photoPreview,
          fileBase64: photoPreview,
          mimeType: photoFile.type || (isPdf ? 'application/pdf' : isSpreadsheet ? 'text/csv' : 'image/jpeg'),
          fileName: photoFile.name,
        }),
      });

      const resJson = await response.json();
      if (!response.ok || !resJson.success) {
        throw new Error(resJson.error || resJson.details || 'Falha ao processar com IA.');
      }

      // Se for lote / planilha com múltiplas linhas
      if (resJson.isBatch && Array.isArray(resJson.items) && resJson.items.length > 1) {
        setBatchCostItems(resJson.items);
        setBatchSummary(resJson.summary || `Foram identificados ${resJson.items.length} lançamentos na planilha.`);
        setShowBatchModal(true);
        return;
      }

      const extracted = resJson.data || (resJson.items && resJson.items[0]);
      if (!extracted) {
        throw new Error('Nenhum dado financeiro pôde ser identificado no documento.');
      }

      setDraftCost({
        code: getNextCostCode(),
        date: extracted.date || new Date().toISOString().slice(0, 10),
        dueDate: extracted.dueDate || '',
        category: extracted.category || 'Materiais de construção',
        costType: extracted.costType || 'materiais',
        supplier: extracted.supplier || 'Fornecedor Identificado',
        item: extracted.item || 'Item de Obra',
        description: extracted.description || '',
        quantity: Number(extracted.quantity) || 1,
        unit: extracted.unit || 'un',
        unitPrice: Number(extracted.unitPrice) || Number(extracted.totalAmount) || 0,
        totalAmount: Number(extracted.totalAmount) || 0,
        paymentMethod: extracted.paymentMethod || 'pix',
        status: 'PENDENTE',
        origin: isPdf ? 'ia_foto' : isSpreadsheet ? 'ia_foto' : 'ia_foto',
        observations: extracted.observations || `Extraído de ${photoFile.name}`,
      });
      setDraftDocuments(costDoc ? [costDoc] : []);
      setIsEditingDraft(false);
      setShowConfirmModal(true);
    } catch (err: any) {
      console.error(err);
      setAiAnalysisError(err.message || 'Erro ao analisar arquivo com IA. Tente novamente ou use o lançamento manual.');
    } finally {
      setIsAnalyzingPhoto(false);
    }
  };

  // Confirmar Importação em Lote de Planilha
  const handleConfirmBatchImport = () => {
    if (!batchCostItems || batchCostItems.length === 0) return;
    const now = new Date().toISOString();

    batchCostItems.forEach((item, idx) => {
      const code = getNextCostCode();
      const finalItem: CostItem = {
        id: 'cost-' + Date.now() + '-' + idx + '-' + Math.random().toString(36).substring(2, 6),
        code,
        date: item.date || now.slice(0, 10),
        dueDate: item.dueDate,
        category: item.category || 'Materiais de construção',
        costType: (item.costType as any) || 'materiais',
        supplier: item.supplier || 'Fornecedor da Planilha',
        item: item.item || 'Item de Obra',
        description: item.description || '',
        quantity: Number(item.quantity) || 1,
        unit: item.unit || 'un',
        unitPrice: Number(item.unitPrice) || Number(item.totalAmount) || 0,
        totalAmount: Number(item.totalAmount) || 0,
        paymentMethod: (item.paymentMethod as any) || 'pix',
        status: (item.status as any) || 'PENDENTE',
        paidDate: item.status === 'PAGO' ? (item.paidDate || item.date) : undefined,
        origin: 'ia_foto',
        observations: item.observations || `Importado da planilha: ${photoFile?.name || 'arquivo'}`,
        documents: [],
        createdAt: now,
        updatedAt: now,
        history: [
          {
            id: 'hist-' + Date.now() + '-' + idx,
            timestamp: now,
            action: 'criacao',
            description: `Lançamento importado via IA da planilha ${photoFile?.name || ''}`,
            author: 'Gestão Prédio EW',
          },
        ],
      };
      addCostItem(finalItem);
    });

    refreshData();
    const count = batchCostItems.length;
    setBatchSuccessMsg(`✅ Sucesso! ${count} lançamentos foram importados da planilha para a obra.`);
    setTimeout(() => setBatchSuccessMsg(null), 8000);
    setShowBatchModal(false);
    setBatchCostItems(null);
    setPhotoFile(null);
    setPhotoPreview(null);
    setActiveSubTab('lista');
  };

  // Submit Text to AI
  const handleAnalyzeText = async () => {
    if (!naturalText.trim()) return;

    setIsAnalyzingText(true);
    setAiAnalysisError(null);

    try {
      const response = await fetch('/api/gemini/parse-cost-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: naturalText }),
      });

      const resJson = await response.json();
      if (!response.ok || !resJson.success) {
        throw new Error(resJson.error || resJson.details || 'Falha ao interpretar texto.');
      }

      const extracted = resJson.data;
      setDraftCost({
        code: getNextCostCode(),
        date: extracted.date || new Date().toISOString().slice(0, 10),
        dueDate: extracted.dueDate || '',
        category: extracted.category || 'Materiais de construção',
        costType: extracted.costType || 'materiais',
        supplier: extracted.supplier || 'Fornecedor',
        item: extracted.item || 'Item',
        description: extracted.description || naturalText,
        quantity: Number(extracted.quantity) || 1,
        unit: extracted.unit || 'un',
        unitPrice: Number(extracted.unitPrice) || Number(extracted.totalAmount) || 0,
        totalAmount: Number(extracted.totalAmount) || 0,
        paymentMethod: extracted.paymentMethod || 'pix',
        status: 'PENDENTE',
        origin: 'ia_texto',
        observations: extracted.observations || `Transcrição do relato: "${naturalText}"`,
      });
      setDraftDocuments([]);
      setIsEditingDraft(false);
      setShowConfirmModal(true);
    } catch (err: any) {
      console.error(err);
      setAiAnalysisError(err.message || 'Erro ao interpretar texto com IA.');
    } finally {
      setIsAnalyzingText(false);
    }
  };

  // Start Manual Draft
  const handleStartManual = () => {
    setDraftCost({
      code: getNextCostCode(),
      date: new Date().toISOString().slice(0, 10),
      dueDate: '',
      category: categories[0] || 'Materiais de construção',
      costType: 'materiais',
      supplier: '',
      item: '',
      description: '',
      quantity: 1,
      unit: 'un',
      unitPrice: 0,
      totalAmount: 0,
      paymentMethod: 'pix',
      status: 'PENDENTE',
      origin: 'manual',
      observations: '',
    });
    setDraftDocuments([]);
    setIsEditingDraft(true);
    setShowConfirmModal(true);
  };

  // Add extra attachment to draft
  const handleAddDraftDocument = async (file: File) => {
    try {
      const doc = await fileToCostDocument(file);
      await saveDocument(doc);
      setDraftDocuments((prev) => [...prev, doc]);
    } catch (err) {
      console.error('Erro ao anexar arquivo:', err);
    }
  };

  // Save Confirmed Draft
  const handleConfirmAndSaveDraft = () => {
    if (!draftCost) return;

    if (!draftCost.item || !draftCost.supplier || !draftCost.totalAmount) {
      alert('Preencha os campos obrigatórios: Fornecedor, Item e Valor Total.');
      return;
    }

    const now = new Date().toISOString();
    const finalItem: CostItem = {
      id: 'cost-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      code: draftCost.code || getNextCostCode(),
      date: draftCost.date || now.slice(0, 10),
      dueDate: draftCost.dueDate,
      category: draftCost.category || 'Materiais de construção',
      costType: (draftCost.costType as any) || 'materiais',
      supplier: draftCost.supplier || 'Diversos',
      item: draftCost.item || 'Item',
      description: draftCost.description || '',
      quantity: Number(draftCost.quantity) || 1,
      unit: draftCost.unit || 'un',
      unitPrice: Number(draftCost.unitPrice) || Number(draftCost.totalAmount) || 0,
      totalAmount: Number(draftCost.totalAmount) || 0,
      paymentMethod: (draftCost.paymentMethod as any) || 'pix',
      status: (draftCost.status as any) || 'PENDENTE',
      paidDate: draftCost.status === 'PAGO' ? (draftCost.paidDate || draftCost.date) : undefined,
      origin: draftCost.origin || 'manual',
      observations: draftCost.observations,
      documents: draftDocuments,
      createdAt: now,
      updatedAt: now,
      history: [
        {
          id: 'hist-' + Date.now(),
          timestamp: now,
          action: 'criacao',
          description: `Lançamento criado via ${draftCost.origin === 'ia_foto' ? 'IA Foto' : draftCost.origin === 'ia_texto' ? 'IA Texto' : 'Manual'}`,
          author: 'Gestão Prédio EW',
        },
      ],
    };

    addCostItem(finalItem);
    refreshData();

    // Reset draft and states
    setShowConfirmModal(false);
    setDraftCost(null);
    setDraftDocuments([]);
    setPhotoFile(null);
    setPhotoPreview(null);
    setNaturalText('');
    setActiveSubTab('lista');
  };

  // Mark cost as paid
  const handleConfirmCostPayment = () => {
    if (!markingPaidCost) return;
    const now = new Date().toISOString();
    const updated: CostItem = {
      ...markingPaidCost,
      status: 'PAGO',
      paidDate: paymentDateInput,
      updatedAt: now,
      history: [
        {
          id: 'hist-' + Date.now(),
          timestamp: now,
          action: 'pagamento',
          description: `Marcado como PAGO na data ${formatDateBR(paymentDateInput)}`,
          author: 'Gestão Prédio EW',
        },
        ...markingPaidCost.history,
      ],
    };

    updateCostItem(updated);
    refreshData();
    setMarkingPaidCost(null);
  };

  // Delete cost
  const handleDeleteCost = (cost: CostItem) => {
    if (confirm(`Deseja realmente excluir o lançamento ${cost.code} (${cost.item})?`)) {
      deleteCostItem(cost.id);
      refreshData();
      if (viewingCostDetails?.id === cost.id) {
        setViewingCostDetails(null);
      }
    }
  };

  // Add category
  const handleAddCategory = () => {
    const trimmed = newCatInput.trim();
    if (!trimmed) return;
    if (categories.includes(trimmed)) {
      alert('Esta categoria já existe.');
      return;
    }
    const updated = [...categories, trimmed];
    saveCostCategories(updated);
    setCategories(updated);
    setNewCatInput('');
  };

  // Filtered costs list
  const filteredCosts = useMemo(() => {
    return costs.filter((c) => {
      if (selectedMonth !== 'todos') {
        const d = c.dueDate || c.date;
        if (!d.startsWith(selectedMonth)) return false;
      }
      if (filterCategory !== 'todas' && c.category !== filterCategory) return false;
      if (filterStatus !== 'todos' && c.status !== filterStatus) return false;
      if (filterType !== 'todos' && c.costType !== filterType) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        c.code.toLowerCase().includes(q) ||
        c.supplier.toLowerCase().includes(q) ||
        c.item.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q))
      );
    });
  }, [costs, selectedMonth, filterCategory, filterStatus, filterType, searchQuery]);

  // Download document
  const handleDownloadDoc = (doc: CostDocument) => {
    const a = document.createElement('a');
    a.href = doc.dataUrl;
    a.download = doc.name;
    a.click();
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Top Header matching PRÉDIO EW Theme */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-950 text-white flex items-center justify-center font-black text-sm">
              R$
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-blue-950 tracking-tight">
                Módulo de Custos & Obras
              </h2>
              <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                Sub-sistema Isolado da Carteira de Vendas
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-1.5">
            Gestão analítica de materiais, mão de obra, notas fiscais, fotos com IA e comprovantes do PRÉDIO EW.
          </p>
        </div>

        {/* Action Buttons: PDF, ZIP and Novo Custo */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleOpenPdfReport(selectedMonth === 'todos' ? 'todos' : 'mes')}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all shadow-2xs"
            title="Abrir e imprimir ou salvar Relatório de Custos em PDF"
          >
            <Printer className="w-3.5 h-3.5 text-rose-600" />
            <span>PDF Custos</span>
          </button>

          <button
            onClick={() => handleExportZip(selectedMonth === 'todos' ? 'todos' : 'mes')}
            disabled={isExportingZip}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-950 border border-blue-200 rounded-xl text-xs font-bold transition-all shadow-2xs disabled:opacity-50"
            title="Baixar todas as imagens e notas fiscais em arquivo .ZIP"
          >
            <Package className="w-3.5 h-3.5 text-blue-900" />
            <span>ZIP Comprovantes</span>
            <span className="bg-blue-950 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold">
              {totalAttachmentsCount}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveSubTab('novo');
              setInputMethod('ia_foto');
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-950 hover:bg-blue-900 text-white rounded-xl text-xs font-black transition-all shadow-xs"
          >
            <PlusCircle className="w-4 h-4 text-amber-400" />
            <span>Novo Lançamento</span>
          </button>
        </div>
      </div>

      {/* ZIP Processing & Success Banners */}
      {isExportingZip && (
        <div className="p-3.5 bg-blue-950 text-white rounded-2xl flex items-center justify-between gap-3 shadow-md border border-blue-800 animate-in fade-in">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-amber-400 animate-spin shrink-0" />
            <div>
              <p className="text-xs font-black">Empacotando Arquivo ZIP de Comprovantes</p>
              <p className="text-[11px] text-blue-200">{zipProgress || 'Processando fotos e comprovantes...'}</p>
            </div>
          </div>
          <span className="text-[10px] uppercase font-mono text-amber-300 font-bold bg-white/10 px-2 py-1 rounded-md">
            Aguarde...
          </span>
        </div>
      )}

      {zipSuccessMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between gap-3 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5 text-emerald-800 text-xs font-bold">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{zipSuccessMsg}</span>
          </div>
          <button
            onClick={() => setZipSuccessMsg(null)}
            className="p-1 text-emerald-700 hover:text-emerald-950"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {batchSuccessMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between gap-3 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5 text-emerald-800 text-xs font-bold">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{batchSuccessMsg}</span>
          </div>
          <button
            onClick={() => setBatchSuccessMsg(null)}
            className="p-1 text-emerald-700 hover:text-emerald-950"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Sub navigation bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 text-xs">
        <button
          onClick={() => setActiveSubTab('dashboard')}
          className={`flex items-center gap-1.5 px-4 py-2 font-extrabold rounded-xl transition-all whitespace-nowrap ${
            activeSubTab === 'dashboard'
              ? 'bg-blue-950 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <TrendingDown className="w-3.5 h-3.5" />
          <span>Dashboard Custos</span>
        </button>

        <button
          onClick={() => setActiveSubTab('lista')}
          className={`flex items-center gap-1.5 px-4 py-2 font-extrabold rounded-xl transition-all whitespace-nowrap ${
            activeSubTab === 'lista'
              ? 'bg-blue-950 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Lançamentos ({costs.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('novo')}
          className={`flex items-center gap-1.5 px-4 py-2 font-extrabold rounded-xl transition-all whitespace-nowrap ${
            activeSubTab === 'novo'
              ? 'bg-blue-950 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Entrada com IA / Manual</span>
        </button>

        <button
          onClick={() => setActiveSubTab('relatorios')}
          className={`flex items-center gap-1.5 px-4 py-2 font-extrabold rounded-xl transition-all whitespace-nowrap ${
            activeSubTab === 'relatorios'
              ? 'bg-blue-950 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Download className="w-3.5 h-3.5" />
          <span>Relatórios & Exportação</span>
        </button>

        <button
          onClick={() => setActiveSubTab('categorias')}
          className={`flex items-center gap-1.5 px-4 py-2 font-extrabold rounded-xl transition-all whitespace-nowrap ${
            activeSubTab === 'categorias'
              ? 'bg-blue-950 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Categorias ({categories.length})</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* 1. DASHBOARD DE CUSTOS (ISOLADO) */}
      {/* ======================================================== */}
      {/* ======================================================== */}
      {/* 1. DASHBOARD DE CUSTOS (ISOLADO) */}
      {/* ======================================================== */}
      {activeSubTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Módulo Mensal: "Custos de [Mês / Ano]" (Idêntico ao Dashboard de Recebimentos) */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3 sm:space-y-4">
            {/* Row Header com título dinâmico e Seletor de Mês/Ano */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-900 shrink-0"></span>
                <h2 className="text-base sm:text-lg font-extrabold text-blue-950 tracking-tight">
                  Custos de {getMonthLabel(selectedMonth)}
                </h2>
                <span className="text-xs text-slate-400 hidden md:inline">
                  · {selectedMonth === 'todos' ? 'Exibindo todos os lançamentos da obra' : 'Filtrado por vencimento ou emissão'}
                </span>
              </div>

              {/* Seletor Dropdown Mês / Ano + Opção "Todos os Meses / Total Geral" + PDF + ZIP + Planilha */}
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-white border-2 border-slate-300 text-slate-900 text-xs font-bold rounded-xl px-2.5 sm:px-3 py-1.5 focus:outline-hidden focus:border-blue-900 shadow-2xs cursor-pointer"
                >
                  {MONTH_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                {selectedMonth !== 'todos' && (
                  <button
                    onClick={() => setSelectedMonth('todos')}
                    className="px-2 py-1.5 text-xs font-bold text-blue-950 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors shrink-0"
                    title="Ver Total de Todos os Meses"
                  >
                    Ver Todos
                  </button>
                )}

                {/* [ 🖨 PDF ] */}
                <button
                  onClick={() => handleOpenPdfReport('mes')}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors shadow-2xs"
                  title="Abrir Relatório de Custos em PDF"
                >
                  <Printer className="w-3.5 h-3.5 text-rose-600" />
                  <span>PDF</span>
                </button>

                {/* [ 📦 ZIP ] */}
                <button
                  onClick={() => handleExportZip(selectedMonth === 'todos' ? 'todos' : 'mes')}
                  disabled={isExportingZip}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-blue-950 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors shadow-2xs disabled:opacity-50"
                  title="Baixar comprovantes do período em arquivo ZIP"
                >
                  <Package className="w-3.5 h-3.5 text-blue-900" />
                  <span>ZIP ({periodAttachmentsCount})</span>
                </button>

                {/* [ 📄 Planilha ] */}
                <button
                  onClick={() => exportCostsCSV(periodCosts)}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors shadow-2xs"
                  title="Baixar Planilha Excel / CSV deste período"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Planilha</span>
                </button>
              </div>
            </div>

            {/* 4 Cards Principais do Período Selecionado (iguais ao Dashboard de Recebimentos) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Card 1: Pago no Mês */}
              <div className="bg-white border-2 border-emerald-500/80 rounded-2xl p-4 shadow-xs relative overflow-hidden group hover:border-emerald-600 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    {selectedMonth === 'todos' ? 'TOTAL PAGO' : 'PAGO NO MÊS'}
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-emerald-700 font-mono-numbers mt-2">
                  {formatCurrency(periodStats.periodPaid)}
                </div>
                <span className="text-[11px] text-slate-500 mt-0.5 block">Custos liquidados</span>
              </div>

              {/* Card 2: Previsto no Mês */}
              <div className="bg-white border-2 border-blue-950/80 rounded-2xl p-4 shadow-xs relative overflow-hidden group hover:border-blue-950 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-blue-950 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-900" />
                    {selectedMonth === 'todos' ? 'TOTAL PREVISTO' : 'PREVISTO NO MÊS'}
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-blue-950 font-mono-numbers mt-2">
                  {formatCurrency(periodStats.periodTotal)}
                </div>
                <span className="text-[11px] text-slate-500 mt-0.5 block">Total programado</span>
              </div>

              {/* Card 3: Pendente no Mês */}
              <div className="bg-white border-2 border-amber-500/80 rounded-2xl p-4 shadow-xs relative overflow-hidden group hover:border-amber-600 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    {selectedMonth === 'todos' ? 'TOTAL A PAGAR' : 'PENDENTE NO MÊS'}
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-amber-700 font-mono-numbers mt-2">
                  {formatCurrency(periodStats.periodPending)}
                </div>
                <span className="text-[11px] text-slate-500 mt-0.5 block">A vencer ou a pagar</span>
              </div>

              {/* Card 4: Valores Vencidos */}
              <div className="bg-white border-2 border-rose-500/80 rounded-2xl p-4 shadow-xs relative overflow-hidden group hover:border-rose-600 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    VALORES VENCIDOS
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-rose-700 font-mono-numbers mt-2">
                  {formatCurrency(periodStats.periodOverdue)}
                </div>
                <span className="text-[11px] text-slate-500 mt-0.5 block">Atrasos em aberto</span>
              </div>
            </div>
          </div>

          {/* Banner com Total Geral Consolidado de Todos os Meses */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-950 text-white flex items-center justify-center font-black text-xs">
                OBRA
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  TOTAL CONSOLIDADO DE TODOS OS MESES (GERAL DA OBRA)
                </span>
                <div className="text-lg font-black text-blue-950 font-mono-numbers">
                  {formatCurrency(stats.totalAll)}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Total Liquidado</span>
                <span className="font-bold text-emerald-700">{formatCurrency(stats.totalPaid)}</span>
              </div>
              <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Total Pendente</span>
                <span className="font-bold text-amber-700">{formatCurrency(stats.totalPending)}</span>
              </div>
              <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Total Vencido</span>
                <span className="font-bold text-rose-700">{formatCurrency(stats.totalOverdue)}</span>
              </div>
            </div>
          </div>

          {/* Breakdown Section: Categorias & Fornecedores */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Por Categoria */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-blue-950 uppercase tracking-wide flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-900" />
                  Distribuição por Categoria
                </h3>
                <span className="text-xs text-slate-400 font-medium">{stats.topCategories.length} categorias ativas</span>
              </div>

              {stats.topCategories.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Nenhum custo lançado ainda. Use o botão <strong>Novo Lançamento</strong> para começar.
                </div>
              ) : (
                <div className="space-y-3">
                  {stats.topCategories.map((cat) => {
                    const pct = stats.totalAll > 0 ? (cat.amount / stats.totalAll) * 100 : 0;
                    return (
                      <div key={cat.name} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800">{cat.name}</span>
                          <div className="flex items-center gap-2 font-mono">
                            <span className="text-slate-400 text-[11px]">{pct.toFixed(1)}%</span>
                            <span className="font-bold text-blue-950">{formatCurrency(cat.amount)}</span>
                          </div>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-950 rounded-full"
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Maiores Fornecedores */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-blue-950 uppercase tracking-wide flex items-center gap-2">
                  <Building className="w-4 h-4 text-blue-900" />
                  Principais Fornecedores & Prestadores
                </h3>
                <span className="text-xs text-slate-400 font-medium">Top 6</span>
              </div>

              {stats.topSuppliers.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Nenhum fornecedor registrado.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {stats.topSuppliers.map((s, idx) => (
                    <div
                      key={s.name}
                      className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-950 text-xs font-black flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-extrabold text-slate-800">{s.name}</span>
                      </div>
                      <span className="text-xs font-black font-mono text-blue-950">
                        {formatCurrency(s.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Launch Banner */}
          <div className="bg-gradient-to-r from-blue-950 to-blue-900 rounded-2xl p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h4 className="text-base font-black">Lançamento Ultra-rápido pelo Celular</h4>
              </div>
              <p className="text-xs text-blue-200 max-w-xl">
                Basta tirar a foto da nota fiscal no canteiro de obras ou mandar um áudio/texto curto. Nossa IA extrai tudo e arquiva o comprovante permanente no banco de dados.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  setActiveSubTab('novo');
                  setInputMethod('ia_foto');
                }}
                className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-blue-950 rounded-xl text-xs font-black transition-all shadow-xs flex items-center gap-1.5"
              >
                <Camera className="w-4 h-4" />
                <span>Foto com IA</span>
              </button>
              <button
                onClick={() => {
                  setActiveSubTab('novo');
                  setInputMethod('ia_texto');
                }}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-white/20"
              >
                <FileText className="w-4 h-4" />
                <span>Texto Livre</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. NOVO LANÇAMENTO (3 FORMAS DE ENTRADA) */}
      {/* ======================================================== */}
      {activeSubTab === 'novo' && (
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Method selector tabs */}
          <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-2xl">
            <button
              onClick={() => setInputMethod('ia_foto')}
              className={`flex items-center justify-center gap-2 py-3 px-2 rounded-xl text-xs font-extrabold transition-all ${
                inputMethod === 'ia_foto'
                  ? 'bg-white text-blue-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Camera className="w-4 h-4 text-blue-900" />
              <span>1. Foto / PDF / Planilha com IA</span>
            </button>

            <button
              onClick={() => setInputMethod('ia_texto')}
              className={`flex items-center justify-center gap-2 py-3 px-2 rounded-xl text-xs font-extrabold transition-all ${
                inputMethod === 'ia_texto'
                  ? 'bg-white text-blue-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>2. Texto Livre com IA</span>
            </button>

            <button
              onClick={handleStartManual}
              className={`flex items-center justify-center gap-2 py-3 px-2 rounded-xl text-xs font-extrabold transition-all ${
                inputMethod === 'manual'
                  ? 'bg-white text-blue-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Edit className="w-4 h-4 text-slate-700" />
              <span>3. Manual</span>
            </button>
          </div>

          {/* METHOD 1: FOTO, PDF OU PLANILHA COM IA */}
          {inputMethod === 'ia_foto' && (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-5">
              <div>
                <h3 className="text-base font-black text-blue-950 flex items-center gap-2">
                  <Camera className="w-5 h-5 text-blue-900" />
                  Fotografar ou Enviar Arquivo (Foto, PDF ou Planilha)
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  A inteligência artificial analisa fotos de notas, recibos, cupons, documentos PDF (DANFE/faturas) ou planilhas Excel/CSV, identificando fornecedor, valores e itens individuais ou em lote.
                </p>
              </div>

              {/* Upload or Camera Triggers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  ref={cameraInputRef}
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handlePhotoSelect(e.target.files[0])}
                />
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="p-5 border-2 border-dashed border-blue-400 bg-blue-50/40 hover:bg-blue-50 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all cursor-pointer group"
                >
                  <div className="w-12 h-12 rounded-full bg-blue-950 text-white flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Camera className="w-6 h-6 text-amber-400" />
                  </div>
                  <span className="font-extrabold text-blue-950 text-xs">Abrir Câmera do Celular</span>
                  <span className="text-[10px] text-slate-500">Tirar foto imediata do comprovante</span>
                </button>

                <input
                  type="file"
                  accept="image/*,application/pdf,.pdf,.xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handlePhotoSelect(e.target.files[0])}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-5 border-2 border-dashed border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/20 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all cursor-pointer group"
                >
                  <div className="w-12 h-12 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <UploadCloud className="w-6 h-6 text-blue-950" />
                  </div>
                  <span className="font-extrabold text-slate-800 text-xs">Escolher Foto, PDF ou Planilha</span>
                  <span className="text-[10px] text-slate-500">JPG, PNG, PDF, Excel (.xlsx, .xls) ou CSV</span>
                </button>
              </div>

              {/* File Preview & Action */}
              {photoPreview && photoFile && (
                <div className="space-y-4 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">Arquivo selecionado:</span>
                    <span className="text-slate-500 font-mono text-[11px] truncate max-w-[240px] sm:max-w-md">
                      {photoFile.name} ({(photoFile.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>

                  {/* Renderização contextual conforme o tipo de arquivo */}
                  {photoFile.name.toLowerCase().endsWith('.pdf') || photoFile.type.includes('pdf') ? (
                    <div className="p-6 bg-rose-50 border-2 border-dashed border-rose-300 rounded-2xl flex flex-col items-center justify-center gap-2 text-center">
                      <div className="w-14 h-14 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
                        <FileText className="w-7 h-7" />
                      </div>
                      <span className="font-extrabold text-sm text-rose-950 break-all">{photoFile.name}</span>
                      <span className="text-[11px] font-bold text-rose-700 bg-rose-100/90 px-3 py-1 rounded-full border border-rose-200">
                        📄 Documento PDF pronto para extração contábil com IA (DANFE / Recibo / Boleto)
                      </span>
                    </div>
                  ) : photoFile.name.toLowerCase().match(/\.(xlsx|xls|csv)$/) || photoFile.type.includes('sheet') || photoFile.type.includes('excel') || photoFile.type.includes('csv') ? (
                    <div className="p-6 bg-emerald-50 border-2 border-dashed border-emerald-300 rounded-2xl flex flex-col items-center justify-center gap-2 text-center">
                      <div className="w-14 h-14 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shadow-xs">
                        <FileSpreadsheet className="w-7 h-7" />
                      </div>
                      <span className="font-extrabold text-sm text-emerald-950 break-all">{photoFile.name}</span>
                      <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/90 px-3 py-1 rounded-full border border-emerald-200">
                        📊 Planilha Excel / CSV pronta para leitura de lançamentos de custos pela IA
                      </span>
                    </div>
                  ) : (
                    <div className="relative rounded-2xl overflow-hidden border border-slate-200 max-h-80 bg-slate-100 flex items-center justify-center">
                      <img
                        src={photoPreview}
                        alt="Prévia do documento"
                        className="max-h-80 w-auto object-contain"
                      />
                    </div>
                  )}

                  <button
                    onClick={handleAnalyzePhoto}
                    disabled={isAnalyzingPhoto}
                    className="w-full py-3.5 bg-blue-950 hover:bg-blue-900 disabled:opacity-50 text-white font-extrabold rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                  >
                    {isAnalyzingPhoto ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                        <span>Extraindo Dados com IA (Gemini 3.8)...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>Processar e Identificar Dados com IA</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {aiAnalysisError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{aiAnalysisError}</span>
                </div>
              )}
            </div>
          )}

          {/* METHOD 2: TEXTO LIVRE COM IA */}
          {inputMethod === 'ia_texto' && (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
              <div>
                <h3 className="text-base font-black text-blue-950 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  Lançar Custo por Texto Livre
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Digite ou cole uma mensagem informal (ex: relato de compras, diárias, mensagens de WhatsApp). A IA entenderá todos os dados.
                </p>
              </div>

              <div>
                <textarea
                  rows={4}
                  value={naturalText}
                  onChange={(e) => setNaturalText(e.target.value)}
                  placeholder="Exemplo: Comprei 20 m³ de areia lavada por R$ 1.000,00 no dia 06/11/2026 com a Areial São Jorge via Pix. Pago à vista."
                  className="w-full p-3.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-900 focus:outline-hidden text-slate-800 placeholder-slate-400"
                />
              </div>

              <button
                onClick={handleAnalyzeText}
                disabled={isAnalyzingText || !naturalText.trim()}
                className="w-full py-3.5 bg-blue-950 hover:bg-blue-900 disabled:opacity-50 text-white font-extrabold rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                {isAnalyzingText ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                    <span>Interpretando Relato com IA...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Interpretar Texto e Gerar Custo</span>
                  </>
                )}
              </button>

              {aiAnalysisError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{aiAnalysisError}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. TELA CONFIRME OS DADOS (EDITAR, CONFIRMAR E SALVAR, CANCELAR) */}
      {/* ======================================================== */}
      {showConfirmModal && draftCost && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[90vh]">
            {/* Header */}
            <div className="bg-blue-950 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-amber-400" />
                <h3 className="font-extrabold text-sm sm:text-base">
                  Confirme os Dados do Custo
                </h3>
                <span className="bg-blue-800 text-white text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                  {draftCost.code}
                </span>
              </div>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="p-1 text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">
                  Origem do lançamento:{' '}
                  <strong className="text-blue-950 uppercase font-mono">
                    {draftCost.origin}
                  </strong>
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditingDraft(!isEditingDraft)}
                  className="flex items-center gap-1 font-bold text-blue-900 hover:text-blue-700"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>{isEditingDraft ? 'Visualizar Resumo' : 'Editar Campos'}</span>
                </button>
              </div>

              {isEditingDraft ? (
                /* Formulário de Edição Completo */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Fornecedor / Prestador *</label>
                    <input
                      type="text"
                      value={draftCost.supplier || ''}
                      onChange={(e) => setDraftCost({ ...draftCost, supplier: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Item / Descrição Resumida *</label>
                    <input
                      type="text"
                      value={draftCost.item || ''}
                      onChange={(e) => setDraftCost({ ...draftCost, item: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Categoria *</label>
                    <select
                      value={draftCost.category || ''}
                      onChange={(e) => setDraftCost({ ...draftCost, category: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                    >
                      {categories.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Tipo de Custo</label>
                    <select
                      value={draftCost.costType || 'materiais'}
                      onChange={(e) => setDraftCost({ ...draftCost, costType: e.target.value as any })}
                      className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="materiais">Materiais de Construção</option>
                      <option value="mao_de_obra">Mão de Obra</option>
                      <option value="fretes">Fretes & Transportes</option>
                      <option value="servicos">Serviços Especializados</option>
                      <option value="equipamentos">Locação de Equipamentos</option>
                      <option value="outros">Outros</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Data Emissão / Compra *</label>
                    <input
                      type="date"
                      value={draftCost.date || ''}
                      onChange={(e) => setDraftCost({ ...draftCost, date: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Vencimento (Se pendente)</label>
                    <input
                      type="date"
                      value={draftCost.dueDate || ''}
                      onChange={(e) => setDraftCost({ ...draftCost, dueDate: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Quantidade</label>
                      <input
                        type="number"
                        step="any"
                        value={draftCost.quantity ?? 1}
                        onChange={(e) => {
                          const q = parseFloat(e.target.value) || 0;
                          const up = draftCost.unitPrice || 0;
                          setDraftCost({
                            ...draftCost,
                            quantity: q,
                            totalAmount: q * up > 0 ? q * up : draftCost.totalAmount,
                          });
                        }}
                        className="w-full p-2 border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Unidade</label>
                      <input
                        type="text"
                        value={draftCost.unit || 'un'}
                        onChange={(e) => setDraftCost({ ...draftCost, unit: e.target.value })}
                        className="w-full p-2 border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Preço Unitário (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={draftCost.unitPrice ?? 0}
                        onChange={(e) => {
                          const up = parseFloat(e.target.value) || 0;
                          const q = draftCost.quantity || 1;
                          setDraftCost({
                            ...draftCost,
                            unitPrice: up,
                            totalAmount: q * up > 0 ? q * up : draftCost.totalAmount,
                          });
                        }}
                        className="w-full p-2 border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Valor Total (R$) *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={draftCost.totalAmount ?? 0}
                        onChange={(e) => setDraftCost({ ...draftCost, totalAmount: parseFloat(e.target.value) || 0 })}
                        className="w-full p-2 border border-blue-400 font-bold bg-blue-50/50 rounded-lg"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Forma de Pagamento</label>
                    <select
                      value={draftCost.paymentMethod || 'pix'}
                      onChange={(e) => setDraftCost({ ...draftCost, paymentMethod: e.target.value as any })}
                      className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="pix">PIX</option>
                      <option value="boleto">Boleto Bancário</option>
                      <option value="transferencia">Transferência TED</option>
                      <option value="cartao">Cartão de Crédito/Débito</option>
                      <option value="dinheiro">Dinheiro em Espécie</option>
                      <option value="outro">Outro</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Status Inicial</label>
                    <select
                      value={draftCost.status || 'PENDENTE'}
                      onChange={(e) => setDraftCost({ ...draftCost, status: e.target.value as any })}
                      className="w-full p-2 border border-slate-300 rounded-lg bg-white font-bold"
                    >
                      <option value="PENDENTE">PENDENTE</option>
                      <option value="PAGO">PAGO</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="font-bold text-slate-700 block mb-1">Observações / Dados NF</label>
                    <textarea
                      rows={2}
                      value={draftCost.observations || ''}
                      onChange={(e) => setDraftCost({ ...draftCost, observations: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              ) : (
                /* Card Visual de Conferência */
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-blue-900 block">Valor Total</span>
                      <span className="text-2xl font-black text-blue-950 font-mono-numbers">
                        {formatCurrency(draftCost.totalAmount)}
                      </span>
                    </div>
                    <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-lg font-bold uppercase text-[11px]">
                      {draftCost.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-slate-400 block text-[10px] font-bold uppercase">Fornecedor</span>
                      <strong className="text-slate-900">{draftCost.supplier}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] font-bold uppercase">Item</span>
                      <strong className="text-slate-900">{draftCost.item}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] font-bold uppercase">Categoria</span>
                      <span className="text-blue-950 font-medium">{draftCost.category}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] font-bold uppercase">Tipo</span>
                      <span className="text-slate-700 font-medium">{draftCost.costType}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] font-bold uppercase">Quantidade</span>
                      <span className="text-slate-800">{draftCost.quantity} {draftCost.unit}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] font-bold uppercase">Data Compra</span>
                      <span className="text-slate-800">{formatDateBR(draftCost.date)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] font-bold uppercase">Forma Pagto</span>
                      <span className="text-slate-800 uppercase font-mono">{draftCost.paymentMethod}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] font-bold uppercase">Vencimento</span>
                      <span className="text-slate-800">{formatDateBR(draftCost.dueDate) || 'À vista / Imediato'}</span>
                    </div>
                  </div>

                  {draftCost.observations && (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600">
                      <strong>Obs:</strong> {draftCost.observations}
                    </div>
                  )}
                </div>
              )}

              {/* Anexos vinculados */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-blue-900" />
                    Documentos e Comprovantes Vinculados ({draftDocuments.length})
                  </span>

                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    ref={extraDocInputRef}
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleAddDraftDocument(e.target.files[0])}
                  />
                  <button
                    type="button"
                    onClick={() => extraDocInputRef.current?.click()}
                    className="text-[11px] font-bold text-blue-900 hover:text-blue-700"
                  >
                    + Adicionar Anexo
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {draftDocuments.map((doc, i) => (
                    <div
                      key={doc.id || i}
                      className="px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded-lg flex items-center gap-2 text-[11px]"
                    >
                      <Paperclip className="w-3 h-3 text-slate-500" />
                      <span className="max-w-[150px] truncate font-medium text-slate-800">{doc.name}</span>
                      <button
                        type="button"
                        onClick={() => setPreviewDoc(doc)}
                        className="text-blue-700 hover:text-blue-900"
                        title="Ver anexo"
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {draftDocuments.length === 0 && (
                    <span className="text-[11px] text-slate-400 italic">Nenhum comprovante anexado.</span>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Modal Actions matching Prompt: EDITAR, CONFIRMAR E SALVAR, CANCELAR */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors flex items-center justify-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                <span>❌ Cancelar</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingDraft(!isEditingDraft)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <Edit className="w-3.5 h-3.5 text-slate-600" />
                  <span>✏️ {isEditingDraft ? 'Concluir Edição' : 'Editar'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleConfirmAndSaveDraft}
                  className="px-5 py-2.5 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>✅ Confirmar e Salvar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3.1 MODAL DE CONFIRMAÇÃO DE LOTE / PLANILHA EXTRAÍDA COM IA */}
      {/* ======================================================== */}
      {showBatchModal && batchCostItems && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[90vh]">
            {/* Header */}
            <div className="bg-emerald-950 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                <h3 className="font-extrabold text-sm sm:text-base">
                  Lançamentos Identificados na Planilha pela IA
                </h3>
                <span className="bg-emerald-800 text-white text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                  {batchCostItems.length} itens encontrados
                </span>
              </div>
              <button
                onClick={() => setShowBatchModal(false)}
                className="p-1 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs">
                <strong>{batchSummary || `Foram extraídos ${batchCostItems.length} registros.`}</strong>
                <p className="text-[11px] text-emerald-800 mt-0.5">
                  Revise a lista abaixo antes de confirmar. Todos os itens serão cadastrados no Módulo de Custos com códigos sequenciais da obra.
                </p>
              </div>

              {/* Tabela de itens extraídos */}
              <div className="border border-slate-200 rounded-xl overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <th className="p-2.5">#</th>
                      <th className="p-2.5">Data</th>
                      <th className="p-2.5">Fornecedor</th>
                      <th className="p-2.5">Item / Descrição</th>
                      <th className="p-2.5">Categoria</th>
                      <th className="p-2.5 text-center">Qtd</th>
                      <th className="p-2.5 text-right">Valor Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {batchCostItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2.5 font-mono text-slate-400 font-bold">{idx + 1}</td>
                        <td className="p-2.5 whitespace-nowrap">{formatDateBR(item.date)}</td>
                        <td className="p-2.5 font-bold text-slate-900">{item.supplier || '—'}</td>
                        <td className="p-2.5 text-slate-700 max-w-[200px] truncate">{item.item}</td>
                        <td className="p-2.5 text-slate-600">{item.category}</td>
                        <td className="p-2.5 text-center font-mono">{item.quantity} {item.unit}</td>
                        <td className="p-2.5 text-right font-bold font-mono text-emerald-700">
                          {formatCurrency(item.totalAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 font-bold border-t border-slate-200">
                      <td colSpan={6} className="p-2.5 text-right text-slate-700 uppercase">
                        Soma Total da Planilha ({batchCostItems.length} itens):
                      </td>
                      <td className="p-2.5 text-right font-black font-mono text-emerald-800 text-sm">
                        {formatCurrency(batchCostItems.reduce((acc, i) => acc + (Number(i.totalAmount) || 0), 0))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setShowBatchModal(false)}
                className="px-4 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancelar</span>
              </button>

              <button
                type="button"
                onClick={handleConfirmBatchImport}
                className="px-5 py-2.5 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>✅ Confirmar e Importar Todos os {batchCostItems.length} Lançamentos</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. LISTA DE CUSTOS COM DOCUMENTOS E FILTROS */}
      {/* ======================================================== */}
      {activeSubTab === 'lista' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por código, fornecedor, item..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-900 focus:outline-hidden text-slate-800"
                />
              </div>

              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-slate-700 font-bold"
              >
                {MONTH_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-slate-700 font-medium"
              >
                <option value="todas">Todas as Categorias</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-slate-700 font-medium"
              >
                <option value="todos">Todos os Status</option>
                <option value="PENDENTE">Pendentes</option>
                <option value="PAGO">Pagos</option>
                <option value="EM ATRASO">Em Atraso</option>
              </select>
            </div>

            <button
              onClick={() => exportCostsCSV(filteredCosts)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar CSV</span>
            </button>
          </div>

          {/* Costs List Cards */}
          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
            {filteredCosts.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <FileText className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="font-bold text-slate-700">Nenhum lançamento encontrado</p>
                <p className="text-xs text-slate-400 mt-1">
                  Lance notas fiscais com fotos ou cadastre despesas da obra para controlar os custos.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredCosts.map((c) => {
                  const isPaid = c.status === 'PAGO';
                  const isOverdue = !isPaid && c.dueDate && c.dueDate < new Date().toISOString().slice(0, 10);

                  return (
                    <div
                      key={c.id}
                      className="p-4 lg:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-black text-xs text-blue-950 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-300">
                            {c.code}
                          </span>
                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                              isPaid
                                ? 'bg-emerald-100 text-emerald-800'
                                : isOverdue
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {isOverdue ? 'EM ATRASO' : c.status}
                          </span>
                          <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                            {c.category}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            Data: {formatDateBR(c.date)}
                          </span>
                        </div>

                        <div className="text-sm font-extrabold text-slate-900">
                          {c.item}{' '}
                          <span className="text-xs font-normal text-slate-500">
                            • Fornecedor: <strong className="text-slate-800">{c.supplier}</strong>
                          </span>
                        </div>

                        <div className="text-xs text-slate-500">
                          Qtd: <strong className="text-slate-700">{c.quantity} {c.unit}</strong> • Unitário:{' '}
                          <strong className="text-slate-700 font-mono">{formatCurrency(c.unitPrice)}</strong> • Método:{' '}
                          <span className="uppercase font-mono text-slate-600">{c.paymentMethod}</span>
                        </div>

                        {c.documents.length > 0 && (
                          <div className="flex items-center gap-1.5 pt-1">
                            <Paperclip className="w-3 h-3 text-blue-900" />
                            <span className="text-[11px] text-blue-900 font-bold">
                              {c.documents.length} documento(s) anexo(s) permanente(s)
                            </span>
                            <div className="flex items-center gap-1 ml-1">
                              {c.documents.map((d) => (
                                <button
                                  key={d.id}
                                  onClick={() => setPreviewDoc(d)}
                                  className="px-1.5 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-900 rounded-sm text-[10px] font-mono border border-blue-200"
                                  title="Visualizar documento"
                                >
                                  👁️ {d.name.slice(0, 15)}...
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        <div className="text-left sm:text-right">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            VALOR DO CUSTO
                          </span>
                          <span className="text-lg font-black font-mono-numbers text-blue-950">
                            {formatCurrency(c.totalAmount)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {!isPaid && (
                            <button
                              onClick={() => {
                                setMarkingPaidCost(c);
                                setPaymentDateInput(new Date().toISOString().slice(0, 10));
                              }}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors shadow-2xs"
                              title="Marcar como Pago"
                            >
                              Dar Baixa
                            </button>
                          )}

                          <button
                            onClick={() => setViewingCostDetails(c)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                            title="Ver detalhes e auditoria"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDeleteCost(c)}
                            className="p-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 rounded-lg transition-colors"
                            title="Excluir custo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. RELATÓRIOS ISOLADOS DE CUSTOS (CSV E PDF) */}
      {/* ======================================================== */}
      {activeSubTab === 'relatorios' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-black text-blue-950 flex items-center gap-2">
              <Download className="w-5 h-5 text-blue-900" />
              Relatórios Executivos de Custos do PRÉDIO EW
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Exportação oficial exclusiva dos gastos da obra, sem vinculação com os fluxos de venda aos compradores.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1: Planilha CSV */}
            <div className="p-5 border border-slate-200 rounded-2xl bg-slate-50/50 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  <h4 className="font-extrabold text-sm text-slate-900">Planilhas Excel / CSV</h4>
                </div>
                <p className="text-xs text-slate-500">
                  Gera planilhas tabulares compatíveis com Excel e Google Sheets com todas as colunas discriminadas.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={() => exportCostsCSV(periodCosts)}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar Planilha do Mês ({getMonthLabel(selectedMonth).slice(0, 16)}...)</span>
                </button>
                <button
                  onClick={() => exportCostsCSV(costs)}
                  className="w-full py-2 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Baixar Geral da Obra ({costs.length} itens)</span>
                </button>
              </div>
            </div>

            {/* Card 2: Relatório PDF / Impresso */}
            <div className="p-5 border border-slate-200 rounded-2xl bg-slate-50/50 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Printer className="w-5 h-5 text-rose-600" />
                  <h4 className="font-extrabold text-sm text-slate-900">Relatório Executivo em PDF</h4>
                </div>
                <p className="text-xs text-slate-500">
                  Layout pronto para salvar em PDF ou imprimir sem cortes, com KPIs, somatórios, divisão por categorias e assinaturas.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={() => handleOpenPdfReport('mes')}
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>Abrir / Gerar PDF do Mês Atual</span>
                </button>
                <button
                  onClick={() => handleOpenPdfReport('todos')}
                  className="w-full py-2 bg-white hover:bg-rose-50 text-rose-800 border border-rose-300 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-rose-600" />
                  <span>Abrir / Gerar PDF Geral da Obra</span>
                </button>
              </div>
            </div>

            {/* Card 3: Pacote de Comprovantes em ZIP */}
            <div className="p-5 border border-slate-200 rounded-2xl bg-blue-50/40 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-900" />
                  <h4 className="font-extrabold text-sm text-slate-900">Comprovantes & Notas em ZIP</h4>
                </div>
                <p className="text-xs text-slate-500">
                  Baixe em um único arquivo .ZIP todos os comprovantes, notas fiscais e fotos originais anexadas aos custos para envio por e-mail ou WhatsApp.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={() => handleExportZip('mes')}
                  disabled={isExportingZip}
                  className="w-full py-2.5 bg-blue-950 hover:bg-blue-900 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
                >
                  <Package className="w-4 h-4 text-amber-400" />
                  <span>Baixar ZIP do Mês ({periodAttachmentsCount} fotos)</span>
                </button>
                <button
                  onClick={() => handleExportZip('todos')}
                  disabled={isExportingZip}
                  className="w-full py-2 bg-white hover:bg-blue-50 text-blue-950 border border-blue-300 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <FolderArchive className="w-3.5 h-3.5 text-blue-900" />
                  <span>Baixar ZIP Geral da Obra ({totalAttachmentsCount} fotos)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. GESTÃO DE CATEGORIAS */}
      {/* ======================================================== */}
      {activeSubTab === 'categorias' && (
        <div className="max-w-2xl bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-5">
          <div>
            <h3 className="text-base font-black text-blue-950 flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-900" />
              Categorias de Custos Personalizadas
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Adicione categorias específicas para classificar compras de materiais e contratações da obra.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newCatInput}
              onChange={(e) => setNewCatInput(e.target.value)}
              placeholder="Nome da nova categoria (ex: Pintura e Acabamento)"
              className="flex-1 p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
            />
            <button
              onClick={handleAddCategory}
              className="px-4 py-2.5 bg-blue-950 hover:bg-blue-900 text-white font-bold text-xs rounded-xl transition-colors shadow-2xs"
            >
              Adicionar
            </button>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {categories.map((c) => (
              <span
                key={c}
                className="px-3 py-1.5 bg-slate-100 border border-slate-200 text-slate-800 rounded-xl text-xs font-bold"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: DOCUMENT PREVIEW (FOTO / PDF) */}
      {/* ======================================================== */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[90vh]">
            <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2 truncate">
                <Paperclip className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-xs truncate">{previewDoc.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadDoc(previewDoc)}
                  className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar</span>
                </button>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-1 text-slate-300 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 bg-slate-100 flex items-center justify-center overflow-auto max-h-[75vh]">
              {previewDoc.type.includes('pdf') ? (
                <iframe
                  src={previewDoc.dataUrl}
                  title={previewDoc.name}
                  className="w-full h-[600px] rounded-xl border border-slate-300"
                />
              ) : (
                <img
                  src={previewDoc.dataUrl}
                  alt={previewDoc.name}
                  className="max-h-[70vh] w-auto object-contain rounded-xl shadow-xs"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: DAR BAIXA EM CUSTO */}
      {/* ======================================================== */}
      {markingPaidCost && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-2.5 text-emerald-700">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
              <h3 className="font-extrabold text-base text-slate-900">
                Confirmar Pagamento do Custo
              </h3>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <div><strong>Código:</strong> {markingPaidCost.code}</div>
              <div><strong>Item:</strong> {markingPaidCost.item}</div>
              <div><strong>Fornecedor:</strong> {markingPaidCost.supplier}</div>
              <div><strong>Valor:</strong> {formatCurrency(markingPaidCost.totalAmount)}</div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Data Efetiva de Pagamento *
              </label>
              <input
                type="date"
                value={paymentDateInput}
                onChange={(e) => setPaymentDateInput(e.target.value)}
                className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setMarkingPaidCost(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmCostPayment}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
              >
                Confirmar Baixa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: DETALHES COMPLETOS E HISTÓRICO DE AUDITORIA */}
      {/* ======================================================== */}
      {viewingCostDetails && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-900" />
                <h3 className="font-extrabold text-base text-blue-950">
                  Dossiê do Custo: {viewingCostDetails.code}
                </h3>
              </div>
              <button
                onClick={() => setViewingCostDetails(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500">Valor Total</span>
                <div className="text-xl font-black text-blue-950 font-mono-numbers">
                  {formatCurrency(viewingCostDetails.totalAmount)}
                </div>
              </div>
              <span className="px-2.5 py-1 bg-slate-100 text-slate-800 font-bold rounded-lg text-xs">
                {viewingCostDetails.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div><strong>Fornecedor:</strong> {viewingCostDetails.supplier}</div>
              <div><strong>Item:</strong> {viewingCostDetails.item}</div>
              <div><strong>Categoria:</strong> {viewingCostDetails.category}</div>
              <div><strong>Tipo:</strong> {viewingCostDetails.costType}</div>
              <div><strong>Data Lançamento:</strong> {formatDateBR(viewingCostDetails.date)}</div>
              <div><strong>Data Pagamento:</strong> {formatDateBR(viewingCostDetails.paidDate) || 'Pendente'}</div>
            </div>

            {/* Documentos Anexos */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="font-bold text-xs text-slate-800">Documentos Originais Arquivados:</span>
              <div className="flex flex-wrap gap-2">
                {viewingCostDetails.documents.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setPreviewDoc(d)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-blue-50 text-blue-900 rounded-lg text-xs font-bold border border-slate-200 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{d.name}</span>
                  </button>
                ))}
                {viewingCostDetails.documents.length === 0 && (
                  <span className="text-xs text-slate-400">Nenhum anexo.</span>
                )}
              </div>
            </div>

            {/* Histórico inalterável */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="font-bold text-xs text-slate-800">Trilha de Auditoria do Lançamento:</span>
              <div className="space-y-1.5 text-[11px] text-slate-600">
                {viewingCostDetails.history.map((h) => (
                  <div key={h.id} className="p-2 bg-slate-50 rounded-lg border border-slate-200/80">
                    <span className="font-bold text-blue-950">{formatDateTimeBR(h.timestamp)}: </span>
                    <span>{h.description}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RELATÓRIO OFICIAL DE CUSTOS EM PDF */}
      {showPdfReportModal && (
        <CostReportPrintModal
          costs={pdfReportScope === 'mes' && selectedMonth !== 'todos' ? periodCosts : costs}
          periodLabel={
            pdfReportScope === 'mes' && selectedMonth !== 'todos'
              ? getMonthLabel(selectedMonth)
              : 'Todos os Meses (Geral da Obra)'
          }
          onClose={() => setShowPdfReportModal(false)}
        />
      )}
    </div>
  );
};
