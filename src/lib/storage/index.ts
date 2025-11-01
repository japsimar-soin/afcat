import { LocalStorageAdapter } from "./local";
import { SupabaseStorageAdapter } from "./supabase";
import { StorageAdapter } from "./types";

// Use Supabase if configured, otherwise fall back to local storage
export const storage: StorageAdapter = process.env.SUPABASE_URL 
	? new SupabaseStorageAdapter()
	: new LocalStorageAdapter();

export { LocalStorageAdapter, SupabaseStorageAdapter };
export type { StorageAdapter, StorageResult } from "./types";
