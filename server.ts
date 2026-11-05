import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import * as XLSX from 'xlsx';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Inicialização segura do SDK Gemini
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY não configurada no ambiente.');
  }
  return new GoogleGenAI();
}

const COST_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    category: {
      type: Type.STRING,
      description: 'Categoria do custo: Materiais de construção, Mão de obra, Fretes, Equipamentos, Energia, Água, Documentação, Taxas e impostos, Marketing, Administração, Serviços, Financeiro ou Outros.',
    },
    costType: {
      type: Type.STRING,
      enum: ['materiais', 'mao_de_obra', 'fretes', 'servicos', 'equipamentos', 'outros'],
      description: 'Tipo classificado do custo',
    },
    supplier: {
      type: Type.STRING,
      description: 'Nome fantasia ou Razão Social do fornecedor ou prestador de serviço',
    },
    item: {
      type: Type.STRING,
      description: 'Nome conciso do item ou serviço principal adquirido',
    },
    description: {
      type: Type.STRING,
      description: 'Detalhamento do item, especificação técnica, marca ou escopo',
    },
    quantity: {
      type: Type.NUMBER,
      description: 'Quantidade adquirida (número positivo)',
    },
    unit: {
      type: Type.STRING,
      description: 'Unidade de medida: un, m³, m², kg, saco, h, diária, mês, verba',
    },
    unitPrice: {
      type: Type.NUMBER,
      description: 'Preço unitário em Reais (R$)',
    },
    totalAmount: {
      type: Type.NUMBER,
      description: 'Valor total em Reais (R$)',
    },
    date: {
      type: Type.STRING,
      description: 'Data de emissão/compra no formato AAAA-MM-DD',
    },
    dueDate: {
      type: Type.STRING,
      description: 'Data de vencimento para pagamento no formato AAAA-MM-DD (se aplicável)',
    },
    paymentMethod: {
      type: Type.STRING,
      enum: ['pix', 'boleto', 'transferencia', 'cartao', 'dinheiro', 'outro'],
      description: 'Forma de pagamento indicada no documento ou texto',
    },
    observations: {
      type: Type.STRING,
      description: 'Número do documento/NF, chave de acesso, dados bancários ou observações relevantes',
    },
  },
  required: ['supplier', 'item', 'totalAmount'],
};

const BATCH_COST_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    items: {
      type: Type.ARRAY,
      items: COST_RESPONSE_SCHEMA,
      description: 'Lista de todos os lançamentos ou itens extraídos da planilha ou nota fiscal/documento',
    },
    summary: {
      type: Type.STRING,
      description: 'Breve resumo dos itens encontrados',
    },
  },
  required: ['items'],
};

