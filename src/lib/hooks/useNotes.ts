import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import { Note, NoteInput } from '@/lib/types/note';
import { useNotification } from '@/components/ui/NotificationProvider';

// Establecer el cliente fuera del hook para mantener una única instancia
const client = generateClient<Schema>();

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
  const { showSuccess, showError, showSuccessWithUndo } = useNotification();
  
  // Usar una referencia para el folder actual
  const folderRef = useRef(folder);
  folderRef.current = folder;

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
  
  // Usar useRef para mantener una referencia estable a fetchNotes
  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true);
      const currentFolder = folderRef.current;
      const { data: notesData, errors } = await client.models.Note.list({
        filter: currentFolder ? { folder: { eq: currentFolder } } : undefined,
        authMode: 'userPool',
      });
      
      if (errors && errors.length > 0) {
        throw new Error(errors[0].message || 'Error al cargar las notas');
      }
      
      const formattedNotes = Array.isArray(notesData) 
        ? notesData.map(note => formatNote(note))
        : [];
        
      setNotes(formattedNotes);
    } catch (err) {
      console.error('Error fetching notes:', err);
      const error = err instanceof Error ? err : new Error('Error al cargar las notas');
      setError(error);
      showError(error.message);
    } finally {
      setLoading(false);
    }
  }, [formatNote, showError]);

  const createNote = useCallback(async (input: Omit<NoteInput, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note> => {
    try {
      const { data: createdNote, errors } = await client.models.Note.create(
        {
          title: input.title || 'Sin título',
          content: input.content || '',
          folder: input.folder || '',
          tags: input.tags?.filter(Boolean) || [],
          isPinned: Boolean(input.isPinned),
          isArchived: Boolean(input.isArchived),
        },
        { authMode: 'userPool' }
      );

      if (errors?.length) {
        throw new Error(errors[0].message || 'No se pudo crear la nota');
      }

      if (!createdNote) {
        throw new Error('No se recibió respuesta al crear la nota');
      }

      const newNote = formatNote(createdNote);
      
      // Actualizar el estado de manera óptima
      setNotes(prevNotes => [...prevNotes, newNote]);
      
      showSuccess('Nota creada correctamente');
      return newNote;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error al crear la nota');
      console.error('Error al crear la nota:', error);
      setError(error);
      showError(error.message);
      throw error;
    }
  }, [formatNote, showSuccess, showError]);

  const deleteNote = useCallback(
    async (id: string) => {
      try {
        // Usar la función de actualización para evitar dependencia directa de notes
        setNotes(prevNotes => {
          const noteToDelete = prevNotes.find(note => note.id === id);
          
          // Iniciar la eliminación en segundo plano
          client.models.Note.delete({ id })
            .then(({ errors }) => {
              if (errors?.length) {
                throw new Error(errors[0].message || 'Error al eliminar la nota');
              }
              
              if (noteToDelete) {
                const undoDelete = async () => {
                  try {
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { id: _, ...noteData } = noteToDelete;
                    await createNote(noteData);
                  } catch (undoError) {
                    console.error('Error al deshacer eliminación:', undoError);
                    showError('No se pudo recuperar la nota');
                  }
                };
                
                showSuccessWithUndo(
                  'Nota eliminada correctamente',
                  undoDelete,
                  { title: 'Nota eliminada' }
                );
              }
            })
            .catch(err => {
              const error = err instanceof Error ? err : new Error('Error al eliminar la nota');
              console.error('Error al eliminar la nota:', error);
              setError(error);
              showError(error.message);
            });
            
          // Retornar el estado actualizado inmediatamente
          return prevNotes.filter(note => note.id !== id);
        });
        
        return true;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Error al eliminar la nota');
        console.error('Error al eliminar la nota:', error);
        setError(error);
        showError(error.message);
        return false;
      }
    },
    [createNote, showSuccessWithUndo, showError]
  );

  const updateNote = useCallback(
    async (id: string, updates: Partial<NoteInput>): Promise<Note | null> => {
      try {
        const { data: updatedNote, errors } = await client.models.Note.update({
          id,
          ...updates,
        });
        
        if (errors?.length) {
          throw new Error(errors[0].message || 'Error al actualizar la nota');
        }
        
        if (!updatedNote) return null;

        const formattedNote = formatNote(updatedNote);
        setNotes(prev => prev.map(note => 
          note.id === id ? formattedNote : note
        ));
        
        showSuccess('Nota actualizada correctamente');
        return formattedNote;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Error al actualizar la nota');
        console.error('Error al actualizar la nota:', error);
        setError(error);
        showError(error.message);
        return null;
      }
    },
    [formatNote, showSuccess, showError]
  );

  const togglePin = useCallback(async (noteId: string, isPinned: boolean): Promise<Note | null> => {
    try {
      const { data: updatedNote, errors } = await client.models.Note.update({
        id: noteId,
        isPinned: !isPinned
      });

      if (errors?.length) {
        throw new Error(errors[0].message || 'Error al actualizar la nota');
      }
      
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
  }, [formatNote]);

  // Cargar notas al montar el componente
  useEffect(() => {
    const loadNotes = async () => {
      await fetchNotes();
    };
    
    loadNotes().catch(err => {
      console.error('Error in loadNotes:', err);
      setError(err instanceof Error ? err : new Error('Error al cargar las notas'));
    });
    
    // Limpieza si es necesario
    return () => {
      // Aquí podrías cancelar peticiones pendientes si fuera necesario
    };
  }, [fetchNotes]);

  // Ordenar notas: primero las ancladas, luego por fecha de actualización
  const sortedNotes = useMemo(() => {
    if (!notes.length) return [];
    
    return [...notes].sort((a, b) => {
      // Primero por estado de anclado
      if (a.isPinned !== b.isPinned) {
        return a.isPinned ? -1 : 1;
      }
      
      // Luego por fecha de actualización (más reciente primero)
      try {
        const dateA = new Date(a.updatedAt).getTime();
        const dateB = new Date(b.updatedAt).getTime();
        return dateB - dateA;
      } catch (error) {
        console.error('Error al comparar fechas:', error);
        return 0; // En caso de error en el formato de fecha
      }
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
