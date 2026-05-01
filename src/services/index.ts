// ============================================================
// Service entrypoint. Swap implementations here when plugging
// a real backend (e.g. Supabase, Node API, etc.).
// ============================================================
import type { API } from "./api";
import { mockApi } from "./mock";

// To switch to a real backend, create a new module that exports
// an `API` and assign it here:
//   import { supabaseApi } from "./supabase";
//   export const api: API = supabaseApi;
export const api: API = mockApi;

export type { API } from "./api";
export * from "./types";
