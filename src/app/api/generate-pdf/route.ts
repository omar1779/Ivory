import { NextResponse } from 'next/server';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import puppeteer from 'puppeteer';

export async function POST(request: Request) {
  try {
    const { markdown, title = 'Documento' } = await request.json();
    
    if (!markdown) {
      return NextResponse.json(
        { error: 'Se requiere el contenido markdown' },
        { status: 400 }
      );
    }

    // Configurar DOMPurify
    const { window } = new JSDOM('');
    const purify = DOMPurify(window);
    
    // Convertir markdown a HTML seguro
    const unsafeHtml = await marked(markdown);
    const cleanHtml = purify.sanitize(unsafeHtml, {
      ALLOWED_TAGS: ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'blockquote', 'code', 'pre', 'hr', 'br', 'img'],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'class']
    });

    // Crear documento HTML completo con estilos de Tailwind
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
  body {
    font-family: 'Inter', sans-serif;
    padding: 2rem 4rem;
    color: #1f2937;
    background: #fff;
  }
  .markdown-body {
    max-width: 65ch;
    margin: 0 auto;
  }
  .markdown-body h1 {
    font-size: 1.875rem;
    font-weight: 700;
    margin-top: 2rem;
    margin-bottom: 1rem;
  }
  .markdown-body h2 {
    font-size: 1.5rem;
    font-weight: 700;
    margin-top: 1.5rem;
    margin-bottom: 0.75rem;
  }
  .markdown-body h3 {
    font-size: 1.25rem;
    font-weight: 600;
    margin-top: 1.25rem;
    margin-bottom: 0.5rem;
  }
  .markdown-body p, .markdown-body ul, .markdown-body ol {
    margin-top: 1rem;
    margin-bottom: 1rem;
    line-height: 1.7;
  }
  .markdown-body ul, .markdown-body ol {
    padding-left: 1.5rem;
  }
  .markdown-body li {
    margin: 0.5rem 0;
  }
  .markdown-body a {
    color: #2563eb;
    text-decoration: underline;
  }
  .markdown-body a:hover {
    color: #1d4ed8;
  }
  .markdown-body pre {
    background: #f3f4f6;
    padding: 1rem;
    border-radius: 0.5rem;
    margin: 1rem 0;
    overflow-x: auto;
  }
  .markdown-body code {
    background: #f3f4f6;
    padding: 0.2rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.95em;
    font-family: 'Fira Mono', 'Consolas', 'Menlo', 'Monaco', monospace;
  }
  .markdown-body pre code {
    background: none;
    padding: 0;
  }
  .markdown-body blockquote {
    border-left: 4px solid #d1d5db;
    padding-left: 1rem;
    font-style: italic;
    color: #6b7280;
  }
</style>
        </head>
        <body class="bg-white">
          <div class="markdown-body">
            <h1>${title}</h1>
            ${cleanHtml}
          </div>
        </body>
      </html>
    `;

    // Configurar Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    // Generar PDF
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '1cm',
        right: '1cm',
        bottom: '1cm',
        left: '1cm',
      },
    });

    await browser.close();

    // Devolver el PDF
    return new NextResponse(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${title.replace(/\s+/g, '_').toLowerCase()}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error al generar el PDF:', error);
    return NextResponse.json(
      { error: 'Error al generar el PDF' },
      { status: 500 }
    );
  }
}
