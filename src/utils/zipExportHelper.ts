import JSZip from 'jszip';
import { CostItem, CostDocument } from '../types';
import { getDocument } from './documentStorage';
import { formatCurrency, formatDateBR } from './formatters';

function sanitizeFilename(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_\-\.]/g, '_')
    .substring(0, 40);
}

function dataUrlToBinary(dataUrl: string): Uint8Array {
  const parts = dataUrl.split(',');
  const base64 = parts.length > 1 ? parts[1] : parts[0];
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export interface ZipExportProgress {
  current: number;
  total: number;
  currentFilename: string;
}

export async function exportCostAttachmentsZip(
  costs: CostItem[],
  scopeLabel: string = 'Geral',
  onProgress?: (progress: ZipExportProgress) => void
): Promise<{ success: boolean; filesCount: number; totalAmount: number }> {
  const zip = new JSZip();
  const folder = zip.folder('comprovantes_e_notas');

  // Coleta todos os documentos anexos presentes nos custos selecionados
  interface ItemDocPair {
    cost: CostItem;
    doc: CostDocument;
  }

  const pairs: ItemDocPair[] = [];
  costs.forEach((cost) => {
    if (cost.documents && cost.documents.length > 0) {
      cost.documents.forEach((doc) => {
        pairs.push({ cost, doc });
      });
    }
  });

  let totalAmount = costs.reduce((sum, c) => sum + c.totalAmount, 0);

  // 1. Gera o índice CSV com todas as despesas e comprovantes
  let csvContent = '\uFEFF'; // UTF-8 BOM para abrir perfeitamente no Excel
  csvContent += 'Código;Data Lançamento;Vencimento;Categoria;Fornecedor;Item / Descrição;Qtd;Unid;Valor Total;Status;Método;Arquivo Anexo\n';

  costs.forEach((c) => {
    const docNames = c.documents.map((d) => d.name).join(' | ') || 'Sem comprovante anexo';
    csvContent += `"${c.code}";"${c.date}";"${c.dueDate || ''}";"${c.category}";"${c.supplier}";"${c.item} - ${c.description || ''}";"${c.quantity}";"${c.unit}";"${c.totalAmount.toFixed(2).replace('.', ',')}";"${c.status}";"${c.paymentMethod}";"${docNames}"\n`;
  });

  zip.file('INDICE_COMPLETO_DE_CUSTOS.csv', csvContent);

  // 2. Gera arquivo de texto resumo do lote
  const now = new Date();
  const txtContent = `=====================================================
PRÉDIO EW — LOTE DE COMPROVANTES E NOTAS FISCAIS
Empreendimento Residencial · Gestão Financeira da Obra
=====================================================

Escopo do Lote: ${scopeLabel}
Data da Exportação: ${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR')}
Total de Lançamentos no Período: ${costs.length}
Total de Comprovantes/Imagens Anexadas: ${pairs.length}
Valor Total do Período: ${formatCurrency(totalAmount)}

INSTRUÇÕES:
- A pasta "comprovantes_e_notas" contém todas as fotos, notas fiscais,
  recibos e comprovantes de pagamento extraídos do sistema.
- Cada arquivo foi renomeado no padrão:
  DATA_CODIGO_FORNECEDOR_NOME_DO_ARQUIVO
- Consulte a planilha "INDICE_COMPLETO_DE_CUSTOS.csv" para conferência.
=====================================================`;

  zip.file('LEIA-ME_RESUMO_DO_LOTE.txt', txtContent);

  // 3. Adiciona cada arquivo anexo
  let addedCount = 0;
  for (let i = 0; i < pairs.length; i++) {
    const { cost, doc } = pairs[i];
    let dataUrl = doc.dataUrl;

    if (onProgress) {
      onProgress({
        current: i + 1,
        total: pairs.length,
        currentFilename: doc.name,
      });
    }

    // Se a dataUrl estiver vazia ou for apenas referência, busca do IndexedDB
    if (!dataUrl || !dataUrl.startsWith('data:')) {
      const stored = await getDocument(doc.id);
      if (stored && stored.dataUrl) {
        dataUrl = stored.dataUrl;
      }
    }

    if (dataUrl && folder) {
      try {
        const safeSupplier = sanitizeFilename(cost.supplier || 'Fornecedor');
        const safeDocName = sanitizeFilename(doc.name);
        const fileName = `${cost.date}_${cost.code}_${safeSupplier}_${safeDocName}`;
        const binary = dataUrlToBinary(dataUrl);
        folder.file(fileName, binary);
        addedCount++;
      } catch (err) {
        console.error(`Erro ao empacotar anexo ${doc.name}:`, err);
      }
    }
  }

  // 4. Gera o arquivo zip
  const blob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  // 5. Aciona o download no navegador
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeScope = sanitizeFilename(scopeLabel);
  a.href = url;
  a.download = `Comprovantes_Custos_Predio_EW_${safeScope}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return {
    success: true,
    filesCount: addedCount,
    totalAmount,
  };
}
