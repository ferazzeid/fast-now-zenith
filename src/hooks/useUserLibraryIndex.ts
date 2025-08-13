import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type LibraryIndex = {
  isInLibrary: (name: string) => boolean;
  refresh: () => Promise<void>;
  addLocal: (name: string) => void;
  loading: boolean;
};

const normalizeName = (name: string) =>
  name?.trim().toLowerCase().replace(/\s+/g, ' ') || '';

export const useUserLibraryIndex = (): LibraryIndex => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [nameSet, setNameSet] = useState<Set<string>>(new Set());

  const fetchLibrary = useCallback(async () => {
    if (!user?.id) {
      console.log('🗂️ No user ID, clearing library');
      setNameSet(new Set());
      return;
    }
    setLoading(true);
    console.log('🗂️ Fetching library for user:', user.id);
    try {
      const { data, error } = await supabase
        .from('user_foods')
        .select('name')
        .eq('user_id', user.id);
      
      if (error) {
        console.error('🗂️ Error fetching library:', error);
        setNameSet(new Set()); // Clear on error
        return;
      }
      
      if (data) {
        const next = new Set<string>();
        console.log('🗂️ Raw library data:', data);
        for (const row of data) {
          const normalized = normalizeName(row.name);
          next.add(normalized);
          console.log('🗂️ Added to library:', row.name, '→', normalized);
        }
        console.log('🗂️ Final library set size:', next.size, 'items:', Array.from(next));
        setNameSet(next);
      } else {
        console.log('🗂️ No library data returned');
        setNameSet(new Set());
      }
    } catch (err) {
      console.error('🗂️ Exception fetching library:', err);
      setNameSet(new Set());
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchLibrary();
  }, [fetchLibrary]);

  // Clear library when user changes/logs out
  useEffect(() => {
    if (!user?.id) {
      setNameSet(new Set());
    }
  }, [user?.id]);

  const isInLibrary = useCallback(
    (name: string) => {
      const normalized = normalizeName(name);
      const result = nameSet.has(normalized);
      console.log('🔍 Checking if in library:', name, '→', normalized, '→', result, 'Library size:', nameSet.size);
      if (nameSet.size <= 5) { // Only log full set if small
        console.log('🔍 Current library set:', Array.from(nameSet));
      }
      return result;
    },
    [nameSet]
  );

  const addLocal = useCallback((name: string) => {
    const normalizedName = normalizeName(name);
    console.log('➕ Adding to local library:', name, '→', normalizedName);
    setNameSet((prev) => {
      if (prev.has(normalizedName)) {
        console.log('➕ Already in library, skipping');
        return prev;
      }
      const copy = new Set(prev);
      copy.add(normalizedName);
      console.log('➕ Added to library, new size:', copy.size);
      return copy;
    });
  }, []);

  const refresh = useCallback(async () => {
    console.log('🔄 Refreshing library');
    await fetchLibrary();
  }, [fetchLibrary]);

  return useMemo(
    () => ({ isInLibrary, refresh, addLocal, loading }),
    [isInLibrary, refresh, addLocal, loading]
  );
};
