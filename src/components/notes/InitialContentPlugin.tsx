"use client";

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $generateNodesFromDOM } from '@lexical/html';
import { $getRoot, $createParagraphNode, $isElementNode } from 'lexical';
import { useEffect, useRef } from 'react';

interface InitialContentPluginProps {
  initialContent: string;
  noteId?: string;
}

export default function InitialContentPlugin({ initialContent, noteId }: InitialContentPluginProps) {
  const [editor] = useLexicalComposerContext();
  const lastNoteIdRef = useRef<string | undefined>(undefined);
  const lastContentRef = useRef<string>('');
  const isUserTypingRef = useRef(false);

  // Detectar si el usuario está escribiendo
  useEffect(() => {
    const unregister = editor.registerUpdateListener(({ dirtyElements, dirtyLeaves }) => {
      // Si hay elementos o hojas sucias, el usuario probablemente está escribiendo
      isUserTypingRef.current = dirtyElements.size > 0 || dirtyLeaves.size > 0;
    });
    
    return unregister;
  }, [editor]);

  useEffect(() => {
    const noteChanged = noteId !== lastNoteIdRef.current;
    const contentChanged = initialContent !== lastContentRef.current;
    
    // Solo cargar contenido si:
    // 1. Cambió la nota (noteId diferente)
    // 2. O si cambió el contenido inicial Y el usuario NO está escribiendo
    const shouldLoad = noteChanged || (contentChanged && !isUserTypingRef.current);
    
    if (shouldLoad) {

      
      // Usar un timeout muy corto para permitir que se complete el render
      const timeoutId = setTimeout(() => {
        editor.update(() => {
          try {
            const root = $getRoot();
            root.clear();
            
            if (initialContent && initialContent.trim() !== '') {
              try {
                // Intentar parsear con $generateNodesFromDOM
                const parser = new DOMParser();
                const dom = parser.parseFromString(`<div>${initialContent}</div>`, 'text/html');
                const nodes = $generateNodesFromDOM(editor, dom);
                
                // Filtrar y agregar solo nodos válidos
                const validNodes = nodes.filter(node => $isElementNode(node));
                
                if (validNodes.length > 0) {
                  root.append(...validNodes);
                } else {
                  // Fallback: crear párrafo simple
                  const paragraph = $createParagraphNode();
                  root.append(paragraph);
                }
              } catch (parseError) {
                console.warn('Error parsing HTML, using fallback:', parseError);
                // Fallback: crear párrafo simple
                const paragraph = $createParagraphNode();
                root.append(paragraph);
              }
            } else {
              // Contenido vacío
              const paragraph = $createParagraphNode();
              root.append(paragraph);
            }
            
            // Actualizar referencias
            lastNoteIdRef.current = noteId;
            lastContentRef.current = initialContent;
            
            // Reset del flag de escritura después de cargar
            setTimeout(() => {
              isUserTypingRef.current = false;
            }, 100);
          } catch (e) {
            console.error('Error cargando contenido:', e);
            const root = $getRoot();
            root.clear();
            const paragraph = $createParagraphNode();
            root.append(paragraph);
          }
        });
      }, 10);
      
      return () => clearTimeout(timeoutId);
    }
  }, [editor, noteId, initialContent]);

  return null;
}
