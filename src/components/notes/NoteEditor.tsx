"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Note } from '@/lib/types/note';
import { Button } from '../ui/button';
// Usando solo los íconos necesarios
import { Save, X, Pin, Tag as TagIcon, Folder } from 'lucide-react';

// Carga dinámica del editor para SSR
const MDEditor = dynamic(
  () => import("@uiw/react-md-editor"),
  { ssr: true }
);

interface NoteEditorProps {
  note?: Note;
  onSave: (note: { title: string; content: string; tags?: string[]; folder?: string }) => Promise<void>;
  onCancel?: () => void;
  isSaving?: boolean;
  folders?: string[];
}

export default function NoteEditor({ note, onSave, onCancel, isSaving = false, folders = [] }: NoteEditorProps) {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [tags, setTags] = useState<string[]>(note?.tags || []);
  const [folder, setFolder] = useState(note?.folder || '');
  const [isPinned, setIsPinned] = useState(note?.isPinned || false);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setTags(note.tags || []);
      setFolder(note.folder || '');
      setIsPinned(note.isPinned || false);
    }
  }, [note]);

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({ title, content, tags, folder });
  };

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-gray-900">
      <div className="flex-none border-b border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
        <div className="w-full">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título de la nota"
              className="flex-1 bg-transparent text-2xl font-semibold border-none focus:ring-0 focus:outline-none dark:text-white placeholder-gray-400 px-2 py-1 rounded"
            />
            <button
              onClick={() => setIsPinned(!isPinned)}
              className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 ${isPinned ? 'text-yellow-500' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
              title={isPinned ? 'Desfijar nota' : 'Fijar nota'}
            >
              <Pin className={`w-5 h-5 ${isPinned ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0 relative">
        <div className="flex-1 overflow-hidden flex flex-col">
          <MDEditor
            value={content}
            onChange={(val) => setContent(val || '')}
            height="100%"
            className="h-full [&_.w-md-editor]:!bg-white [&_.w-md-editor]:dark:!bg-gray-900 [&_.w-md-editor-toolbar]:!bg-gray-50 [&_.w-md-editor-toolbar]:dark:!bg-gray-800 [&_.w-md-editor-toolbar]:border-b [&_.w-md-editor-toolbar]:border-gray-200 [&_.w-md-editor-toolbar]:dark:border-gray-700 [&_.w-md-editor]:!static [&_.w-md-editor-content]:!static [&_.w-md-editor-preview]:!static [&_.w-md-editor-content]:!flex [&_.w-md-editor-content]:!flex-row [&_.w-md-editor-content]:!h-full [&_.w-md-editor-input]:!w-1/2 [&_.w-md-editor-preview]:!w-1/2 [&_.w-md-editor-preview]:!p-6 [&_.w-md-editor-input]:!p-6 [&_.w-md-editor-input]:!border-r [&_.w-md-editor-input]:!border-gray-200 [&_.w-md-editor-input]:dark:!border-gray-700"
            preview="edit"
            visibleDragbar={true}
            overflow={true}
            textareaProps={{
              placeholder: 'Escribe tu nota aquí...',
              className: 'w-full h-full focus:ring-0 focus:outline-none text-base leading-relaxed',
            }}
            previewOptions={{
              wrapperElement: {
                'data-color-mode': 'dark',
                className: 'h-full overflow-auto',
              },
            }}
            style={{
              fontSize: '1rem',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}
            data-color-mode="dark"
          />
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="max-w-4xl mx-auto w-full space-y-4">
          <div className="flex flex-wrap gap-2 items-center">
            <TagIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
              >
                {tag}
                <button
                  onClick={() => setTags(tags.filter((t) => t !== tag))}
                  className="ml-1.5 inline-flex items-center justify-center w-3.5 h-3.5 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-500 dark:hover:bg-blue-800"
                >
                  ×
                </button>
              </span>
            ))}
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="Añadir etiqueta..."
              className="flex-1 min-w-[120px] bg-transparent border-0 focus:ring-0 focus:outline-none text-sm placeholder-gray-400"
            />
          </div>

          <div className="flex flex-wrap justify-between items-center gap-2">
            <div className="flex items-center space-x-2">
              <Folder className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <select
                value={folder}
                onChange={(e) => setFolder(e.target.value)}
                className="bg-transparent border-0 text-sm text-gray-700 dark:text-gray-300 focus:ring-0 focus:outline-none"
              >
                <option value="">Sin carpeta</option>
                {folders.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              {onCancel && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onCancel}
                  disabled={isSaving}
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancelar
                </Button>
              )}
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={isSaving || !title.trim()}
              >
                <Save className="w-4 h-4 mr-1" />
                {isSaving ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
