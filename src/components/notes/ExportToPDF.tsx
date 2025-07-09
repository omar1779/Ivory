import React, { useCallback } from 'react';
import { Button } from '../ui/button';
import { Download } from 'lucide-react';
import { jsPDF } from 'jspdf';

// Configuración de marked para parseo seguro de markdown
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { Note } from '@/lib/types/note';

// Función para convertir HTML a texto plano con formato mejorado
const htmlToPlainText = (html: string): string => {
  // Crear un elemento temporal para parsear el HTML
  const temp = document.createElement('div');
  
  // Usar DOMPurify para limpiar el HTML
  temp.innerHTML = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li'],
    KEEP_CONTENT: true
  });

  // Función para recorrer el DOM y extraer el texto con formato
  const getText = (node: ChildNode, output: string[] = []) => {
    // Si es un nodo de texto, agregar su contenido
    if (node.nodeType === Node.TEXT_NODE) {
      output.push(node.textContent || '');
    } 
    // Si es un elemento, procesar sus hijos
    else if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      const tagName = element.tagName.toLowerCase();
      
      // Agregar saltos de línea antes de ciertos elementos
      if (['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'br'].includes(tagName)) {
        output.push('\n');
      }
      
      // Procesar hijos
      for (let i = 0; i < node.childNodes.length; i++) {
        getText(node.childNodes[i], output);
      }
      
      // Agregar saltos de línea después de ciertos elementos
      if (['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li'].includes(tagName)) {
        output.push('\n');
      }
    }
    
    return output;
  };

  // Obtener el texto con formato
  let result = getText(temp).join('');
  
  // Limpiar múltiples saltos de línea
  result = result.replace(/\n{3,}/g, '\n\n');
  
  // Mantener los emojis y caracteres especiales
  result = result
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();

  return result;
};

interface ExportToPDFProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  note: Note;
  buttonText?: string
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

