import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderToString } from 'react-dom/server';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { useAuthCacheManager } from './useAuthCacheManager';

// Enhanced localStorage polyfill that exposes keys for Object.keys
class LocalStorageMock {
  private store: Record<string, string>;
  constructor() {
    this.store = {};
  }
  getItem(key: string) {
    return Object.prototype.hasOwnProperty.call(this.store, key) ? this.store[key] : null;
  }
  setItem(key: string, value: string) {
    this.store[key] = value;
    (this as any)[key] = value;
  }
  removeItem(key: string) {
    delete this.store[key];
    delete (this as any)[key];
  }
  clear() {
    Object.keys(this.store).forEach(key => this.removeItem(key));
  }
  key(index: number) {
    return Object.keys(this.store)[index] ?? null;
  }
}

(globalThis as any).localStorage = new LocalStorageMock();
(globalThis as any).window = { localStorage: (globalThis as any).localStorage };

test('clearAllAuthCaches removes query data and persisted storage', () => {
  const queryClient = new QueryClient();
  queryClient.setQueryData(['example'], { foo: 'bar' });
  localStorage.setItem('REACT_QUERY_OFFLINE_CACHE', 'persisted');
  localStorage.setItem('cache_profile_test', 'data');

  let manager: ReturnType<typeof useAuthCacheManager> | undefined;
  function TestComponent() {
    manager = useAuthCacheManager();
    return null;
  }

  renderToString(
    <QueryClientProvider client={queryClient}>
      <TestComponent />
    </QueryClientProvider>
  );

  assert.equal(queryClient.getQueryCache().getAll().length, 1);

  manager!.clearAllAuthCaches();

  assert.equal(queryClient.getQueryCache().getAll().length, 0);
  assert.equal(localStorage.getItem('REACT_QUERY_OFFLINE_CACHE'), null);
  assert.equal(localStorage.getItem('cache_profile_test'), null);
});
