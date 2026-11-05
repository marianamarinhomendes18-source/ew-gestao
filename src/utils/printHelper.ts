/**
 * Utilitário profissional de impressão e geração de PDF para o PRÉDIO EW.
 * 
 * Resolve definitivamente problemas de corte de informações e botões
 * de impressão inoperantes em ambientes de iframe e navegadores mobile/desktop.
 */

interface PrintOptions {
  title?: string;
  landscape?: boolean;
}

export function printElement(
  target: string | HTMLElement,
  options: PrintOptions = {}
): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const element = typeof target === 'string' ? document.getElementById(target) : target;
      if (!element) {
        console.warn(`[printElement] Elemento não encontrado: ${target}. Acionando impressão padrão.`);
        try {
          window.focus();
          window.print();
        } catch {
          // sandbox restriction
        }
        resolve(true);
        return;
      }

      const docTitle = options.title || 'PREDIO_EW_DOCUMENTO';
      const isLandscape = !!options.landscape;

      // 1. Remove qualquer iframe de impressão anterior
      const oldIframe = document.getElementById('ew-print-iframe');
      if (oldIframe) {
        oldIframe.remove();
      }

      // 2. Cria um iframe invisível isolado para impressão
      const iframe = document.createElement('iframe');
      iframe.id = 'ew-print-iframe';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.visibility = 'hidden';
      iframe.setAttribute('aria-hidden', 'true');
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentWindow?.document;
      if (!iframeDoc || !iframe.contentWindow) {
        // Fallback para window.print tradicional caso iframes sejam bloqueados
        try {
          window.focus();
          window.print();
        } catch {
          // sandbox restriction
        }
        resolve(true);
        return;
      }

      // 3. Clona todas as folhas de estilo da página atual (Tailwind, fontes, etc)
      let stylesHtml = '';
      const styleNodes = document.querySelectorAll('style, link[rel="stylesheet"]');
      styleNodes.forEach((node) => {
        stylesHtml += node.outerHTML;
      });

      // 4. Monta o documento com regras de impressão que EVITAM cortes de página
      const pageOrientation = isLandscape ? 'landscape' : 'portrait';
      const printStyles = `
        <style>
          @page {
            size: A4 ${pageOrientation};
            margin: 10mm 10mm 12mm 10mm;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            box-sizing: border-box !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #0f172a !important;
            font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
            height: auto !important;
            min-height: 100% !important;
            overflow: visible !important;
            position: static !important;
          }
          .no-print, [data-no-print="true"] {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          /* Evita cortes no meio de tabelas, linhas e cards */
          table {
            border-collapse: collapse !important;
            width: 100% !important;
          }
          tr, td, th {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .print-card, .break-inside-avoid, .page-break-inside-avoid {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          /* Garante que containers com scroll/max-height se expandam totalmente */
          div, section, main {
            max-height: none !important;
            overflow: visible !important;
            position: static !important;
          }
        </style>
      `;

      // 5. Escreve no iframe
      iframeDoc.open();
      iframeDoc.write(`
        <!DOCTYPE html>
        <html lang="pt-BR">
          <head>
            <meta charset="utf-8" />
            <title>${docTitle}</title>
            ${stylesHtml}
            ${printStyles}
          </head>
          <body>
            ${element.outerHTML}
          </body>
        </html>
      `);
      iframeDoc.close();

      // 6. Aguarda carregar e executa a impressão
      const trigger = () => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          resolve(true);
        } catch (err) {
          console.warn('[printElement] Falha ao acionar iframe print (sandbox ativo):', err);
          try {
            window.focus();
            window.print();
          } catch (e2) {
            console.warn('[printElement] window.print também restrito pelo navegador no sandbox.');
          }
          resolve(true);
        }
      };

      // Pequeno timeout para garantir renderização de fontes e imagens
      setTimeout(trigger, 350);
    } catch (err) {
      console.warn('[printElement] Exceção na impressão:', err);
      try {
        window.focus();
        window.print();
      } catch (e2) {
        // sandbox restriction
      }
      resolve(true);
    }
  });
}

/**
 * Salva o conteúdo formatado como arquivo HTML independente que o usuário
 * pode abrir em qualquer navegador para imprimir ou converter em PDF.
 */
export function downloadFormattedHtml(
  filename: string,
  title: string,
  contentHtml: string
) {
  let stylesHtml = '';
  const styleNodes = document.querySelectorAll('style, link[rel="stylesheet"]');
  styleNodes.forEach((node) => {
    stylesHtml += node.outerHTML;
  });

  const fullHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  ${stylesHtml}
  <style>
    @page { size: A4 portrait; margin: 10mm; }
    body { background: #fff; padding: 20px; font-family: sans-serif; }
    .no-print { display: none !important; }
    tr, .print-card { break-inside: avoid !important; page-break-inside: avoid !important; }
  </style>
</head>
<body>
  ${contentHtml}
</body>
</html>`;

  const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.html') ? filename : `${filename}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
