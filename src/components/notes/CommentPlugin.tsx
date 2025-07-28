"use client";

import { useCallback, useEffect, useState, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { 
  $getSelection, 
  $isRangeSelection,
  SELECTION_CHANGE_COMMAND,
  TextNode,
  $createTextNode,
  $isTextNode
} from 'lexical';
import { mergeRegister } from '@lexical/utils';
import { MessageSquare, X, ChevronUp, ChevronDown, Eye, EyeOff } from 'lucide-react';

interface Comment {
  id: string;
  text: string;
  selectionText: string;
  startOffset: number;
  endOffset: number;
}

export default function CommentPlugin() {
  const [editor] = useLexicalComposerContext();
  const [comments, setComments] = useState<Comment[]>([]);
  const [activeComment, setActiveComment] = useState<Comment | null>(null);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [currentSelection, setCurrentSelection] = useState<{
    text: string;
    startOffset: number;
    endOffset: number;
  } | null>(null);
  const [isCommentsVisible, setIsCommentsVisible] = useState(true);
  const commentModalRef = useRef<HTMLDivElement>(null);

  const updateSelectionState = useCallback(() => {
    const selection = $getSelection();
    
    if ($isRangeSelection(selection) && !selection.isCollapsed()) {
      // Hay texto seleccionado
      const selectionText = selection.getTextContent();
      const anchor = selection.anchor;
      const focus = selection.focus;
      
      // Calculamos la posición absoluta en el documento
      setCurrentSelection({
        text: selectionText,
        startOffset: Math.min(anchor.offset, focus.offset),
        endOffset: Math.max(anchor.offset, focus.offset)
      });
    } else {
      setCurrentSelection(null);
    }
  }, []);

  // Registrar listeners para cambios en la selección
  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateSelectionState();
          return false;
        },
        1
      )
    );
  }, [editor, updateSelectionState]);

  // Maneja el clic en el botón de comentario en la barra flotante
  const handleCommentButtonClick = useCallback(() => {
    if (currentSelection) {
      const commentPosition = getCommentPosition();
      if (commentPosition) {
        const { x, y } = commentPosition;
        const commentModal = commentModalRef.current;
        if (commentModal) {
          commentModal.style.top = `${y}px`;
          commentModal.style.left = `${x}px`;
        }
        setIsCommentModalOpen(true);
      }
    }
  }, [currentSelection]);

  const getCommentPosition = () => {
    // Obtener la posición para mostrar el modal de comentario
    // Basado en la posición actual de la selección
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      const editorElement = document.querySelector('.editor-container');
      if (editorElement) {
        const editorRect = editorElement.getBoundingClientRect();
        
        return {
          x: rect.right - editorRect.left,
          y: rect.top - editorRect.top
        };
      }
    }
    return null;
  };

  const saveComment = () => {
    if (currentSelection && commentText.trim()) {
      const newComment: Comment = {
        id: Date.now().toString(),
        text: commentText,
        selectionText: currentSelection.text,
        startOffset: currentSelection.startOffset,
        endOffset: currentSelection.endOffset
      };
      
      setComments(prevComments => [...prevComments, newComment]);
      setCommentText('');
      setIsCommentModalOpen(false);
      
      // Aquí podrías también aplicar algún formato al texto comentado
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          selection.formatText('highlight');
        }
      });
    }
  };

  const showCommentsList = () => {
    return (
      <div className="comments-list">
        {comments.map(comment => (
          <div 
            key={comment.id} 
            className="comment-item"
            onClick={() => setActiveComment(comment)}
          >
            <div className="comment-header">
              <MessageSquare size={16} />
              <span className="comment-selection">{comment.selectionText.substring(0, 20)}...</span>
            </div>
            <div className="comment-text">{comment.text}</div>
          </div>
        ))}
      </div>
    );
  };

  // Agregar una función global al editor para el botón de comentario
  useEffect(() => {
    if (editor) {
      // Exponer la función para que pueda ser llamada desde el FloatingToolbarPlugin
      Object.assign(window, {
        lexicalAddComment: handleCommentButtonClick
      });
    }
    
    return () => {
      // Limpieza al desmontar
      const win = window as any;
      if (win.lexicalAddComment) {
        delete win.lexicalAddComment;
      }
    };
  }, [editor, handleCommentButtonClick]);

  if (comments.length === 0 && !isCommentModalOpen) {
    return null;
  }

  return (
    <>
      {comments.length > 0 && (
        <div className={`comments-container ${!isCommentsVisible ? 'comments-collapsed' : ''}`}>
          <div className="comments-header">
            <div className="comments-title">
              <h3>Comentarios ({comments.length})</h3>
              <button 
                onClick={() => setIsCommentsVisible(!isCommentsVisible)}
                className="comments-toggle-btn"
                title={isCommentsVisible ? "Ocultar comentarios" : "Mostrar comentarios"}
              >
                {isCommentsVisible ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          {isCommentsVisible && showCommentsList()}
        </div>
      )}
      
      {isCommentModalOpen && (
        <div className="comment-modal" ref={commentModalRef}>
          <div className="comment-modal-header">
            <span>Añadir comentario</span>
            <button 
              onClick={() => setIsCommentModalOpen(false)}
              className="comment-close-btn"
            >
              <X size={16} />
            </button>
          </div>
          <div className="comment-modal-body">
            <div className="comment-selection-text">
              "{currentSelection?.text}"
            </div>
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Escribe un comentario..."
              className="comment-input"
              autoFocus
            />
            <div className="comment-modal-footer">
              <button 
                onClick={() => setIsCommentModalOpen(false)}
                className="comment-btn cancel"
              >
                Cancelar
              </button>
              <button 
                onClick={saveComment}
                className="comment-btn save"
                disabled={!commentText.trim()}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
