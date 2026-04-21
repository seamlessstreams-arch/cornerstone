import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import type { FoundationRow, Phase1TableName } from "@/lib/supabase/database.types";

export type TypedSupabaseClient = SupabaseClient;

export interface DbResult<T> {
  data: T | null;
  error: PostgrestError | null;
}

export async function selectById(
  client: TypedSupabaseClient,
  table: Phase1TableName,
  id: string
): Promise<DbResult<FoundationRow>> {
  const { data, error } = await client.from(table).select("*").filter("id", "eq", id).maybeSingle();
  return { data: data as FoundationRow | null, error };
}

export async function insertRow(
  client: TypedSupabaseClient,
  table: Phase1TableName,
  payload: Partial<FoundationRow>
): Promise<DbResult<FoundationRow>> {
  const { data, error } = await client.from(table).insert(payload).select("*").single();
  return { data: data as FoundationRow | null, error };
}

export async function updateRow(
  client: TypedSupabaseClient,
  table: Phase1TableName,
  id: string,
  payload: Partial<FoundationRow>
): Promise<DbResult<FoundationRow>> {
  const { data, error } = await client.from(table).update(payload).filter("id", "eq", id).select("*").single();
  return { data: data as FoundationRow | null, error };
}
