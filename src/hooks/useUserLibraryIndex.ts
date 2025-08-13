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
      setNameSet(new Set());
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_foods')
        .select('name')
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error fetching user library:', error);
        setNameSet(new Set());
        return;
      }
      
      const next = new Set<string>();
      if (data && data.length > 0) {
        for (const row of data) {
          next.add(normalizeName(row.name));
        }
      }
      setNameSet(next);
    } catch (err) {
      console.error('Exception fetching library:', err);
      setNameSet(new Set());
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchLibrary();
  }, [fetchLibrary]);

  // Clear library when user changes
  useEffect(() => {
    if (!user?.id) {
      setNameSet(new Set());
    }
  }, [user?.id]);

  const isInLibrary = useCallback(
    (name: string) => {
      if (!name || nameSet.size === 0) return false;
      return nameSet.has(normalizeName(name));
    },
    [nameSet]
  );

  const addLocal = useCallback((name: string) => {
    if (!name) return;
    const normalizedName = normalizeName(name);
    setNameSet((prev) => {
      if (prev.has(normalizedName)) {
        return prev;
      }
      const copy = new Set(prev);
      copy.add(normalizedName);
      return copy;
    });
  }, []);

  const refresh = useCallback(async () => {
    await fetchLibrary();
  }, [fetchLibrary]);

  return useMemo(
    () => ({ isInLibrary, refresh, addLocal, loading }),
    [isInLibrary, refresh, addLocal, loading]
  );
};
