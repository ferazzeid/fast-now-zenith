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
  it("uses auth.getUser without calling admin RPC", async () => {
    let getUserCalled = false;
    let rpcCalled = false;

    // @ts-ignore - override for testing
    supabase.auth.getUser = async () => {
      getUserCalled = true;
      return { data: { user: { id: "123" } }, error: null } as any;
    };

    // @ts-ignore - override for testing
    supabase.rpc = async () => {
      rpcCalled = true;
      return { data: null, error: null } as any;
    };

    const result = await validateDatabaseAuth();

    expect(getUserCalled).toBe(true);
    expect(rpcCalled).toBe(false);
    expect(result.authWorking).toBe(true);
  });
});
