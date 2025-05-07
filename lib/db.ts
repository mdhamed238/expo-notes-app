import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';

export interface Note {
  id: number;
  title: string;
  content: string;
  mediaPath?: string | null;
  mediaType?: 'image' | 'audio' | 'document' | null;
  category?: string | null;
  createdAt: string;
  updatedAt: string;
}

let db: SQLite.SQLiteDatabase;
let dbInitialized = false; 

export const initDatabase = async () => {
  if (dbInitialized) return; 
  
  try {
    db = await SQLite.openDatabaseAsync('notes.db');

    await db.execAsync(`CREATE TABLE IF NOT EXISTS notes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          content TEXT,
          mediaPath TEXT,
          mediaType TEXT,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        );`);

    dbInitialized = true;
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

const ensureDbInitialized = async () => {
  if (!dbInitialized) {
    await initDatabase();
  }
};

export const saveNote = async (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note> => {
  await ensureDbInitialized();
  
  const now = new Date().toISOString();
  const noteWithTimestamps = { 
    ...note, 
    mediaPath: note.mediaPath || null,
    mediaType: note.mediaType || null,
    createdAt: now, 
    updatedAt: now 
  };

  try {
    const result = await db.runAsync(
      `INSERT INTO notes (title, content, mediaPath, mediaType, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [note.title, note.content, note.mediaPath || null, note.mediaType || null, now, now]
    );
    return { ...noteWithTimestamps, id: result.lastInsertRowId };
  } catch (error) {
    console.error('Error saving note:', error);
    throw error;
  }
};

export const updateNote = async (note: Note): Promise<void> => {
  await ensureDbInitialized();
  
  const now = new Date().toISOString();

  try {
    await db.runAsync(
      `UPDATE notes
       SET title = ?, content = ?, mediaPath = ?, mediaType = ?, updatedAt = ?
       WHERE id = ?`,
      [note.title, note.content, note.mediaPath || null, note.mediaType || null, now, note.id]
    );
  } catch (error) {
    console.error('Error updating note:', error);
    throw error;
  }
};

export const deleteNote = async (note: Note): Promise<void> => {
  await ensureDbInitialized();
  
  if (note.mediaPath) {
    try {
      await FileSystem.deleteAsync(note.mediaPath);
    } catch (error) {
      console.error('Error deleting media file:', error);
    }
  }

  try {
    await db.runAsync('DELETE FROM notes WHERE id = ?', [note.id]);
  } catch (error) {
    console.error('Error deleting note:', error);
    throw error;
  }
};

export const getNotes = async (): Promise<Note[]> => {
  await ensureDbInitialized();
  
  try {
    const result = await db.getAllAsync<Note>('SELECT * FROM notes ORDER BY updatedAt DESC');
    return result;
  } catch (error) {
    console.error('Error retrieving notes:', error);
    throw error;
  }
};

export const searchNotes = async (query: string): Promise<Note[]> => {
  await ensureDbInitialized();
  
  const searchTerm = `%${query}%`;
  try {
    const result = await db.getAllAsync<Note>(
      `SELECT * FROM notes
       WHERE title LIKE ? OR content LIKE ?
       ORDER BY updatedAt DESC`,
      [searchTerm, searchTerm]
    );
    return result;
  } catch (error) {
    console.error('Error searching notes:', error);
    throw error;
  }
};

initDatabase().catch(error => {
  console.error('Failed to initialize the database:', error);
});
