// imageDB.js — IndexedDB-based persistent image storage
// Photos stored separately from Zustand so they survive refresh and heavy storage limits.

const DB_NAME = "GirviPhotosDB";
const STORE_NAME = "photos";
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME); // key = recordId_type e.g. "42_customer"
      }
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

/** Save a base64 image string. key format: "{recordId}_{type}" where type = "customer"|"item" */
export async function saveImage(recordId, type, dataUrl) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).put(dataUrl, `${recordId}_${type}`);
      tx.oncomplete = () => resolve(true);
      tx.onerror = (e) => reject(e.target.error);
    });
  } catch (err) {
    console.error("imageDB.saveImage error:", err);
    return false;
  }
}

/** Get a base64 image string. Returns null if not found. */
export async function getImage(recordId, type) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const req = tx.objectStore(STORE_NAME).get(`${recordId}_${type}`);
      req.onsuccess = (e) => resolve(e.target.result || null);
      req.onerror = (e) => reject(e.target.error);
    });
  } catch (err) {
    console.error("imageDB.getImage error:", err);
    return null;
  }
}

/** Delete both photos for a record */
export async function deleteImages(recordId) {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).delete(`${recordId}_customer`);
      tx.objectStore(STORE_NAME).delete(`${recordId}_item`);
      tx.oncomplete = () => resolve(true);
    });
  } catch (err) {
    console.error("imageDB.deleteImages error:", err);
    return false;
  }
}

/** Load all images for a list of record IDs. Returns { [id]: { customer, item } } */
export async function loadAllImages(recordIds) {
  const result = {};
  for (const id of recordIds) {
    const customer = await getImage(id, "customer");
    const item = await getImage(id, "item");
    result[id] = { customer, item };
  }
  return result;
}
