/**
 * IndexedDB wrapper for offline chapter storage.
 * Stores downloaded chapter HTML and book metadata.
 */

const DB_NAME = 'readmigo-offline';
const DB_VERSION = 1;
const CHAPTERS_STORE = 'chapters';
const METADATA_STORE = 'bookMetadata';

interface ChapterRecord {
  key: string; // `${bookId}:${chapterId}`
  bookId: string;
  chapterId: string;
  html: string;
  sizeBytes: number;
  downloadedAt: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(CHAPTERS_STORE)) {
        const store = db.createObjectStore(CHAPTERS_STORE, { keyPath: 'key' });
        store.createIndex('bookId', 'bookId', { unique: false });
      }
      if (!db.objectStoreNames.contains(METADATA_STORE)) {
        db.createObjectStore(METADATA_STORE, { keyPath: 'bookId' });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveChapter(
  bookId: string,
  chapterId: string,
  html: string,
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CHAPTERS_STORE, 'readwrite');
    const record: ChapterRecord = {
      key: `${bookId}:${chapterId}`,
      bookId,
      chapterId,
      html,
      sizeBytes: new Blob([html]).size,
      downloadedAt: Date.now(),
    };
    const req = tx.objectStore(CHAPTERS_STORE).put(record);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    db.close();
  });
}

export async function getChapter(
  bookId: string,
  chapterId: string,
): Promise<string | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CHAPTERS_STORE, 'readonly');
    const req = tx.objectStore(CHAPTERS_STORE).get(`${bookId}:${chapterId}`);
    req.onsuccess = () => {
      const record = req.result as ChapterRecord | undefined;
      resolve(record?.html ?? null);
    };
    req.onerror = () => reject(req.error);
    db.close();
  });
}

export async function hasChapter(bookId: string, chapterId: string): Promise<boolean> {
  const html = await getChapter(bookId, chapterId);
  return html !== null;
}

export async function getBookChapterCount(bookId: string): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CHAPTERS_STORE, 'readonly');
    const index = tx.objectStore(CHAPTERS_STORE).index('bookId');
    const req = index.count(IDBKeyRange.only(bookId));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    db.close();
  });
}

export async function getBookChapterIds(bookId: string): Promise<string[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CHAPTERS_STORE, 'readonly');
    const index = tx.objectStore(CHAPTERS_STORE).index('bookId');
    const req = index.getAll(IDBKeyRange.only(bookId));
    req.onsuccess = () => {
      const records = req.result as ChapterRecord[];
      resolve(records.map((r) => r.chapterId));
    };
    req.onerror = () => reject(req.error);
    db.close();
  });
}

export async function getBookStorageSize(bookId: string): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CHAPTERS_STORE, 'readonly');
    const index = tx.objectStore(CHAPTERS_STORE).index('bookId');
    const req = index.getAll(IDBKeyRange.only(bookId));
    req.onsuccess = () => {
      const records = req.result as ChapterRecord[];
      resolve(records.reduce((sum, r) => sum + r.sizeBytes, 0));
    };
    req.onerror = () => reject(req.error);
    db.close();
  });
}

export async function deleteBookChapters(bookId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CHAPTERS_STORE, 'readwrite');
    const index = tx.objectStore(CHAPTERS_STORE).index('bookId');
    const req = index.getAllKeys(IDBKeyRange.only(bookId));
    req.onsuccess = () => {
      const keys = req.result;
      const store = tx.objectStore(CHAPTERS_STORE);
      keys.forEach((key) => store.delete(key));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    };
    req.onerror = () => reject(req.error);
    db.close();
  });
}

export async function clearAllChapters(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CHAPTERS_STORE, 'readwrite');
    const req = tx.objectStore(CHAPTERS_STORE).clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    db.close();
  });
}
