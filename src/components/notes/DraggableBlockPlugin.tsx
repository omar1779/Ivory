"use client";

import { useCallback, useEffect, useState, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getNodeByKey,
  $isParagraphNode,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  ParagraphNode,
} from 'lexical';
import { mergeRegister } from '@lexical/utils';
import { MdDragIndicator } from 'react-icons/md';

// Crear comando personalizado para mover nodos
export const MOVE_BLOCK_COMMAND = createCommand('MOVE_BLOCK_COMMAND');

export default function DraggableBlockPlugin() {
  const [editor] = useLexicalComposerContext();
  const [activeBlock, setActiveBlock] = useState<string | null>(null);
  const [blockPositions, setBlockPositions] = useState<Map<string, DOMRect>>(new Map());
  const [isDragging, setIsDragging] = useState(false);
  const [draggedBlock, setDraggedBlock] = useState<string | null>(null);
  const [dragOverBlock, setDragOverBlock] = useState<string | null>(null);
  const [dragPosition, setDragPosition] = useState<'before' | 'after' | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Función para recalcular las posiciones de los bloques
  const recalculateBlockPositions = useCallback(() => {
    const paragraphs = document.querySelectorAll('p[data-lexical-node-key]');
    const positions = new Map<string, DOMRect>();
    
    paragraphs.forEach((paragraph) => {
      const key = paragraph.getAttribute('data-lexical-node-key');
      if (key) {
        positions.set(key, paragraph.getBoundingClientRect());
      }
    });
    
    setBlockPositions(positions);
  }, []);

  // Mostrar controles de arrastre al pasar el cursor sobre un párrafo
  const handleMouseOver = useCallback((event: MouseEvent) => {
    let element = event.target as HTMLElement;
    
    // Buscar el párrafo más cercano
    while (element && element.tagName !== 'P') {
      element = element.parentElement as HTMLElement;
      if (!element || element.classList.contains('editor-input')) break;
    }
    
    if (element && element.tagName === 'P' && !isDragging) {
      const key = element.getAttribute('data-lexical-node-key');
      if (key) {
        setActiveBlock(key);
      }
    }
  }, [isDragging]);

  // Ocultar controles al salir de un párrafo
  const handleMouseOut = useCallback(() => {
    if (!isDragging) {
      setActiveBlock(null);
    }
  }, [isDragging]);

  // Iniciar arrastre
  const handleDragStart = useCallback((event: React.DragEvent, nodeKey: string) => {
    setIsDragging(true);
    setDraggedBlock(nodeKey);
    
    // Hacer el elemento semi-transparente durante el arrastre
    event.dataTransfer.effectAllowed = 'move';
    
    // Crear una imagen de arrastre personalizada
    const dragImage = document.createElement('div');
    dragImage.textContent = '⋮⋮ Texto';
    dragImage.style.padding = '5px 10px';
    dragImage.style.background = '#1e293b';
    dragImage.style.color = '#e2e8f0';
    dragImage.style.borderRadius = '4px';
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    document.body.appendChild(dragImage);
    
    event.dataTransfer.setDragImage(dragImage, 0, 0);
    
    // Limpiar después
    setTimeout(() => {
      document.body.removeChild(dragImage);
    }, 0);
  }, []);

  // Manejar el arrastre sobre otros bloques
  const handleDragOver = useCallback((event: React.DragEvent, nodeKey: string) => {
    event.preventDefault();
    
    if (draggedBlock === nodeKey) {
      setDragOverBlock(null);
      return;
    }
    
    setDragOverBlock(nodeKey);
    
    // Determinar si está en la mitad superior o inferior del bloque
    const rect = blockPositions.get(nodeKey);
    if (rect) {
      const position = event.clientY < rect.top + rect.height / 2 ? 'before' : 'after';
      setDragPosition(position);
    }
  }, [draggedBlock, blockPositions]);

  // Finalizar el arrastre y reordenar los bloques
  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    
    if (draggedBlock && dragOverBlock && dragPosition) {
      editor.dispatchCommand(MOVE_BLOCK_COMMAND, { 
        sourceKey: draggedBlock, 
        targetKey: dragOverBlock, 
        position: dragPosition 
      });
    }
    
    setIsDragging(false);
    setDraggedBlock(null);
    setDragOverBlock(null);
    setDragPosition(null);
  }, [editor, draggedBlock, dragOverBlock, dragPosition]);

  // Cancelar el arrastre
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    setDraggedBlock(null);
    setDragOverBlock(null);
    setDragPosition(null);
  }, []);

  // Registrar listener para recalcular posiciones cuando cambia el editor
  useEffect(() => {
    return editor.registerUpdateListener(() => {
      recalculateBlockPositions();
    });
  }, [editor, recalculateBlockPositions]);

  // Registrar evento para comandos de movimiento de bloques
  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        MOVE_BLOCK_COMMAND,
        (payload: { sourceKey: string; targetKey: string; position: 'before' | 'after' }) => {
          const { sourceKey, targetKey, position } = payload;
          
          editor.update(() => {
            const sourceNode = $getNodeByKey(sourceKey);
            const targetNode = $getNodeByKey(targetKey);
            
            if (sourceNode && targetNode) {
              // Eliminamos el nodo de origen de su posición actual
              sourceNode.remove();
              
              // Lo insertamos antes o después del nodo objetivo
              if (position === 'before') {
                targetNode.insertBefore(sourceNode);
              } else {
                targetNode.insertAfter(sourceNode);
              }
            }
          });
          
          return true;
        },
        COMMAND_PRIORITY_EDITOR
      )
    );
  }, [editor]);

  // Agregar event listeners al editor
  useEffect(() => {
    const editorElement = document.querySelector('.editor-container');
    
    if (editorElement) {
      const mouseOverHandler = (e: Event) => handleMouseOver(e as unknown as MouseEvent);
      const mouseOutHandler = () => handleMouseOut();
      
      editorElement.addEventListener('mouseover', mouseOverHandler);
      editorElement.addEventListener('mouseout', mouseOutHandler);
      
      return () => {
        editorElement.removeEventListener('mouseover', mouseOverHandler);
        editorElement.removeEventListener('mouseout', mouseOutHandler);
      };
    }
  }, [handleMouseOver, handleMouseOut]);

  // Recalcular posiciones iniciales
  useEffect(() => {
    // Esperar un momento para que el DOM esté listo
    const timer = setTimeout(() => {
      recalculateBlockPositions();

    }, 500);
    
    // También recalcular cuando cambia el tamaño de la ventana
    window.addEventListener('resize', recalculateBlockPositions);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', recalculateBlockPositions);
    };
  }, [recalculateBlockPositions]);
  
  // Recalcular posiciones cuando el editor cambia
  useEffect(() => {
    const observer = new MutationObserver(recalculateBlockPositions);
    const editorElement = document.querySelector('.editor-container');
    
    if (editorElement) {
      observer.observe(editorElement, { childList: true, subtree: true });
    }
    
    return () => observer.disconnect();
  }, [recalculateBlockPositions]);

  // Agregar atributos data-key a los párrafos para poder identificarlos
  useEffect(() => {
    return editor.registerMutationListener(
      ParagraphNode,
      (mutations: Map<string, 'created' | 'destroyed' | 'updated'>) => {
      for (const [nodeKey, mutation] of mutations) {
        if (mutation === 'created') {
          editor.update(() => {
            const node = $getNodeByKey(nodeKey);
            if (node && $isParagraphNode(node)) {
              setTimeout(() => {
                recalculateBlockPositions();
              }, 0);
            }
          });
        }
      }
    });
  }, [editor, recalculateBlockPositions]);

  return (
    <div ref={containerRef}>
      {activeBlock && !isDragging && blockPositions.has(activeBlock) && (
        <div
          className="block-drag-handle"
          style={{
            position: 'absolute',
            left: '2px',
            top: `${(blockPositions.get(activeBlock)?.top || 0) - 
              (containerRef.current?.getBoundingClientRect().top || 0) + 5}px`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '3px',
            cursor: 'grab',
            color: '#94a3b8',
            zIndex: 200,
            background: '#1e293b',
            borderRadius: '4px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            border: '1px solid #334155',
            opacity: 0.9,
          }}
          onMouseEnter={() => setActiveBlock(activeBlock)}
          draggable
          onDragStart={(e) => handleDragStart(e, activeBlock)}
        >
          <MdDragIndicator size={18} color="#60a5fa" />
        </div>
      )}
      
      {isDragging && dragOverBlock && dragPosition && (
        <div
          className="drop-indicator"
          style={{
            position: 'absolute',
            left: '0',
            right: '0',
            height: '3px',
            background: '#3b82f6',
            top: dragPosition === 'before' 
              ? `${(blockPositions.get(dragOverBlock)?.top || 0) - 
                (containerRef.current?.getBoundingClientRect().top || 0) - 1}px`
              : `${(blockPositions.get(dragOverBlock)?.bottom || 0) - 
                (containerRef.current?.getBoundingClientRect().top || 0) - 1}px`,
            zIndex: 10,
          }}
        />
      )}
      
      {Array.from(blockPositions.keys()).map((key) => (
        <div
          key={key}
          className={`block-drag-area ${draggedBlock === key ? 'dragging' : ''} ${dragOverBlock === key ? 'drag-over' : ''}`}
          style={{
            position: 'absolute',
            left: '0',
            right: '0',
            top: `${(blockPositions.get(key)?.top || 0) - 
              (containerRef.current?.getBoundingClientRect().top || 0)}px`,
            height: `${blockPositions.get(key)?.height || 0}px`,
            pointerEvents: isDragging ? 'all' : 'none',
          }}
          onDragOver={(e) => handleDragOver(e, key)}
          onDrop={handleDrop}
          onDragEnd={handleDragEnd}
        />
      ))}
    </div>
  );
}
