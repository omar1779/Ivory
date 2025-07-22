import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Download } from 'lucide-react';
import { Note } from '@/lib/types/note';

// Función para generar el PDF usando la API
const generatePDF = async (markdown: string, title: string) => {
  try {
    const response = await fetch('/api/generate-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        markdown,
        title: title || 'Documento sin título',
      }),
    });

    if (!response.ok) {
      throw new Error('Error al generar el PDF');
    }

    // Crear un blob a partir de la respuesta
    const blob = await response.blob();
    
    // Crear un enlace para descargar el archivo
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'documento'}.pdf`;
    document.body.appendChild(a);
    a.click();
    
    // Limpiar
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    return true;
  } catch (error) {
    console.error('Error al generar el PDF:', error);
    throw error;
  }
};

interface ExportToPDFProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  note: Note;
  buttonText?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

const ExportToPDF: React.FC<ExportToPDFProps> = ({ 
  note,
  buttonText,
  variant = 'outline',
  size = 'icon',
  ...props 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleExport = async () => {
    if (!note) return;
    
    try {
      setIsLoading(true);
      await generatePDF(note.content, note.title);
  
    } catch (error) {
      console.error('Error al generar el PDF:', error);
  
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleExport}
      disabled={!note || isLoading}
      {...props}
    >
      <Download className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
      {isLoading ? 'Generando...' : (buttonText || 'Exportar a PDF')}
    </Button>
  );
};

export default ExportToPDF;