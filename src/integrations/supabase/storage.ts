import type { SupportedStorage } from '@supabase/auth-js';
import { Capacitor } from '@capacitor/core';

// Obtain the Preferences plugin if it exists (in native runtime)
// and fall back to localStorage for web or testing environments.
const preferences = Capacitor.getPlugin<any>('Preferences');

const getFromPreferences = async (key: string): Promise<string | null> => {
  if (preferences?.get) {
    const result = await preferences.get({ key });
    return result.value ?? null;
  }
  return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
};

const setToPreferences = async (key: string, value: string): Promise<void> => {
  if (preferences?.set) {
    await preferences.set({ key, value });
    return;
  }
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(key, value);
  }
};

const removeFromPreferences = async (key: string): Promise<void> => {
  if (preferences?.remove) {
    await preferences.remove({ key });
    return;
  }
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(key);
  }
};

export const preferencesStorage: SupportedStorage = {
  getItem: getFromPreferences,
  setItem: setToPreferences,
  removeItem: removeFromPreferences,
};

// Ready promise in case the Preferences plugin requires any async setup.
// Currently resolves immediately but allows callers to await initialization.
export const storageReady = Promise.resolve();
