"use client";

import { Note } from '@/lib/types/note';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { FileText, Pin, Folder, Search, PinOff, Plus } from 'lucide-react';
import { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import React from 'react';

interface NotesListProps {
  notes: Note[];
  selectedNoteId?: string;
  onSelectNote: (note: Note) => void;
  onCreateNote: () => void;
  onDeleteNote: (noteId: string) => void;
  onTogglePin: (noteId: string, isPinned: boolean) => void;
  folders: string[];
  currentFolder?: string;
  onSelectFolder: (folder?: string) => void;
}

export default function NotesList({
  notes,
  selectedNoteId,
  onSelectNote,
  onCreateNote,
  onDeleteNote,
  onTogglePin,
  folders,
  currentFolder,
  onSelectFolder,
}: NotesListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const filteredNotes = useMemo(() => 
    notes.filter(note => {
      const matchesSearch = searchQuery === '' || 
        (note.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (note.content?.toLowerCase() || '').includes(searchQuery.toLowerCase());
      
      const matchesFolder = !currentFolder || note.folder === currentFolder;
      
      return matchesSearch && matchesFolder;
    }),
    [notes, searchQuery, currentFolder]
  );
  
  // Memoizar manejadores de eventos
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);
  
  const handleFolderClick = useCallback((folder: string | undefined) => {
    onSelectFolder(folder);
  }, [onSelectFolder]);
  
  const handleNoteClick = useCallback((note: Note) => {
    onSelectNote(note);
  }, [onSelectNote]);
  
  const handleTogglePin = useCallback((e: React.MouseEvent, noteId: string, isPinned: boolean) => {
    e.stopPropagation();
    onTogglePin(noteId, isPinned);
  }, [onTogglePin]);
  
  const handleDeleteClick = useCallback((e: React.MouseEvent, noteId: string) => {
    e.stopPropagation();
    setShowDeleteConfirm(showDeleteConfirm === noteId ? null : noteId);
  }, [showDeleteConfirm]);
  
  const handleConfirmDelete = useCallback((e: React.MouseEvent, noteId: string) => {
    e.stopPropagation();
    onDeleteNote(noteId);
    setShowDeleteConfirm(null);
  }, [onDeleteNote]);
  
  const handleCancelDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(null);
  }, []);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="p-4 pb-0">
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar notas..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          />
        </div>
        
        <div className="flex space-x-2 mb-4 overflow-x-auto pb-2 -mx-1 px-1">
          <button
            onClick={() => handleFolderClick(undefined)}
            className={`px-3 py-1 text-sm rounded-full whitespace-nowrap ${
              !currentFolder 
                ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100' 
                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Todas
          </button>
          {folders.map((folder) => (
            <button
              key={folder}
              onClick={() => handleFolderClick(folder)}
              className={`px-3 py-1 text-sm rounded-full whitespace-nowrap flex items-center ${
                currentFolder === folder
                  ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100' 
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Folder className="w-3 h-3 mr-1" />
              {folder}
            </button>
          ))}
        </div>
        
        <Button 
          onClick={onCreateNote} 
          size="sm" 
          className="w-full flex items-center justify-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white mb-4"
        >
          <Plus className="h-4 w-4" />
          <span>Nueva nota</span>
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto px-4 pb-4 -mx-4">
        {filteredNotes.length === 0 ? (
          <div className="py-8 text-center text-gray-500 dark:text-gray-400">
            <FileText className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-2" />
            <p className="text-sm">No hay notas en esta carpeta</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Crea una nueva nota para comenzar</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredNotes.map((note) => (
              <li
                key={note.id}
                onClick={() => onSelectNote(note)}
                className={`px-3 py-2 cursor-pointer rounded-lg mx-1 ${
                  selectedNoteId === note.id 
                    ? 'bg-indigo-50 dark:bg-gray-700' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div 
                    className="flex-1 cursor-pointer"
                    onClick={() => handleNoteClick(note)}
                  >
                    <h3 className="font-medium text-white truncate flex items-center">
                      {note.title || 'Sin título'}
                      {note.isPinned && (
                        <Pin className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0 ml-2" />
                      )}
                    </h3>
                  </div>
                  <button
                    onClick={(e) => handleTogglePin(e, note.id, note.isPinned)}
                    className="ml-2 p-1 rounded-full hover:bg-gray-600 text-gray-400 hover:text-yellow-400 transition-colors"
                    title={note.isPinned ? 'Desanclar' : 'Anclar'}
                  >
                    {note.isPinned ? (
                      <PinOff className="w-4 h-4" />
                    ) : (
                      <Pin className="w-4 h-4" />
                    )}
                  </button>
                </div>
                
                {note.folder && (
                  <div className="flex items-center text-xs text-gray-400 mt-1">
                    <Folder className="w-3 h-3 mr-1" />
                    {note.folder}
                  </div>
                )}
                
                <p className="text-sm text-gray-300 mt-1 line-clamp-2">
                  {note.content.replace(/[#*_`~\[\]()]/g, '').substring(0, 100)}
                </p>
                
                {(note.tags && note.tags.length > 0) && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {note.tags.slice(0, 3).map((tag: string) => (
                      <span 
                        key={tag} 
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-900/50 text-indigo-200"
                      >
                        {tag}
                      </span>
                    ))}
                    {note.tags.length > 3 && (
                      <span className="text-xs text-gray-400">+{note.tags.length - 3}</span>
                    )}
                  </div>
                )}
                
                <div className="flex justify-between items-center mt-2 text-xs text-gray-400">
                  <span>
                    {formatDistanceToNow(new Date(note.updatedAt), { 
                      addSuffix: true, 
                      locale: es 
                    })}
                  </span>
                  <button
                    onClick={(e) => handleDeleteClick(e, note.id)}
                    className="text-red-400 hover:text-red-300 px-2 py-1 text-xs rounded hover:bg-red-900/30"
                  >
                    {showDeleteConfirm === note.id ? '¿Eliminar?' : 'Eliminar'}
                  </button>
                </div>
                
                {showDeleteConfirm === note.id && (
                  <div className="flex justify-end space-x-2 mt-2">
                    <button
                      onClick={(e) => handleConfirmDelete(e, note.id)}
                      className="text-xs px-2 py-1 bg-red-600 hover:bg-red-700 rounded"
                    >
                      Sí, eliminar
                    </button>
                    <button
                      onClick={handleCancelDelete}
                      className="text-xs px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
