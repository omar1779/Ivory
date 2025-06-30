"use client";

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useNotes } from '@/lib/hooks/useNotes';
import NotesList from '@/components/notes/NotesList';
import NoteEditor from '@/components/notes/NoteEditor';
import { Note } from '@/lib/types/note';
import { Button } from '@/components/ui/button';
import { Plus, FileText } from 'lucide-react';
import ExportToPDF from '@/components/notes/ExportToPDF';

export default function NotesPage() {
  const router = useRouter();
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [currentFolder, setCurrentFolder] = useState<string | undefined>(undefined);
  
  const { 
    notes, 
    loading, 
    createNote, 
    updateNote, 
    deleteNote,
    togglePin,
    refresh: refreshNotes
  } = useNotes(currentFolder);

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

  const handleCreateNote = async () => {
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
    } catch (error: any) {
      console.error('Error al crear la nota:', error);
      // Mostrar un mensaje de error al usuario
      alert('No se pudo crear la nota. Por favor, asegúrate de haber iniciado sesión.');
      // Redirigir al login si hay un error de autenticación
      if (error?.errors?.[0]?.errorType === 'Unauthorized' || 
          error?.message?.includes('No current user') ||
          error?.name === 'NotAuthorizedException') {
        window.location.href = '/login';
      }
    }
  };

  const handleSaveNote = async (noteData: {
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
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNote(noteId);
      if (selectedNote?.id === noteId) {
        setSelectedNote(null);
      }
    } catch (error) {
      console.error('Error al eliminar la nota:', error);
    }
  };

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
          <NotesList
            notes={notes}
            selectedNoteId={selectedNote?.id}
            onSelectNote={setSelectedNote}
            onCreateNote={handleCreateNote}
            onDeleteNote={handleDeleteNote}
            onTogglePin={togglePin}
            folders={folders}
            currentFolder={currentFolder}
            onSelectFolder={setCurrentFolder}
          />
        </div>
      </div>
      
      {/* Área de edición */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-gray-900">
        {selectedNote ? (
          <div className="flex flex-col h-full">
            <div className="border-b border-gray-200 dark:border-gray-700 p-2 flex justify-end bg-white dark:bg-gray-800">
              <ExportToPDF
                content={selectedNote.content}
                title={selectedNote.title || 'nota-sin-titulo'}
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
        ) : (
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
        )}
      </div>
    </div>
  );
}
