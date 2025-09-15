import { Filesystem, Directory } from '@capacitor/filesystem';

// Detect if we're running in Capacitor (native mobile)
const isNative = typeof window !== 'undefined' && !!(window as any).Capacitor;

interface LocalImageInfo {
  id: string;
  timestamp: number;
  fileName: string;
}

// Convert blob to base64 string
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix to get just the base64 data
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Convert base64 to blob for display
const base64ToBlob = (base64: string, mimeType: string = 'image/jpeg'): Blob => {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
};

// Save image locally and return local image ID
export const saveImageLocally = async (imageBlob: Blob): Promise<string> => {
  const imageId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    if (isNative) {
      // Use Capacitor Filesystem for native mobile
      const base64Data = await blobToBase64(imageBlob);
      const fileName = `${imageId}.jpg`;
      
      await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Data
      });
      
      console.log('Image saved to native filesystem:', fileName);
      return imageId;
    } else {
      // Use IndexedDB for web/PWA
      await saveToIndexedDB(imageId, imageBlob);
      console.log('Image saved to IndexedDB:', imageId);
      return imageId;
    }
  } catch (error) {
    console.error('Error saving image locally:', error);
    throw new Error('Failed to save image locally');
  }
};

// Get image blob from local storage
export const getLocalImage = async (imageId: string): Promise<Blob | null> => {
  try {
    if (isNative) {
      // Read from Capacitor Filesystem
      const fileName = `${imageId}.jpg`;
      
      const fileResult = await Filesystem.readFile({
        path: fileName,
        directory: Directory.Data
      });
      
      if (typeof fileResult.data === 'string') {
        return base64ToBlob(fileResult.data);
      }
      return null;
    } else {
      // Read from IndexedDB
      return await getFromIndexedDB(imageId);
    }
  } catch (error) {
    console.error('Error getting local image:', error);
    return null;
  }
};

// Get image URL for display (creates blob URL)
export const getLocalImageUrl = async (imageId: string): Promise<string | null> => {
  const blob = await getLocalImage(imageId);
  if (blob) {
    return URL.createObjectURL(blob);
  }
  return null;
};

// Delete local image
export const deleteLocalImage = async (imageId: string): Promise<boolean> => {
  try {
    if (isNative) {
      const fileName = `${imageId}.jpg`;
      await Filesystem.deleteFile({
        path: fileName,
        directory: Directory.Data
      });
    } else {
      await deleteFromIndexedDB(imageId);
    }
    console.log('Image deleted:', imageId);
    return true;
  } catch (error) {
    console.error('Error deleting local image:', error);
    return false;
  }
};

// IndexedDB operations for web
const DB_NAME = 'FoodImages';
const DB_VERSION = 1;
const STORE_NAME = 'images';

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

const saveToIndexedDB = async (imageId: string, blob: Blob): Promise<void> => {
  const db = await openDB();
  const transaction = db.transaction([STORE_NAME], 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  
  await new Promise<void>((resolve, reject) => {
    const request = store.put({
      id: imageId,
      blob: blob,
      timestamp: Date.now()
    });
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
  
  db.close();
};

const getFromIndexedDB = async (imageId: string): Promise<Blob | null> => {
  const db = await openDB();
  const transaction = db.transaction([STORE_NAME], 'readonly');
  const store = transaction.objectStore(STORE_NAME);
  
  const result = await new Promise<any>((resolve, reject) => {
    const request = store.get(imageId);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  
  db.close();
  return result ? result.blob : null;
};

const deleteFromIndexedDB = async (imageId: string): Promise<void> => {
  const db = await openDB();
  const transaction = db.transaction([STORE_NAME], 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  
  await new Promise<void>((resolve, reject) => {
    const request = store.delete(imageId);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
  
  db.close();
};

// Clean up old images (optional utility)
export const cleanupOldImages = async (maxAgeMs: number = 30 * 24 * 60 * 60 * 1000): Promise<void> => {
  const cutoffTime = Date.now() - maxAgeMs;
  
  if (!isNative) {
    // Clean IndexedDB
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    const request = store.openCursor();
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        if (cursor.value.timestamp < cutoffTime) {
          cursor.delete();
        }
        cursor.continue();
      }
    };
    
    db.close();
  }
  // For native, cleanup would need to enumerate files which is more complex
};