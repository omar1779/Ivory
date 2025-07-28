"use client";

import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListItemNode, ListNode } from '@lexical/list';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { TRANSFORMERS } from '@lexical/markdown';

import ToolbarPlugin from './ToolbarPlugin';
import FloatingToolbarPlugin from './FloatingToolbarPlugin';
import CommentPlugin from './CommentPlugin';
import DraggableBlockPlugin from './DraggableBlockPlugin';
import IvoryTheme from './IvoryTheme';
import './IvoryTheme.css';

function Placeholder() {
  return <div className="editor-placeholder">Escribe algo...</div>;
}

const editorConfig = {
  namespace: 'IvoryEditor',
  theme: IvoryTheme,
  onError(error: any) {
    throw error;
  },
  nodes: [
    HeadingNode,
    QuoteNode,
    ListItemNode,
    ListNode,
    CodeHighlightNode,
    CodeNode,
    AutoLinkNode,
    LinkNode,
  ],
};

import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import { $getRoot, $insertNodes } from 'lexical';
import { useEffect, useRef } from 'react';

// Plugin to sync the editor state with an external HTML value
function SyncPlugin({ html }: { html: string }) {
  const [editor] = useLexicalComposerContext();
  const prevHtmlRef = useRef<string>(html);
  
  // Sincronizar cuando cambia el HTML o cuando se carga inicialmente
  useEffect(() => {
    // Solo actualizamos si el HTML ha cambiado
    if (html !== prevHtmlRef.current) {
      prevHtmlRef.current = html;
      
      editor.update(() => {
        try {
          // Limpiar y cargar el nuevo contenido
          const parser = new DOMParser();
          const dom = parser.parseFromString(html || '<p></p>', 'text/html');
          const nodes = $generateNodesFromDOM(editor, dom);
          $getRoot().clear();
          $getRoot().append(...nodes);
          console.log('Contenido del editor actualizado con HTML:', html?.substring(0, 50));
        } catch (e) {
          console.error('Error sincronizando HTML con el editor', e);
        }
      });
    }
  }, [editor, html]);
  return null;
}

export default function LexicalNoteEditor({ value, onChange }: { value: string, onChange: (html: string) => void }) {
  return (
    <LexicalComposer initialConfig={editorConfig}>
      <div className="editor-container">
        <ToolbarPlugin />
        <div className="editor-inner">
          <RichTextPlugin
            contentEditable={<ContentEditable className="editor-input" />}
            placeholder={<Placeholder />}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <AutoFocusPlugin />
          <OnChangePlugin onChange={(editorState, editor) => {
            editorState.read(() => {
              const html = $generateHtmlFromNodes(editor, null);
              onChange(html);
            });
          }} />
          {value && <SyncPlugin html={value} />}
          <ListPlugin />
          <LinkPlugin />
          <FloatingToolbarPlugin />
          <CommentPlugin />
          <DraggableBlockPlugin />
          <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
        </div>
      </div>
    </LexicalComposer>
  );
}
