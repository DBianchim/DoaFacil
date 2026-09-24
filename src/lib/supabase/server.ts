import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import type { Database } from "./types";

/*
 * Cliente com a SERVICE ROLE: ignora RLS e enxerga tudo.
 *
 * - O `import "server-only"` acima faz o build falhar se este arquivo for
 *   importado (direta ou indiretamente) por um componente "use client".
 * - Use só em Server Components, Server Actions e Route Handlers, e sempre
 *   depois de verificar o cookie do condomínio (e a chave do doador, nas
 *   ações de gerenciamento).
 */

let client: SupabaseClient<Database> | undefined;

export function supabaseAdmin(): SupabaseClient<Database> {
  client ??= createClient<Database>(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return client;
}
