"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  SELECTION_CHANGE_COMMAND,
  FORMAT_TEXT_COMMAND,
} from "lexical";
import { Bold, Italic, Underline, Code, Link, MessageSquare } from "lucide-react";

export default function FloatingToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isCode, setIsCode] = useState(false);
  const [selectionRect, setSelectionRect] = useState<DOMRect | null>(null);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    
    if ($isRangeSelection(selection)) {
      const anchorNode = selection.anchor.getNode();
      const focusNode = selection.focus.getNode();
      const domSelection = window.getSelection();

      if (domSelection && !selection.isCollapsed()) {
        // Solo mostrar la barra si hay texto seleccionado
        const domRange = domSelection.getRangeAt(0);
        const rect = domRange.getBoundingClientRect();
        
        setSelectionRect(rect);
        setIsVisible(true);

        // Actualizar el estado de los formatos
        setIsBold(selection.hasFormat("bold"));
        setIsItalic(selection.hasFormat("italic"));
        setIsUnderline(selection.hasFormat("underline"));
        setIsCode(selection.hasFormat("code"));
      } else {
        setIsVisible(false);
      }
    } else {
      setIsVisible(false);
    }
  }, []);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        updateToolbar();
      });
    });
  }, [editor, updateToolbar]);

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        updateToolbar();
        return false;
      },
      1 // Prioridad baja
    );
  }, [editor, updateToolbar]);

  // Posiciona la barra flotante
  useEffect(() => {
    const toolbar = toolbarRef.current;
    if (toolbar && selectionRect) {
      const editorRect = document.querySelector(".editor-container")?.getBoundingClientRect();
      if (!editorRect) return;
      
      // Posiciona la barra encima de la selección
      const top = selectionRect.top - editorRect.top - toolbar.offsetHeight - 10;
      const left = selectionRect.left - editorRect.left + (selectionRect.width / 2) - (toolbar.offsetWidth / 2);
      
      // Asegúrate de que la barra no se salga del editor
      const boundedLeft = Math.max(10, Math.min(left, editorRect.width - toolbar.offsetWidth - 10));
      
      toolbar.style.top = `${Math.max(10, top)}px`;
      toolbar.style.left = `${boundedLeft}px`;
    }
  }, [selectionRect, isVisible]);

  if (!isVisible) {
    return null;
  }

  return (
    <div 
      ref={toolbarRef} 
      className="floating-toolbar"
    >
      <button
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
        className={`toolbar-item ${isBold ? "active" : ""}`}
        aria-label="Formato Negrita"
      >
        <Bold size={16} />
      </button>
      <button
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}
        className={`toolbar-item ${isItalic ? "active" : ""}`}
        aria-label="Formato Cursiva"
      >
        <Italic size={16} />
      </button>
      <button
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")}
        className={`toolbar-item ${isUnderline ? "active" : ""}`}
        aria-label="Formato Subrayado"
      >
        <Underline size={16} />
      </button>
      <button
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code")}
        className={`toolbar-item ${isCode ? "active" : ""}`}
        aria-label="Formato Código"
      >
        <Code size={16} />
      </button>
      <div className="divider"></div>
      <button
        onClick={() => {
          // Aquí iría la lógica para añadir un enlace
          alert("Función de enlace próximamente");
        }}
        className="toolbar-item"
        aria-label="Añadir Enlace"
      >
        <Link size={16} />
      </button>
      <button
        onClick={() => {
          // Llamamos a la función global expuesta por CommentPlugin
          if ((window as any).lexicalAddComment) {
            (window as any).lexicalAddComment();
          }
        }}
        className="toolbar-item"
        aria-label="Añadir Comentario"
      >
        <MessageSquare size={16} />
      </button>
    </div>
  );
}
