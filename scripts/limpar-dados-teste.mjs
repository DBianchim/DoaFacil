// Apaga os dados de teste para entregar o mural "zerado" ao condomínio.
//
// Uso:
//   npm run db:limpar-testes               → só MOSTRA o que seria apagado (nada muda)
//   npm run db:limpar-testes -- --confirmar  → apaga de verdade
//
// O que é apagado (no Supabase de .env.local):
//   - todos os anúncios, com contatos (cascade) e fotos/miniaturas do Storage
//   - todos os doadores (as chaves/links de doador antigos deixam de funcionar)
//   - contadores de impacto voltam a 0 (itens doados, contatos feitos)
//   - rate limits e fila de limpeza de fotos
// O que NÃO muda: tabelas, proteções, bucket, tarefas agendadas e o código do condomínio.

import { createClient } from "@supabase/supabase-js";

const BUCKET = "item-photos";
const confirmar = process.argv.includes("--confirmar");
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em .env.local.");
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/** Todos os arquivos do bucket (as fotos ficam em u/<pasta>/<arquivo>). */
async function listarFotos() {
  const arquivos = [];
  const { data: pastas, error } = await db.storage.from(BUCKET).list("u", { limit: 1000 });
  if (error) throw new Error(`Storage: ${error.message}`);
  for (const pasta of pastas ?? []) {
    const { data: files } = await db.storage.from(BUCKET).list(`u/${pasta.name}`, { limit: 1000 });
    for (const f of files ?? []) arquivos.push(`u/${pasta.name}/${f.name}`);
  }
  return arquivos;
}

const contar = async (tabela) => {
  const { count, error } = await db.from(tabela).select("*", { count: "exact", head: true });
  if (error) throw new Error(`${tabela}: ${error.message}`);
  return count ?? 0;
};

// ---- Levantamento -----------------------------------------------------------
const { data: anuncios, error: errItems } = await db
  .from("items")
  .select("id, title, nickname, status, created_at")
  .order("created_at");
if (errItems) throw new Error(errItems.message);

const fotos = await listarFotos();
const { data: impacto } = await db.from("impact_stats").select("donated, contacts").single();
const resumo = {
  anuncios: anuncios.length,
  contatos: await contar("item_contacts"),
  doadores: await contar("donors"),
  fotos: fotos.length,
  rateLimits: await contar("rate_limits"),
  filaFotos: await contar("photo_cleanup_queue"),
};

console.log(`\nBanco: ${new URL(SUPABASE_URL).host}`);
console.log(confirmar ? "Modo: APAGAR DE VERDADE\n" : "Modo: só mostrar (nada será apagado)\n");
for (const a of anuncios) {
  console.log(`  • ${a.created_at.slice(0, 10)}  ${a.status.padEnd(10)}  ${a.nickname.padEnd(14)}  ${a.title}`);
}
console.log(`
  Anúncios ............ ${resumo.anuncios}
  Contatos ............ ${resumo.contatos}
  Doadores (chaves) ... ${resumo.doadores}
  Arquivos de foto .... ${resumo.fotos}
  Rate limits ......... ${resumo.rateLimits}
  Fila de fotos ....... ${resumo.filaFotos}
  Impacto ............. ${impacto?.donated ?? "?"} doados · ${impacto?.contacts ?? "?"} contatos → 0 · 0`);

if (!confirmar) {
  console.log("\nNada foi apagado. Para apagar de verdade:\n  npm run db:limpar-testes -- --confirmar\n");
  process.exit(0);
}

// ---- Limpeza ----------------------------------------------------------------
// O Supabase bloqueia DELETE/UPDATE sem filtro (pg_safeupdate): cada comando tem um filtro
// que pega todas as linhas.
const passo = async (nome, promessa) => {
  const { error } = await promessa;
  if (error) throw new Error(`${nome}: ${error.message}`);
  console.log(`  ✔ ${nome}`);
};

console.log("");
// Fotos primeiro: depois de apagar os anúncios, os caminhos só ficariam na fila.
for (let i = 0; i < fotos.length; i += 100) {
  await passo(`fotos ${i + 1}–${Math.min(i + 100, fotos.length)}`, db.storage.from(BUCKET).remove(fotos.slice(i, i + 100)));
}
await passo("anúncios e contatos", db.from("items").delete().not("id", "is", null));
await passo("doadores", db.from("donors").delete().not("id", "is", null));
await passo("fila de fotos", db.from("photo_cleanup_queue").delete().not("path", "is", null));
await passo("rate limits", db.from("rate_limits").delete().not("key", "is", null));
await passo("contadores de impacto", db.from("impact_stats").update({ donated: 0, contacts: 0 }).eq("id", true));

// ---- Conferência ------------------------------------------------------------
const depois = {
  anuncios: await contar("items"),
  doadores: await contar("donors"),
  fotos: (await listarFotos()).length,
};
const { data: impactoDepois } = await db.from("impact_stats").select("donated, contacts").single();
const limpo = depois.anuncios === 0 && depois.doadores === 0 && depois.fotos === 0 && impactoDepois?.donated === 0;
console.log(
  `\n${limpo ? "Pronto: mural zerado." : "Atenção: sobrou algo."} ` +
    `Anúncios ${depois.anuncios} · doadores ${depois.doadores} · fotos ${depois.fotos} · ` +
    `impacto ${impactoDepois?.donated}/${impactoDepois?.contacts}\n`,
);
process.exit(limpo ? 0 : 1);
