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
      <div className="p-2 lg:p-4 pb-0">
        {/* Search Bar - Responsive */}
        <div className="relative mb-3 lg:mb-4">
          <div className="absolute inset-y-0 left-0 pl-2 lg:pl-3 flex items-center pointer-events-none">
            <Search className="h-3 w-3 lg:h-4 lg:w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="block w-full pl-8 lg:pl-10 pr-2 lg:pr-3 py-1.5 lg:py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-xs lg:text-sm"
          />
        </div>
        
        {/* Folder Filters - Responsive Horizontal Scroll */}
        <div className="flex space-x-1 lg:space-x-2 mb-3 lg:mb-4 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
          <button
            onClick={() => handleFolderClick(undefined)}
            className={`px-2 lg:px-3 py-1 text-xs lg:text-sm rounded-full whitespace-nowrap flex-shrink-0 transition-colors ${
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
              className={`px-2 lg:px-3 py-1 text-xs lg:text-sm rounded-full whitespace-nowrap flex items-center flex-shrink-0 transition-colors ${
                currentFolder === folder
                  ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100' 
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Folder className="w-2.5 h-2.5 lg:w-3 lg:h-3 mr-1" />
              <span className="truncate max-w-16 lg:max-w-none">{folder}</span>
            </button>
          ))}
        </div>
        
        {/* Create Note Button - Responsive */}
        <Button 
          onClick={onCreateNote} 
          size="sm" 
          className="w-full flex items-center justify-center gap-1 lg:gap-2 bg-indigo-600 hover:bg-indigo-700 text-white mb-3 lg:mb-4 py-2 lg:py-2.5 text-xs lg:text-sm"
        >
          <Plus className="h-3 w-3 lg:h-4 lg:w-4" />
          <span className="hidden sm:inline lg:inline">Nueva nota</span>
          <span className="sm:hidden lg:hidden">Nueva</span>
        </Button>
      </div>
      
      {/* Notes List - Responsive */}
      <div className="flex-1 overflow-y-auto px-2 lg:px-4 pb-2 lg:pb-4 -mx-2 lg:-mx-4">
        {filteredNotes.length === 0 ? (
          <div className="py-6 lg:py-8 text-center text-gray-500 dark:text-gray-400">
            <FileText className="mx-auto h-8 w-8 lg:h-12 lg:w-12 text-gray-300 dark:text-gray-600 mb-2" />
            <p className="text-xs lg:text-sm">No hay notas en esta carpeta</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 hidden lg:block">Crea una nueva nota para comenzar</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredNotes.map((note) => (
              <li
                key={note.id}
                onClick={() => onSelectNote(note)}
                className={`px-2 lg:px-3 py-2 lg:py-3 cursor-pointer rounded-lg mx-1 transition-colors ${
                  selectedNoteId === note.id 
                    ? 'bg-indigo-50 dark:bg-gray-700' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div 
                    className="flex-1 cursor-pointer min-w-0"
                    onClick={() => handleNoteClick(note)}
                  >
                    <div className="flex items-center min-w-0">
                      <h3 className="font-medium text-gray-900 dark:text-white truncate flex-1 min-w-0 mr-2 text-sm lg:text-base">
                        {note.title || 'Sin título'}
                      </h3>
                      {note.isPinned && (
                        <Pin className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-yellow-400 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleTogglePin(e, note.id, note.isPinned)}
                    className="ml-1 lg:ml-2 p-1 rounded-full hover:bg-gray-600 text-gray-400 hover:text-yellow-400 transition-colors"
                    title={note.isPinned ? 'Desanclar' : 'Anclar'}
                  >
                    {note.isPinned ? (
                      <PinOff className="w-3 h-3 lg:w-4 lg:h-4" />
                    ) : (
                      <Pin className="w-3 h-3 lg:w-4 lg:h-4" />
                    )}
                  </button>
                </div>
                
                {/* Folder - Responsive */}
                {note.folder && (
                  <div className="flex items-center text-xs text-gray-400 mt-1">
                    <Folder className="w-2.5 h-2.5 lg:w-3 lg:h-3 mr-1" />
                    <span className="truncate">{note.folder}</span>
                  </div>
                )}
                
                {/* Content Preview - Responsive */}
                <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-1 lg:line-clamp-2 break-words overflow-hidden">
                  {note.content.replace(/[#*_`~\[\]()]/g, '').substring(0, 60)}
                  {note.content.replace(/[#*_`~\[\]()]/g, '').length > 60 && '...'}
                </p>
                
                {/* Tags - Responsive */}
                {(note.tags && note.tags.length > 0) && (
                  <div className="flex flex-wrap gap-1 mt-1.5 lg:mt-2 overflow-hidden">
                    {note.tags.slice(0, 2).map((tag: string) => (
                      <span 
                        key={tag} 
                        className="inline-flex items-center px-1.5 lg:px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200 truncate max-w-16 lg:max-w-20"
                        title={tag}
                      >
                        {tag}
                      </span>
                    ))}
                    {note.tags.length > 2 && (
                      <span className="text-xs text-gray-400">+{note.tags.length - 2}</span>
                    )}
                  </div>
                )}
                
                {/* Timestamp and Actions - Responsive */}
                <div className="flex justify-between items-center mt-1.5 lg:mt-2 text-xs text-gray-400">
                  <span className="truncate">
                    {formatDistanceToNow(new Date(note.updatedAt), { 
                      addSuffix: true, 
                      locale: es 
                    })}
                  </span>
                  <button
                    onClick={(e) => handleDeleteClick(e, note.id)}
                    className="text-red-400 hover:text-red-300 px-1.5 lg:px-2 py-1 text-xs rounded hover:bg-red-900/30 transition-colors flex-shrink-0 ml-2"
                  >
                    {showDeleteConfirm === note.id ? '¿Eliminar?' : 'Eliminar'}
                  </button>
                </div>
                
                {/* Delete Confirmation - Responsive */}
                {showDeleteConfirm === note.id && (
                  <div className="flex justify-end space-x-1 lg:space-x-2 mt-2">
                    <button
                      onClick={(e) => handleConfirmDelete(e, note.id)}
                      className="text-xs px-2 lg:px-3 py-1 bg-red-600 hover:bg-red-700 rounded transition-colors"
                    >
                      <span className="hidden lg:inline">Sí, eliminar</span>
                      <span className="lg:hidden">Sí</span>
                    </button>
                    <button
                      onClick={handleCancelDelete}
                      className="text-xs px-2 lg:px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded transition-colors"
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
