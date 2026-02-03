import { supabase } from "../../lib/supabaseClient";

export type RundownRow = {
  id: string;
  title: string;
  rundown_date: string | null;
  created_at: string;
};

export async function listRundowns(): Promise<RundownRow[]> {
  const { data, error } = await supabase
    .from("rundowns")
    .select("id,title,rundown_date,created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createRundown(input: { title: string; rundown_date?: string | null }) {
  const { data: userRes } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("rundowns")
    .insert({
      title: input.title,
      rundown_date: input.rundown_date ?? null,
      created_by: userRes.user?.id ?? null,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data;
}
