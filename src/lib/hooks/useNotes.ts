import { useState, useEffect, useCallback, useMemo } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import { Note, NoteInput } from '@/lib/types/note';
import { useNotification } from '@/components/ui/NotificationProvider';

type NoteModel = {
  id: string;
  title: string | null;
  content: string | null;
  folder: string | null;
  tags: (string | null)[] | null;
  isPinned: boolean | null;
  isArchived: boolean | null;
  owner: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

interface UseNotesReturn {
  notes: Note[];
  loading: boolean;
  error: Error | null;
  createNote: (noteData: Omit<NoteInput, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Note>;
  updateNote: (id: string, updates: Partial<NoteInput>) => Promise<Note | null>;
  deleteNote: (id: string) => Promise<boolean>;
  togglePin: (noteId: string, isPinned: boolean) => Promise<Note | null>;
  refresh: () => Promise<void>;
}

export function useNotes(folder?: string): UseNotesReturn {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const client = generateClient<Schema>();
  const { showSuccess, showError, showSuccessWithUndo } = useNotification();

  const formatNote = useCallback((note: NoteModel): Note => {
    if (!note.id) throw new Error('La nota debe tener un ID');
    
    return {
      id: note.id,
      title: note.title || 'Sin título',
      content: note.content || '',
      folder: note.folder || '',
      tags: (note.tags || []).filter((tag): tag is string => tag !== null),
      isPinned: note.isPinned || false,
      isArchived: note.isArchived || false,
      owner: note.owner || '',
      createdAt: note.createdAt || new Date().toISOString(),
      updatedAt: note.updatedAt || new Date().toISOString(),
    };
  }, []);

  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true);
      const { data: notesData, errors } = await client.models.Note.list({
        filter: folder ? { folder: { eq: folder } } : undefined,
        authMode: 'userPool',
      });
      if (errors) throw new Error(errors[0].message);
      
      const formattedNotes = notesData.map(formatNote);
      setNotes(formattedNotes);
    } catch (err) {
      console.error('Error fetching notes:', err);
      setError(err instanceof Error ? err : new Error('Error al cargar las notas'));
      showError('Error al cargar las notas');
    } finally {
      setLoading(false);
    }
  }, [folder, client, formatNote, setNotes, showError]);

  const createNote = useCallback(async (input: Omit<NoteInput, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note> => {
    try {
      // El campo owner será manejado automáticamente por Cognito a través de las reglas de autorización
      const { data: createdNote, errors } = await client.models.Note.create(
        {
          title: input.title,
          content: input.content,
          folder: input.folder || '',
          tags: input.tags || [],
          isPinned: input.isPinned || false,
          isArchived: input.isArchived || false,
        },
        { authMode: 'userPool' }
      );

      if (errors || !createdNote) {
        throw errors || new Error('No se pudo crear la nota');
      }

      const newNote = formatNote(createdNote);
      setNotes(prevNotes => [...prevNotes, newNote]);
      
      showSuccess('Nota creada correctamente');
      return newNote;
    } catch (err) {
      console.error('Error al crear la nota:', err);
      setError(err instanceof Error ? err : new Error('Error al crear la nota'));
      showError('Error al crear la nota');
      throw err; // Re-lanzar el error para que el componente pueda manejarlo si es necesario
    }
  }, [client, formatNote, setNotes, showSuccess, showError]);

  const deleteNote = useCallback(
    async (id: string) => {
      try {
        const noteToDelete = notes.find(note => note.id === id);
        
        const { data: deletedNote, errors } = await client.models.Note.delete({
          id,
        });

        if (errors) throw errors;
        if (!deletedNote) return false;

        setNotes((prev) => prev.filter((note) => note.id !== id));
        
        // Mostrar notificación con opción de deshacer
        showSuccessWithUndo(
          'Nota eliminada correctamente',
          async () => {
            if (noteToDelete) {
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const { id, ...noteData } = noteToDelete;
              await createNote(noteData);
            }
          },
          { title: 'Nota eliminada' }
        );
        
        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error al eliminar la nota';
        console.error('Error al eliminar la nota:', err);
        setError(err instanceof Error ? err : new Error('Error al eliminar la nota'));
        showError(errorMessage);
        return false;
      }
    },
    [client, notes, createNote, showSuccessWithUndo, showError]
  );

  const updateNote = useCallback(
    async (id: string, updates: Partial<NoteInput>): Promise<Note | null> => {
      if (!client) return null;

      try {
        const { data: updatedNote, errors } = await client.models.Note.update({
          id,
          ...updates,
        });
        if (errors) throw errors;
        if (!updatedNote) return null;

        const formattedNote = formatNote(updatedNote);
        setNotes((prev) =>
          prev.map((note) => (note.id === id ? formattedNote : note))
        );
        
        // Mostrar notificación de éxito
        showSuccess('Nota actualizada correctamente');
        
        return formattedNote;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error al actualizar la nota';
        console.error('Error al actualizar la nota:', err);
        setError(err instanceof Error ? err : new Error('Error al actualizar la nota'));
        showError(errorMessage);
        return null;
      }
    },
    [client, formatNote, showSuccess, showError]
  );

  const togglePin = useCallback(async (noteId: string, isPinned: boolean): Promise<Note | null> => {
    try {
      const { data: updatedNote, errors } = await client.models.Note.update({
        id: noteId,
        isPinned: !isPinned
      });

      if (errors) throw errors;
      if (!updatedNote) return null;

      const formattedNote = formatNote(updatedNote);
      
      // Actualizar la lista de notas
      setNotes(prevNotes => 
        prevNotes.map(note => 
          note.id === noteId ? formattedNote : note
        )
      );

      return formattedNote;
    } catch (err) {
      console.error('Error al cambiar el estado de anclaje:', err);
      setError(err instanceof Error ? err : new Error('Error al actualizar la nota'));
      return null;
    }
  }, [client, formatNote, setNotes]);

  // Cargar notas al montar el componente o cuando cambia el folder
  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Ordenar notas: primero las ancladas, luego por fecha de actualización
  const sortedNotes = useMemo(() => {
    return [...notes].sort((a, b) => {
      // Si una está anclada y la otra no, la anclada va primero
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      
      // Si ambas están ancladas o ninguna, ordenar por fecha de actualización (más reciente primero)
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [notes]);

  return {
    notes: sortedNotes,
    loading,
    error,
    createNote,
    updateNote,
    deleteNote,
    togglePin,
    refresh: fetchNotes,
  };
}
