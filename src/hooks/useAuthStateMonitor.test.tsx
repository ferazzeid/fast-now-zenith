import { describe, it, expect, vi, beforeEach, afterEach, act } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAuthStateMonitor } from './useAuthStateMonitor';
import { useConnectionStore } from '@/stores/connectionStore';

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() })
}));

vi.mock('@/integrations/supabase/client', () => {
  const getSession = vi.fn().mockResolvedValue({ data: { session: { user: { id: '123' } } } });
  const refreshSession = vi.fn().mockResolvedValue({ data: { session: { user: { id: '123' } } }, error: null });
  const signOut = vi.fn();
  const onAuthStateChange = vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });
  const rpc = vi.fn().mockResolvedValue({ data: null, error: null });
  return {
    supabase: {
      auth: { getSession, refreshSession, signOut, onAuthStateChange },
      rpc
    }
  };
});

import { supabase } from '@/integrations/supabase/client';

describe('useAuthStateMonitor', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    useConnectionStore.setState({ isOnline: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('skips auth validation when offline', async () => {
    useConnectionStore.setState({ isOnline: false });
    const { result } = renderHook(() => useAuthStateMonitor());
    await act(async () => {
      result.current.startMonitoring();
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(30000);
    });

    expect(supabase.rpc).not.toHaveBeenCalled();
    expect(supabase.auth.signOut).not.toHaveBeenCalled();
  });
});