// POST /api/gemini/parse-cost-document
// Analisa foto, recibo, cupom fiscal, PDF (DANFE, boleto) ou Planilhas (XLSX, XLS, CSV) com gemini-3.8-flash
app.post('/api/gemini/parse-cost-document', async (req: Request, res: Response) => {
  try {
    const { imageBase64, fileBase64, mimeType, fileName } = req.body;
    const rawBase64 = fileBase64 || imageBase64;

    if (!rawBase64) {
      res.status(400).json({ error: 'Nenhum arquivo, imagem ou documento enviado.' });
      return;
    }

    const ai = getGeminiClient();

    // Remove prefixo se houver "data:...;base64,"
    const cleanBase64 = rawBase64.replace(/^data:[^;]+;base64,/, '');

    const lowerName = (fileName || '').toLowerCase();
    const isSpreadsheet =
      lowerName.endsWith('.xlsx') ||
      lowerName.endsWith('.xls') ||
      lowerName.endsWith('.csv') ||
      mimeType?.includes('sheet') ||
      mimeType?.includes('excel') ||
      mimeType?.includes('csv');

    const isPdf =
      lowerName.endsWith('.pdf') ||
      mimeType === 'application/pdf' ||
      mimeType?.includes('pdf');

    // 1. Caso Planilha (Excel / CSV)
    if (isSpreadsheet) {
      const buffer = Buffer.from(cleanBase64, 'base64');
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      
      let allSheetsCsv = '';
      workbook.SheetNames.forEach((sheetName) => {
        const sheet = workbook.Sheets[sheetName];
        const csv = XLSX.utils.sheet_to_csv(sheet);
        if (csv.trim()) {
          allSheetsCsv += `\n--- ABA: ${sheetName} ---\n${csv}\n`;
        }
      });

      if (!allSheetsCsv.trim()) {
        res.status(400).json({ error: 'A planilha enviada está vazia ou ilegível.' });
        return;
      }

      const prompt = `Você é um orçamentista e perito em finanças da construção civil do empreendimento PRÉDIO EW.
Analise rigorosamente estes dados extraídos da planilha de custos/despesas da obra:
"${allSheetsCsv}"

Extraia os lançamentos de custos identificados (linhas de compras, serviços, materiais, mão de obra, taxas).
Para cada linha/item:
- supplier: fornecedor ou prestador
- item: nome do item ou serviço
- description: detalhamento, nota fiscal, especificação
- category: uma das categorias (Materiais de construção, Mão de obra, etc.)
- costType: materiais, mao_de_obra, fretes, servicos, equipamentos, outros
- quantity: quantidade numérica
- unit: unidade (un, m³, kg, etc.)
- unitPrice: preço unitário
- totalAmount: valor total
- date: data no formato AAAA-MM-DD (se não houver, use ${new Date().toISOString().slice(0, 10)})
- paymentMethod: pix, boleto, transferencia, cartao, dinheiro ou outro
- observations: observações, número de nota ou referência

Retorne a lista no esquema JSON solicitado.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: BATCH_COST_RESPONSE_SCHEMA,
        },
      });

      const parsedJson = JSON.parse(response.text || '{}');
      const items = Array.isArray(parsedJson.items) ? parsedJson.items : [];
      const singleData = items.length > 0 ? items[0] : null;

      res.json({
        success: true,
        isBatch: items.length > 1,
        items,
        data: singleData,
        summary: parsedJson.summary || `Planilha processada: ${items.length} lançamento(s) identificado(s).`,
      });
      return;
    }

    // 2. Caso PDF (DANFE, Fatura, Boleto com Comprovante, Recibo em PDF)
    if (isPdf) {
      const prompt = `Você é um perito contábil do empreendimento residencial PRÉDIO EW.
Analise com extrema precisão este DOCUMENTO PDF (nota fiscal eletrônica DANFE, boleto, fatura de materiais, recibo de mão de obra ou comprovante da obra).
Extraia os dados financeiros com total exatidão: fornecedor (Razão Social/Nome Fantasia), item/descrição, quantidade, unidade, valor unitário, valor total em Reais, data de emissão, vencimento (se houver), forma de pagamento e chave/número do documento.
Retorne no esquema JSON de custo.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  data: cleanBase64,
                  mimeType: 'application/pdf',
                },
              },
              { text: prompt },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: COST_RESPONSE_SCHEMA,
        },
      });

      const parsedJson = JSON.parse(response.text || '{}');
      res.json({ success: true, data: parsedJson });
      return;
    }

    // 3. Caso Imagem (Foto tirada pelo celular, cupom fiscal, JPG, PNG)
    const prompt = `Você é um perito contábil e orçamentista de obras civis do empreendimento PRÉDIO EW.
Analise com extrema precisão esta imagem (foto de nota fiscal, recibo, cupom fiscal, fatura ou comprovante de pagamento da obra).
Extraia os dados do lançamento financeiro preenchendo todos os campos solicitados conforme o esquema.
Se a data de emissão não estiver clara, use a data de hoje (${new Date().toISOString().slice(0, 10)}).
Se a quantidade ou valor unitário não estiver explícito mas o total estiver, use quantidade 1 e preço unitário igual ao total.
Certifique-se de preencher o valor total em reais com números exatos.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType: mimeType || 'image/jpeg',
              },
            },
            { text: prompt },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: COST_RESPONSE_SCHEMA,
      },
    });

    const parsedJson = JSON.parse(response.text || '{}');
    res.json({ success: true, data: parsedJson });
  } catch (error: any) {
    console.error('Erro ao analisar documento com Gemini:', error);
    res.status(500).json({
      error: 'Falha ao processar o documento com inteligência artificial.',
      details: error.message || String(error),
    });
  }
});

// POST /api/gemini/parse-cost-text
// Analisa texto livre com linguagem natural e converte em dados estruturados
app.post('/api/gemini/parse-cost-text', async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'Texto não fornecido.' });
      return;
    }

    const ai = getGeminiClient();

    const prompt = `Você é o assistente financeiro do empreendimento PRÉDIO EW.
O usuário digitou um relato em texto livre sobre um gasto ou custo da obra:
"${text}"

Analise a mensagem e extraia todos os dados estruturados de custo: fornecedor, item, categoria, tipo, quantidade, unidade, valor unitário, valor total, data (se não dita, use ${new Date().toISOString().slice(0, 10)}), forma de pagamento e observações.
Retorne rigorosamente no esquema JSON solicitado.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: COST_RESPONSE_SCHEMA,
      },
    });

    const parsedJson = JSON.parse(response.text || '{}');
    res.json({ success: true, data: parsedJson });
  } catch (error: any) {
    console.error('Erro ao interpretar texto de custo com Gemini:', error);
    res.status(500).json({
      error: 'Falha ao interpretar o texto com inteligência artificial.',
      details: error.message || String(error),
    });
  }
});

// Montagem do Vite dev server ou arquivos estáticos
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Prédio EW Server em execução na porta ${port}`);
  });
}

startServer().catch((err) => {
  console.error('Falha ao iniciar o servidor:', err);
});
