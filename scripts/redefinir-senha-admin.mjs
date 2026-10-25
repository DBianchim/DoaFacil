// Recuperação da senha do síndico (quando ela foi esquecida).
//
// Uso:
//   npm run admin:senha                       → mostra qual senha está valendo (nada muda)
//   npm run admin:senha -- --voltar-para-env  → apaga a senha trocada pelo painel; volta a
//                                               valer a ADMIN_PASSWORD cadastrada na Vercel
//   npm run admin:senha -- --gerar            → cria uma senha nova aleatória, grava só o hash
//                                               e mostra a senha UMA vez neste terminal
//
// Em todos os casos as sessões abertas do painel deixam de valer.

import { randomBytes, scryptSync } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em .env.local.");
  process.exit(1);
}
const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

// Mesmo formato de src/lib/password-hash.ts
function hashPassword(password) {
  const N = 16384, r = 8, p = 1;
  const salt = randomBytes(16);
  const key = scryptSync(password, salt, 32, { N, r, p });
  return `scrypt$${N}$${r}$${p}$${salt.toString("base64url")}$${key.toString("base64url")}`;
}

/** Senha legível: 4 grupos de 5 caracteres sem letras ambíguas (ex.: K7QPM-2XRTA-...). */
function generatePassword() {
  const A = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = randomBytes(20);
  const chars = Array.from(bytes, (b) => A[b % A.length]).join("");
  return chars.match(/.{5}/g).join("-");
}

const { data, error } = await db.from("admin_config").select("updated_at").eq("id", true).maybeSingle();
if (error) {
  console.error(`Não consegui ler admin_config: ${error.message}`);
  console.error("Confira se a migração 20261025000000_admin_password.sql foi aplicada no Supabase.");
  process.exit(1);
}

if (process.argv.includes("--voltar-para-env")) {
  const { error: delError } = await db.from("admin_config").delete().eq("id", true);
  if (delError) throw new Error(delError.message);
  console.log("\nPronto. A senha trocada pelo painel foi apagada.");
  console.log("Agora vale a ADMIN_PASSWORD cadastrada na Vercel (Settings › Environment Variables).\n");
} else if (process.argv.includes("--gerar")) {
  const password = generatePassword();
  const { error: upError } = await db
    .from("admin_config")
    .upsert({ id: true, password_hash: hashPassword(password), updated_at: new Date().toISOString() });
  if (upError) throw new Error(upError.message);
  console.log("\nSenha nova do síndico (anote agora — ela não fica salva em lugar nenhum):\n");
  console.log(`    ${password}\n`);
  console.log("Entregue ao síndico em conversa privada e peça para ele trocar pelo painel /admin.\n");
} else {
  console.log(
    data
      ? `\nEstá valendo a senha trocada pelo painel em ${new Date(data.updated_at).toLocaleString("pt-BR")}.`
      : "\nEstá valendo a ADMIN_PASSWORD cadastrada na Vercel (ninguém trocou a senha pelo painel).",
  );
  console.log("Opções: --voltar-para-env  ou  --gerar  (veja o topo deste arquivo).\n");
}
