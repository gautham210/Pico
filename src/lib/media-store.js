const DB_NAME = 'pico-media-v1';
const STORE = 'photos';

function openDatabase() {
  if (!globalThis.indexedDB) return Promise.reject(new Error('IndexedDB is unavailable in this browser.'));
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Could not open local photo storage.'));
  });
}

async function transaction(mode, operation) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const result = operation(tx.objectStore(STORE));
    tx.oncomplete = () => { db.close(); resolve(result?.result); };
    tx.onerror = tx.onabort = () => { const error = tx.error || new Error('Local photo storage failed.'); db.close(); reject(error); };
  });
}

export const saveLocalPhoto = (id, blob) => transaction('readwrite', store => store.put({ id, blob }));
export const getLocalPhoto = async id => {
  if (!id) return null;
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const request = tx.objectStore(STORE).get(id);
    request.onsuccess = () => resolve(request.result?.blob || null);
    request.onerror = () => reject(request.error || new Error('Could not read the saved photo.'));
    tx.oncomplete = () => db.close();
    tx.onerror = tx.onabort = () => { db.close(); reject(tx.error || new Error('Could not read the saved photo.')); };
  });
};
export const removeLocalPhoto = id => id ? transaction('readwrite', store => store.delete(id)) : Promise.resolve();
