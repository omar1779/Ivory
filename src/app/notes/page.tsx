"use client";

import { useState, useMemo, useCallback } from 'react';
import { useNotes } from '@/lib/hooks/useNotes';
import NotesList from '@/components/notes/NotesList';
import NoteEditor from '@/components/notes/NoteEditor';
import { Note } from '@/lib/types/note';
import { Button } from '@/components/ui/button';
import { Plus, FileText } from 'lucide-react';
import ExportToPDF from '@/components/notes/ExportToPDF';

export default function NotesPage() {

  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [currentFolder, setCurrentFolder] = useState<string | undefined>(undefined);
  
  const { 
    notes, 
    loading, 
    createNote, 
    updateNote, 
    deleteNote,
    togglePin
  } = useNotes(currentFolder);

  // Mover las declaraciones de las funciones al principio
  const handleCreateNote = useCallback(async () => {
    try {
      const noteData = {
        title: 'Nueva nota',
        content: '',
        folder: currentFolder || '',
        tags: [],
        isPinned: false,
        isArchived: false
      };
      
      console.log('Creando nota con datos:', noteData);
      const newNote = await createNote(noteData);
      
      if (newNote) {
        console.log('Nota creada exitosamente:', newNote);
        setSelectedNote(newNote);
      }
    } catch (error: unknown) {
      console.error('Error al crear la nota:', error);
      
      let errorMessage = 'Error desconocido';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        if (error.message.includes('No current user') || 
            error.name === 'NotAuthorizedException') {
          console.log('Redirigiendo a login...');
          window.location.href = '/login';
          return;
        }
      }
      
      alert(`No se pudo crear la nota: ${errorMessage}`);
    }
  }, [createNote, currentFolder]);

  const handleSaveNote = useCallback(async (noteData: {
    title: string;
    content: string;
    tags?: string[];
    folder?: string;
  }) => {
    if (!selectedNote) return;
    
    try {
      const updates: Partial<Note> = {
        title: noteData.title,
        content: noteData.content,
        tags: noteData.tags || [],
        folder: noteData.folder || '',
      };
      
      await updateNote(selectedNote.id, updates);
    } catch (error) {
      console.error('Error al guardar la nota:', error);
      throw error;
    }
  }, [selectedNote, updateNote]);

  const handleDeleteNote = useCallback(async (noteId: string) => {
    try {
      await deleteNote(noteId);
      if (selectedNote?.id === noteId) {
        setSelectedNote(null);
      }
    } catch (error) {
      console.error('Error al eliminar la nota:', error);
    }
  }, [deleteNote, selectedNote?.id]);

  const handleTogglePin = useCallback(async (noteId: string, isPinned: boolean) => {
    try {
      await togglePin(noteId, isPinned);
    } catch (error) {
      console.error('Error al anclar/desanclar la nota:', error);
    }
  }, [togglePin]);

  const handleSelectFolder = useCallback((folder: string | undefined) => {
    setCurrentFolder(folder);
  }, []);

  // Extraer carpetas únicas de las notas
  const folders = useMemo(() => {
    const folderSet = new Set<string>();
    notes.forEach(note => {
      if (note.folder) {
        folderSet.add(note.folder);
      }
    });
    return Array.from(folderSet).sort();
  }, [notes]);
  
  // Memoizar la lista de notas para evitar re-renderizados innecesarios
  const memoizedNotesList = useMemo(() => (
    <NotesList
      notes={notes}
      selectedNoteId={selectedNote?.id}
      onSelectNote={setSelectedNote}
      onCreateNote={handleCreateNote}
      onDeleteNote={handleDeleteNote}
      onTogglePin={handleTogglePin}
      folders={folders}
      currentFolder={currentFolder}
      onSelectFolder={handleSelectFolder}
    />
  ), [
    notes, 
    selectedNote?.id, 
    handleCreateNote, 
    handleDeleteNote, 
    handleTogglePin, 
    folders, 
    currentFolder, 
    handleSelectFolder
  ]);
  
  // Memoizar el editor de notas
  const memoizedNoteEditor = useMemo(() => {
    if (!selectedNote) return null;
    
    return (
      <div className="flex flex-col h-full">
        <div className="border-b border-gray-200 dark:border-gray-700 p-2 flex justify-end bg-white dark:bg-gray-800">
          <ExportToPDF
            note={selectedNote}
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            buttonText="Exportar PDF"
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          <NoteEditor
            note={selectedNote}
            onSave={handleSaveNote}
            onCancel={() => setSelectedNote(null)}
          />
        </div>
      </div>
    );
  }, [selectedNote, handleSaveNote]);
  
  // Memoizar el estado vacío
  const memoizedEmptyState = useMemo(() => (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <FileText className="w-16 h-16 text-gray-500 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No hay nota seleccionada</h3>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        Selecciona una nota existente o crea una nueva para empezar
      </p>
      <Button onClick={handleCreateNote}>
        <Plus className="h-4 w-4 mr-2" />
        Crear nueva nota
      </Button>
    </div>
  ), [handleCreateNote]);



  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)] bg-white dark:bg-gray-900">
      {/* Sidebar */}
      <div className="w-72 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col h-full overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Mis Notas</h2>
        </div>
        <div className="flex-1 overflow-hidden flex flex-col">
          {memoizedNotesList}
        </div>
      </div>
      
      {/* Área de edición */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-gray-900">
        {selectedNote ? memoizedNoteEditor : memoizedEmptyState}
      </div>
    </div>
  );
}
