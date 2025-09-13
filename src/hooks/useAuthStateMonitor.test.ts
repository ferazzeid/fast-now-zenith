import { describe, it, expect } from "bun:test";

// Minimal localStorage mock for Supabase client
// @ts-ignore
globalThis.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
};

const { validateDatabaseAuth } = await import("./useAuthStateMonitor");
const { supabase } = await import("../integrations/supabase/client");

describe("validateDatabaseAuth", () => {
  it("pings database with test_auth_uid to verify auth context", async () => {
    let getUserCalled = false;
    let rpcCalled = false;
    let rpcName: string | null = null;

    // @ts-ignore - override for testing
    supabase.auth.getUser = async () => {
      getUserCalled = true;
      return { data: { user: { id: "123" } }, error: null } as any;
    };

    // @ts-ignore - override for testing
    supabase.rpc = async (fn: string) => {
      rpcCalled = true;
      rpcName = fn;
      return { data: "123", error: null } as any;
    };

    const result = await validateDatabaseAuth();

    expect(getUserCalled).toBe(true);
    expect(rpcCalled).toBe(true);
    expect(rpcName).toBe('test_auth_uid');
    expect(result.authWorking).toBe(true);
  });
});