const ExportToPDF: React.FC<ExportToPDFProps> = ({ 
  note,
  buttonText,
  variant = 'outline',
  size = 'icon',
  ...props 
}) => {
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Función para inicializar el documento PDF
  const initializePdf = () => {
    // Crear un nuevo documento PDF
    const pdfDoc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
      putOnlyUsedFonts: true,
      hotfixes: ['px_scaling']
    });
    
    // Usar una fuente que soporte mejor los caracteres Unicode
    pdfDoc.setFont('helvetica');
    pdfDoc.setFontSize(12);
    
    return pdfDoc;
  };

  const handleExport = useCallback(async () => {
    // Mostrar indicador de carga
    const button = document.activeElement as HTMLElement;
    const originalText = button?.textContent;
    
    if (button) {
      button.textContent = 'Generando PDF...';
      button.setAttribute('disabled', 'true');
    }
    
    try {
      // Usar setTimeout para liberar el hilo principal
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Inicializar el documento PDF
      const doc = initializePdf();
      
      // Configuración de la página
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      let yPosition = 20;
      const maxWidth = pageWidth - (margin * 2);
      
      // Función para agregar texto con manejo de saltos de página y estilos
      const addText = (text: string, fontSize: number, isBold = false, isTitle = false) => {
        if (!text) return;
        
        try {
          // Configurar la fuente y estilo
          const font = isBold ? 'helvetica-bold' : 'helvetica';
          doc.setFont(font);
          doc.setFontSize(fontSize);
          
          // Limpiar y normalizar el texto
          const cleanText = String(text)
            .normalize('NFC')
            .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Caracteres de control
            .replace(/[\u00A0\u1680\u2000-\u200F\u2028-\u202F\u205F\u2060\u3000\uFEFF]/g, ' ') // Espacios no estándar
            .replace(/[\u2018\u2019]/g, "'") // Comillas simples
            .replace(/[\u201C\u201D]/g, '"') // Comillas dobles
            .replace(/\s+/g, ' ') // Múltiples espacios
            .trim();
          
          // Dividir el texto en líneas que quepan en el ancho de la página
          const splitText = doc.splitTextToSize(cleanText, maxWidth);
          
          // Agregar cada línea al PDF
          for (const line of splitText) {
            if (yPosition > doc.internal.pageSize.getHeight() - margin - 10) {
              doc.addPage();
              yPosition = margin;
            }
            
            // Agregar la línea al PDF
            doc.text(line, margin, yPosition);
            
            // Ajustar la posición Y para la siguiente línea
            yPosition += isTitle ? 10 : 6 * (fontSize / 10);
          }
          
          // Espacio después del párrafo
          yPosition += isTitle ? 8 : 4;
          
        } catch (error) {
          console.error('Error al agregar texto:', error);
        }
      };

      // Agregar encabezado con título
      doc.setFontSize(20);
      doc.setTextColor(40, 62, 80); // Color azul oscuro
      addText(note.title || 'Nota sin título', 20, true, true);
      
      // Agregar metadatos
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100); // Gris oscuro
      addText(`Creada: ${formatDate(note.createdAt)}`, 10);
      addText(`Actualizada: ${formatDate(note.updatedAt)}`, 10);
      
      if (note.folder) {
        addText(`Carpeta: ${note.folder}`, 10);
      }
      
      if (note.tags?.length) {
        addText(`Etiquetas: ${note.tags.join(', ')}`, 10);
      }
      
      // Línea separadora
      yPosition += 5;
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 15;

      // Procesar el contenido de la nota
      try {
        const content = note.content || 'Sin contenido';
        
        // Convertir markdown a HTML y luego a texto plano
        // Usar marked.parse con opciones para mantener caracteres especiales
        const html = await marked.parse(content, {
          gfm: true,
          breaks: true
        });
        
        // Limpiar y normalizar el texto
        const plainText = htmlToPlainText(html)
          .normalize('NFC') // Normalizar caracteres Unicode
          .replace(/[\u00A0\u1680\u2000-\u200F\u2028-\u202F\u205F\u2060\u3000\uFEFF]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        // Dividir en párrafos y procesar cada uno
        const paragraphs = plainText.split(/\n{2,}/);
        doc.setFontSize(12);
        doc.setTextColor(30, 30, 30); // Color de texto principal
        
        for (let i = 0; i < paragraphs.length; i++) {
          const paragraph = paragraphs[i].trim();
          if (!paragraph) continue;
          
          // Procesar en bloques pequeños para mantener la interfaz receptiva
          if (i % 5 === 0) {
            await new Promise(resolve => setTimeout(resolve, 0));
          }
          
          // Identificar títulos (líneas que terminan en dos puntos o tienen formato de encabezado)
          if (paragraph.endsWith(':') || paragraph === paragraph.toUpperCase()) {
            addText(paragraph, 14, true);
          } else {
            addText(paragraph, 12);
          }
        }
      } catch (error) {
        console.error('Error procesando contenido:', error);
        addText('Error al procesar el contenido de la nota.', 12);
      }
      
      // Generar nombre de archivo seguro
      const safeTitle = (note.title || 'nota')
        .normalize('NFD')
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 30)
        .toLowerCase();
      
      // Guardar el PDF
      try {
        doc.save(`${safeTitle}.pdf`);
      } catch (error) {
        console.error('Error al guardar PDF:', error);
        // Método alternativo de guardado
        const blob = doc.output('blob');
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${safeTitle}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error al generar el PDF. Por favor, inténtalo de nuevo.');
    } finally {
      // Restaurar el estado del botón
      if (button) {
        button.textContent = originalText;
        button.removeAttribute('disabled');
      }
    }
  }, [note]);

  return (
    <Button 
      variant={variant}
      size={size}
      onClick={handleExport}
      title="Exportar a PDF"
      aria-label="Exportar a PDF"
      {...props}
    >
      {buttonText ? (
        <span className="flex items-center">
          <Download className="mr-2 h-4 w-4" />
          {buttonText}
        </span>
      ) : (
        <Download className="h-4 w-4" />
      )}
    </Button>
  );
};

export default ExportToPDF;