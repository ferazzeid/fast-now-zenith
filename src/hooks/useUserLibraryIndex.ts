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
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_foods')
        .select('name')
        .eq('user_id', user.id);
      if (!error && data) {
        const next = new Set<string>();
        for (const row of data) next.add(normalizeName(row.name));
        setNameSet(next);
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchLibrary();
  }, [fetchLibrary]);

  const isInLibrary = useCallback(
    (name: string) => nameSet.has(normalizeName(name)),
    [nameSet]
  );

  const addLocal = useCallback((name: string) => {
    setNameSet((prev) => {
      const copy = new Set(prev);
      copy.add(normalizeName(name));
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
