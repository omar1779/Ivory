import React, { useCallback } from 'react';
import { Button } from '../ui/button';
import { Download } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

interface ExportToPDFProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  content: string;
  title?: string;
  buttonText?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const ExportToPDF: React.FC<ExportToPDFProps> = ({ 
  content, 
  title = 'Nota', 
  buttonText,
  variant = 'outline',
  size = 'icon',
  ...props 
}) => {
  // Function to clean CSS content by removing unsupported functions
  const cleanCSS = useCallback((css: string): string => {
    if (!css) return '';
    
    // Remove @supports blocks that might contain modern CSS
    let cleaned = css.replace(/@supports[^{]*\{[^}]*\}/g, '');
    
    // Remove modern color functions and replace with fallbacks
    const colorReplacements = [
      { regex: /oklch\([^)]+\)/g, replacement: 'rgb(128, 128, 128)' },
      { regex: /color\([^)]+\)/g, replacement: 'rgb(128, 128, 128)' },
      { regex: /lab\([^)]+\)/g, replacement: 'rgb(128, 128, 128)' },
      { regex: /lch\([^)]+\)/g, replacement: 'rgb(128, 128, 128)' },
      { regex: /hwb\([^)]+\)/g, replacement: 'hsl(0, 0%, 50%)' },
    ];
    
    colorReplacements.forEach(({ regex, replacement }) => {
      cleaned = cleaned.replace(regex, replacement);
    });
    
    return cleaned;
  }, []);

  const cleanElementStyles = useCallback((el: HTMLElement) => {
    if (!el || !el.style) return;
    
    // Remove any problematic style properties
    const style = el.style;
    const styleProps = [
      'background', 'background-color', 'color', 'border', 'border-color',
      'box-shadow', 'text-shadow', 'outline', 'outline-color'
    ];
    
    styleProps.forEach(prop => {
      try {
        const value = style.getPropertyValue(prop);
        if (value && /oklch\(|color\(|lab\(|lch\(|hwb\(/i.test(value)) {
          style.setProperty(prop, '', 'important');
        }
      } catch (e) {
        // Ignore errors for unsupported properties
      }
    });
    
    // Process child elements
    Array.from(el.children).forEach(child => cleanElementStyles(child as HTMLElement));
  }, []);

  const handleExport = useCallback(async () => {
    // Create a temporary container for the markdown content
    const element = document.createElement('div');
    
    try {
      // Convert markdown to HTML
      const markdownContent = content || 'No content';
      const htmlContent = await Promise.resolve(marked.parse(markdownContent));
      
      // Clean HTML
      let cleanHtml = DOMPurify.sanitize(htmlContent);
      element.style.position = 'absolute';
      element.style.left = '-9999px';
      element.style.width = '800px';
      element.style.padding = '40px';
      element.style.fontFamily = 'Arial, sans-serif';
      element.style.lineHeight = '1.6';
      element.style.color = '#333';
      element.style.backgroundColor = 'white';
      element.style.borderRadius = '8px';
      element.style.boxShadow = '0 0 10px rgba(0,0,0,0.1)';
      
      // Add a meta tag to ensure proper rendering
      const meta = document.createElement('meta');
      meta.setAttribute('http-equiv', 'Content-Security-Policy');
      meta.setAttribute('content', 'upgrade-insecure-requests');
      
      // Add title
      const titleElement = document.createElement('h1');
      titleElement.textContent = title;
      titleElement.style.marginBottom = '20px';
      titleElement.style.paddingBottom = '10px';
      titleElement.style.borderBottom = '2px solid #eee';
      element.appendChild(titleElement);

      // Add content
      const contentElement = document.createElement('div');
      contentElement.innerHTML = cleanHtml;
      contentElement.style.marginTop = '20px';
      element.appendChild(contentElement);

      // Add styles for markdown elements with cleaned CSS
      const style = document.createElement('style');
      const cssContent = `
        h1 { font-size: 24px; margin: 20px 0; }
        h2 { font-size: 20px; margin: 18px 0; }
        h3 { font-size: 18px; margin: 16px 0; }
        p { margin: 10px 0; }
        ul, ol { margin: 10px 0; padding-left: 30px; }
        li { margin: 5px 0; }
        pre { 
          background-color: #f5f5f5; 
          padding: 15px; 
          border-radius: 4px; 
          overflow-x: auto; 
          margin: 10px 0;
          font-size: 14px;
        }
        code { 
          font-family: 'Courier New', monospace; 
          background-color: #f5f5f5; 
          padding: 2px 4px; 
          border-radius: 3px; 
          font-size: 14px;
        }
        code[class*="language-"], pre[class*="language-"] {
          font-size: 14px;
          line-height: 1.5;
        }
        blockquote { 
          border-left: 4px solid #ddd; 
          padding: 0 15px; 
          color: #666; 
          margin: 15px 0; 
          font-style: italic;
        }
        table {
          border-collapse: collapse;
          width: 100%;
          margin: 15px 0;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px 12px;
          text-align: left;
        }
        th {
          background-color: #f5f5f5;
        }
        img {
          max-width: 100%;
          height: auto;
        }`;
      
      // Clean the CSS content and add to style element
      style.textContent = cleanCSS(cssContent);
      element.appendChild(style);

      document.body.appendChild(element);

      // Clean styles before rendering
      cleanElementStyles(element);
      
      // Convert to canvas then to image with minimal configuration
      const canvas = await html2canvas(element, {
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: true,
        ignoreElements: (el) => {
          // Skip elements that might cause issues
          if (el.tagName === 'IFRAME' || el.tagName === 'VIDEO' || el.tagName === 'AUDIO') {
            return true;
          }
          return false;
        }
      });

      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdfWidth = 210; // A4 width in mm
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Add the image with proper scaling
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      
      // Clean up
      document.body.removeChild(element);
      
      // Save the PDF with a clean filename
      const cleanTitle = (title || 'nota')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      pdf.save(`${cleanTitle}.pdf`);
    } catch (error) {
      console.error('Error al exportar a PDF:', error);
      // Optionally show an error message to the user
      alert('No se pudo exportar el PDF. Por favor, inténtalo de nuevo.');
    } finally {
      // Ensure we clean up the temporary element
      if (element && element.parentNode) {
        document.body.removeChild(element);
      }
    }
  }, [content, title, cleanCSS]);

  return (
    <Button
      onClick={handleExport}
      variant={"outline"}
      size={"sm"}
      title="Exportar a PDF"
      className={`flex items-center justify-center ${props.className || ''}`}
      {...props}
    >
      <Download className="h-4 w-4" />
      {buttonText && buttonText.length > 0 && (
        <span className="ml-2">{buttonText}</span>
      )}
    </Button>
  );
};

export default ExportToPDF;