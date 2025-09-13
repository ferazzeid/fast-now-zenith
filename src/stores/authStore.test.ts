import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from './authStore';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signOut: vi.fn().mockResolvedValue({ error: new Error('offline') }),
    },
  },
}));

describe('authStore signOut', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: { id: '123' } as any,
      session: { user: { id: '123' } } as any,
    });
  });

  it('clears state even when sign out fails', async () => {
    const result = await useAuthStore.getState().signOut();

    expect(result.error).toBeDefined();
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().session).toBeNull();
  });
});

