// Verifica se a migração foi aplicada e se a chave pública não enxerga nada.
// Uso: npm run db:verificar   (lê .env.local)

import { createClient } from "@supabase/supabase-js";

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY } = process.env;
const opts = { auth: { persistSession: false, autoRefreshToken: false } };

let falhas = 0;
const ok = (cond, msg, extra = "") => {
  console.log(`${cond ? "✔" : "✘"} ${msg}${extra ? ` — ${extra}` : ""}`);
  if (!cond) falhas++;
};

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em .env.local.");
  process.exit(1);
}

// 1) Service role: tudo precisa existir e funcionar ----------------------------
console.log("\nServidor (service role)");
const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, opts);

for (const t of ["donors", "items", "item_contacts", "impact_stats", "rate_limits", "photo_cleanup_queue"]) {
  const { count, error } = await admin.from(t).select("*", { count: "exact", head: true });
  ok(!error, `tabela ${t}`, error ? error.message : `${count} linha(s)`);
}

const { data: stats, error: statsErr } = await admin.from("impact_stats").select("donated, contacts").single();
ok(!statsErr && stats, "impact_stats inicializada", statsErr?.message ?? JSON.stringify(stats));

const chave = `verificacao:${Date.now()}`;
const { data: rl1, error: rlErr } = await admin.rpc("consumir_rate_limit", { p_key: chave, p_max: 1, p_window_seconds: 60 });
const { data: rl2 } = await admin.rpc("consumir_rate_limit", { p_key: chave, p_max: 1, p_window_seconds: 60 });
ok(!rlErr && rl1 === true && rl2 === false, "rate limit (1ª passa, 2ª bloqueia)", rlErr?.message ?? `${rl1}, ${rl2}`);
await admin.from("rate_limits").delete().eq("key", chave);

const { data: interesse, error: intErr } = await admin.rpc("registrar_interesse", {
  p_item_id: "00000000-0000-0000-0000-000000000000",
});
ok(!intErr && Array.isArray(interesse) && interesse.length === 0, "registrar_interesse (item inexistente → vazio)", intErr?.message);

const { data: bucket, error: bucketErr } = await admin.storage.getBucket("item-photos");
ok(!bucketErr && bucket && bucket.public === false, "bucket item-photos privado", bucketErr?.message);

const { count: disp } = await admin.from("items").select("*", { count: "exact", head: true }).eq("status", "disponivel");
console.log(`  (${disp ?? 0} itens disponíveis no momento)`);

// 2) Chave pública: nada pode vazar ------------------------------------------
if (!SUPABASE_ANON_KEY) {
  console.log("\n(pulei o teste da chave pública: defina SUPABASE_ANON_KEY para rodá-lo)");
} else {
  console.log("\nNavegador (chave pública anon)");
  const anon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, opts);

  for (const t of ["donors", "items", "item_contacts", "impact_stats", "rate_limits", "photo_cleanup_queue"]) {
    const { data, error } = await anon.from(t).select("*").limit(1);
    ok(error || (Array.isArray(data) && data.length === 0), `não lê ${t}`, error ? error.message : "0 linhas");
  }

  const { error: insErr } = await anon.from("donors").insert({ key_hash: "f".repeat(64) });
  ok(!!insErr, "não grava em donors", insErr?.message ?? "GRAVOU! RLS/privilégios errados");

  const { data: rpcData, error: rpcErr } = await anon.rpc("registrar_interesse", {
    p_item_id: "00000000-0000-0000-0000-000000000000",
  });
  ok(!!rpcErr, "não chama registrar_interesse", rpcErr?.message ?? `respondeu ${JSON.stringify(rpcData)}`);

  const { error: rlAnonErr } = await anon.rpc("consumir_rate_limit", { p_key: "x", p_max: 1, p_window_seconds: 1 });
  ok(!!rlAnonErr, "não chama consumir_rate_limit", rlAnonErr?.message);

  const { data: files, error: stErr } = await anon.storage.from("item-photos").list();
  ok(stErr || (files ?? []).length === 0, "não lista fotos do bucket", stErr?.message ?? "0 arquivos");
}

console.log(falhas ? `\n${falhas} verificação(ões) falharam.` : "\nTudo certo.");
process.exit(falhas ? 1 : 0);
