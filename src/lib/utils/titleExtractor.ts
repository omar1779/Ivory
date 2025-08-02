/**
 * Extrae automáticamente el título de una nota desde su contenido HTML
 * Prioridad: H1 > H2 > H3 > Primera línea de texto > "Sin título"
 */
export function extractTitleFromContent(htmlContent: string): string {
  if (!htmlContent || htmlContent.trim() === '') {
    return 'Sin título';
  }

  try {
    // Crear un parser DOM para analizar el HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    
    // 1. Buscar primer H1
    const h1 = doc.querySelector('h1');
    if (h1 && h1.textContent?.trim()) {
      return h1.textContent.trim();
    }
    
    // 2. Buscar primer H2
    const h2 = doc.querySelector('h2');
    if (h2 && h2.textContent?.trim()) {
      return h2.textContent.trim();
    }
    
    // 3. Buscar primer H3
    const h3 = doc.querySelector('h3');
    if (h3 && h3.textContent?.trim()) {
      return h3.textContent.trim();
    }
    
    // 4. Buscar primer párrafo con contenido
    const paragraphs = doc.querySelectorAll('p');
    for (const p of paragraphs) {
      const text = p.textContent?.trim();
      if (text && text.length > 0) {
        // Limitar a 50 caracteres para el título
        return text.length > 50 ? text.substring(0, 50) + '...' : text;
      }
    }
    
    // 5. Buscar cualquier texto en el body
    const bodyText = doc.body?.textContent?.trim();
    if (bodyText && bodyText.length > 0) {
      // Tomar solo la primera línea y limitar a 50 caracteres
      const firstLine = bodyText.split('\n')[0].trim();
      return firstLine.length > 50 ? firstLine.substring(0, 50) + '...' : firstLine;
    }
    
    return 'Sin título';
  } catch (error) {
    console.error('Error extrayendo título del contenido:', error);
    return 'Sin título';
  }
}

/**
 * Limpia el título removiendo caracteres especiales y limitando longitud
 */
export function cleanTitle(title: string): string {
  return title
    .replace(/[<>:"/\\|?*]/g, '') // Remover caracteres no válidos para nombres de archivo
    .replace(/\s+/g, ' ') // Normalizar espacios
    .trim()
    .substring(0, 100); // Limitar longitud
}
