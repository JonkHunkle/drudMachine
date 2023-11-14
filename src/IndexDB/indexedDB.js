import { openDB } from 'idb';

export const openDatabase = async (dbName, version, upgradeCallback) => {
  return openDB(dbName, version, { upgrade: upgradeCallback });
};

export const saveToDB = async (db, storeName, data) => {
  const transaction = db.transaction(storeName, 'readwrite');
  const objectStore = transaction.objectStore(storeName);
  return objectStore.add(data);
};

export const getFileFromDB = async (db, storeName, key) => {
  const transaction = await db.transaction(storeName, 'readonly');
  const objectStore = await transaction.objectStore(storeName);
  return objectStore.get(key);
};

export const getAllFromDB = async (db, storeName) => {
  const transaction = db.transaction(storeName, 'readonly');
  const objectStore = transaction.objectStore(storeName);
  return objectStore.getAll();
};
export const deleteDatabase = async (dbName)=>{
  indexedDB.deleteDatabase(dbName)
}