export interface Session {
  id?: number;
  timestamp: number;
  videoId: string;
  videoTitle: string;
  loopStart: number;
  loopEnd: number;
  playbackRate: number;
  note: string;
}

class StorageManager {
  private readonly dbName = 'youtube-practice-db';
  private readonly storeName = 'practice-sessions';
  private readonly dbVersion = 1;
  private readonly fallbackKey = 'youtube-practice-sessions';

  // Open IndexedDB connection
  private async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        reject(new Error('IndexedDB not supported'));
        return;
      }

      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      // Create object store on first run or version upgrade
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { 
            keyPath: 'id', 
            autoIncrement: true 
          });
        }
      };
    });
  }

  // Save a new practice state
  async saveSession(session: Omit<Session, 'id'>): Promise<void> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      await new Promise<void>((resolve, reject) => {
        const request = store.add(session);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      // Fallback to localStorage if IndexedDB fails
      const states = this.getSessionsFromLocalStorage();
      states.push({
        ...session,
        id: Date.now() // Use timestamp as ID for localStorage
      });
      localStorage.setItem(this.fallbackKey, JSON.stringify(states));
    }
  }

  // Remove a practice session by ID
  async deleteSession(id: number): Promise<void> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);

      await new Promise<void>((resolve, reject) => {
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      // Fallback to localStorage if IndexedDB fails
      const states = this.getSessionsFromLocalStorage();
      const filteredStates = states.filter(session => session.id !== id);
      localStorage.setItem(this.fallbackKey, JSON.stringify(filteredStates));
    }
  }

  // Get all saved states from localStorage (fallback method)
  private getSessionsFromLocalStorage(): Session[] {
    try {
      const states = localStorage.getItem(this.fallbackKey);
      return states ? JSON.parse(states) : [];
    } catch {
      return [];
    }
  }

  // Get all saved states
  async getAllSessions(): Promise<Session[]> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      
      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      // Fallback to localStorage
      return this.getSessionsFromLocalStorage();
    }
  }
}

export const storageManager = new StorageManager();
