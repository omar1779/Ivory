"use client";



import { useState, useEffect } from 'react';
import LexicalNoteEditor from './LexicalNoteEditor';
import { Note } from '@/lib/types/note';
import { Button } from '../ui/button';
import { extractTitleFromContent, cleanTitle } from '@/lib/utils/titleExtractor';
import { Save, X, Tag as TagIcon, Folder } from 'lucide-react';

interface NoteEditorProps {
  note?: Note;
  onSave: (note: { title: string; content: string; tags?: string[]; folder?: string }) => Promise<void>;
  onCancel?: () => void;
  isSaving?: boolean;
  folders?: string[];
}

export default function NoteEditor({ note, onSave, onCancel, isSaving = false, folders = [] }: NoteEditorProps) {
  const [content, setContent] = useState(note?.content || '');
  const [tags, setTags] = useState<string[]>(note?.tags || []);
  const [folder, setFolder] = useState(note?.folder || '');
  const [, setIsPinned] = useState(note?.isPinned || false);
  const [tagInput, setTagInput] = useState('');
  
  // Título se extrae automáticamente del contenido
  // Si no hay contenido en el editor, usar el contenido de la nota original
  const titleContent = content || note?.content || '';
  const title = extractTitleFromContent(titleContent);

  useEffect(() => {
    if (note) {
      setContent(note.content || '');
      setTags(note.tags || []);
      setFolder(note.folder || '');
      setIsPinned(note.isPinned || false);
    } else {
      // Reset form when no note is selected
      setContent('');
      setTags([]);
      setFolder('');
      setIsPinned(false);
    }
  }, [note]); // Include note to satisfy linter

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
    const cleanedTitle = cleanTitle(title);
    await onSave({ title: cleanedTitle, content, tags, folder });
  };

  return (
    <div className="h-full w-full flex flex-col bg-white dark:bg-gray-900 rounded-lg md:rounded-2xl shadow-sm md:shadow-lg">
      {/* Title Preview */}
      {title && title !== 'Sin título' && (
        <div className="px-3 py-2 md:px-4 md:py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-t-lg md:rounded-t-2xl">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Título:</span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
              {title}
            </span>
          </div>
        </div>
      )}
      
      <div className="flex-1 flex flex-col min-h-0 relative">
        <div className="flex-1 overflow-hidden flex flex-col">
          <LexicalNoteEditor value={content} onChange={setContent} noteId={note?.id} />
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
