"use client";

import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListItemNode } from '@lexical/list';
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
import SlashCommandPlugin from './SlashCommandPlugin';
import InitialContentPlugin from './InitialContentPlugin';
import IvoryTheme from './IvoryTheme';
import './IvoryTheme.css';

function Placeholder() {
  return (
    <div className="absolute top-3 left-3 md:top-5 md:left-5 lg:top-6 lg:left-6 text-slate-500 text-sm md:text-base pointer-events-none select-none">
      Escribe algo...
    </div>
  );
}

const editorConfig = {
  namespace: 'IvoryEditor',
  theme: IvoryTheme,
  onError(error: Error) {
    throw error;
  },
  nodes: [
    HeadingNode,
    QuoteNode,
    ListItemNode,
    LinkNode,
    CodeHighlightNode,
    CodeNode,
    AutoLinkNode,
  ],
};

import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { $generateHtmlFromNodes } from '@lexical/html';

interface LexicalNoteEditorProps {
  value: string;
  onChange: (html: string) => void;
  noteId?: string;
}

export default function LexicalNoteEditor({ value, onChange, noteId }: LexicalNoteEditorProps) {
  return (
    <LexicalComposer initialConfig={editorConfig}>
      <div className="h-full w-full flex flex-col text-slate-200">
        <ToolbarPlugin />
        <div className="flex-1 relative bg-slate-900 overflow-auto">
          <RichTextPlugin
            contentEditable={
              <ContentEditable className="min-h-[200px] md:min-h-[300px] lg:min-h-[400px] resize-none text-sm md:text-base relative outline-none p-3 md:p-5 lg:p-6 text-slate-200 bg-transparent flex-1 leading-relaxed" />
            }
            placeholder={<Placeholder />}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <AutoFocusPlugin />
          <InitialContentPlugin initialContent={value} noteId={noteId} />
          <OnChangePlugin onChange={(editorState, editor) => {
            editorState.read(() => {
              const html = $generateHtmlFromNodes(editor, null);
              onChange(html);
            });
          }} />
          <ListPlugin />
          <LinkPlugin />
          <FloatingToolbarPlugin />
          <CommentPlugin />
          <DraggableBlockPlugin />
          <SlashCommandPlugin />
          <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
        </div>
      </div>
    </LexicalComposer>
  );
}
