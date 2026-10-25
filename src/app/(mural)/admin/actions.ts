"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  adminSetup,
  endAdminSession,
  hasRecoveryCode,
  isAdmin,
  MIN_PASSWORD_LENGTH,
  passwordMatches,
  recoveryCodeMatches,
  regenerateRecoveryCode,
  setAdminPassword,
  startAdminSession,
} from "@/lib/admin";
import { PHOTO_BUCKET, thumbPath } from "@/lib/catalog";
import { hasCondoAccess } from "@/lib/condo";
import { allowRequest, isUuid } from "@/lib/rate-limit";
import { supabaseAdmin } from "@/lib/supabase/server";

const TOO_MANY = "Muitas tentativas. Aguarde 15 minutos e tente de novo.";
const SAVE_FAILED = "Não foi possível salvar agora. Tente de novo em instantes.";

export type LoginState = { error?: string };

export async function entrarAdmin(_prev: LoginState, fd: FormData): Promise<LoginState> {
  if (!(await hasCondoAccess())) return { error: "Entre primeiro com o código do condomínio." };
  // 5 tentativas a cada 15 minutos por visitante: inviabiliza chutar a senha.
  if (!(await allowRequest("admin-login", 5, 15 * 60))) return { error: TOO_MANY };
  const password = fd.get("password");
  if (typeof password !== "string" || !(await passwordMatches(password))) return { error: "Senha incorreta." };
  await startAdminSession();
  redirect("/admin");
}

/** Resultado das ações de senha. recoveryCode só vem quando um código novo foi gerado. */
export type PasswordState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  recoveryCode?: string;
};

/** Regras da senha nova (compartilhadas por primeiro acesso, troca e recuperação). */
function checkNewPassword(nova: string, confirmacao: string, atual?: string): Record<string, string> {
  const e: Record<string, string> = {};
  if (nova.length < MIN_PASSWORD_LENGTH) e.nova = `Use pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  else if (nova.length > 200) e.nova = "Use no máximo 200 caracteres.";
  else if (atual !== undefined && nova === atual) e.nova = "A senha nova precisa ser diferente da atual.";
  if (!e.nova && nova !== confirmacao) e.confirmacao = "As duas senhas não são iguais.";
  return e;
}

const field = (fd: FormData, name: string) => String(fd.get(name) ?? "");

/** Primeiro acesso: o síndico (que entrou com a ADMIN_PASSWORD) cria a própria senha e recebe o código. */
export async function criarSenhaInicial(_prev: PasswordState, fd: FormData): Promise<PasswordState> {
  if (!(await isAdmin())) return { error: "Sua sessão de síndico expirou. Entre de novo." };
  if ((await adminSetup()) !== "needs-setup") return { error: "A senha própria já foi criada. Use a opção de trocar senha." };

  const fieldErrors = checkNewPassword(field(fd, "nova"), field(fd, "confirmacao"));
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  try {
    const recoveryCode = await setAdminPassword(field(fd, "nova"), { newRecoveryCode: true });
    await startAdminSession();
    return { ok: true, recoveryCode: recoveryCode ?? undefined };
  } catch (e) {
    console.error("criarSenhaInicial:", e instanceof Error ? e.message : e);
    return { error: SAVE_FAILED };
  }
}

/** Troca a senha sabendo a atual. O código de recuperação continua o mesmo. */
export async function trocarSenhaAdmin(_prev: PasswordState, fd: FormData): Promise<PasswordState> {
  if (!(await isAdmin())) return { error: "Sua sessão de síndico expirou. Entre de novo." };
  // Mesmo limite do login: impede usar este formulário para chutar a senha atual.
  if (!(await allowRequest("admin-login", 5, 15 * 60))) return { error: TOO_MANY };

  const atual = field(fd, "atual");
  const fieldErrors = checkNewPassword(field(fd, "nova"), field(fd, "confirmacao"), atual);
  if (!(await passwordMatches(atual))) fieldErrors.atual = "A senha atual não confere.";
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  try {
    // Quem ainda não tinha código (ex.: senha criada pelo script) ganha um agora.
    const recoveryCode = await setAdminPassword(field(fd, "nova"), { newRecoveryCode: !(await hasRecoveryCode()) });
    await startAdminSession(); // a troca invalida as sessões; reabre a de quem trocou
    return { ok: true, recoveryCode: recoveryCode ?? undefined };
  } catch (e) {
    console.error("trocarSenhaAdmin:", e instanceof Error ? e.message : e);
    return { error: SAVE_FAILED };
  }
}

/** Gera um código de recuperação novo (o anterior para de valer). Pede a senha atual. */
export async function novoCodigoRecuperacao(_prev: PasswordState, fd: FormData): Promise<PasswordState> {
  if (!(await isAdmin())) return { error: "Sua sessão de síndico expirou. Entre de novo." };
  if (!(await allowRequest("admin-login", 5, 15 * 60))) return { error: TOO_MANY };
  if (!(await passwordMatches(field(fd, "atual")))) return { fieldErrors: { atual: "A senha atual não confere." } };

  try {
    return { ok: true, recoveryCode: await regenerateRecoveryCode() };
  } catch (e) {
    console.error("novoCodigoRecuperacao:", e instanceof Error ? e.message : e);
    return { error: SAVE_FAILED };
  }
}

/** "Esqueci a senha": código de recuperação + senha nova. O código usado é trocado por outro. */
export async function recuperarSenha(_prev: PasswordState, fd: FormData): Promise<PasswordState> {
  if (!(await hasCondoAccess())) return { error: "Entre primeiro com o código do condomínio." };
  // Limite próprio: 5 tentativas de código a cada 15 minutos por visitante.
  if (!(await allowRequest("admin-recuperar", 5, 15 * 60))) return { error: TOO_MANY };

  const fieldErrors = checkNewPassword(field(fd, "nova"), field(fd, "confirmacao"));
  if (!(await recoveryCodeMatches(field(fd, "codigo")))) {
    fieldErrors.codigo = "Código de recuperação inválido. Confira as letras e os números.";
  }
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  try {
    const recoveryCode = await setAdminPassword(field(fd, "nova"), { newRecoveryCode: true });
    await startAdminSession();
    return { ok: true, recoveryCode: recoveryCode ?? undefined };
  } catch (e) {
    console.error("recuperarSenha:", e instanceof Error ? e.message : e);
    return { error: SAVE_FAILED };
  }
}

export async function sairAdmin() {
  await endAdminSession();
  redirect("/admin");
}

export type AdminResult = { ok: true; message: string } | { ok: false; error: string };

export async function removerAnuncio(itemId: string): Promise<AdminResult> {
  if (!(await isAdmin())) return { ok: false, error: "Sua sessão de síndico expirou. Entre de novo." };
  if (!isUuid(itemId)) return { ok: false, error: "Anúncio não encontrado." };

  const db = supabaseAdmin();
  const { data, error } = await db.from("items").delete().eq("id", itemId).select("photos");
  if (error) return { ok: false, error: "Não foi possível remover agora. Tente de novo." };
  if (!data?.length) return { ok: false, error: "Este anúncio já não existe." };

  const photos = data[0].photos;
  if (photos.length > 0) {
    const { error: stError } = await db.storage.from(PHOTO_BUCKET).remove(photos.flatMap((p) => [p, thumbPath(p)]));
    if (!stError) await db.from("photo_cleanup_queue").delete().in("path", photos);
  }

  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/explorar");
  return { ok: true, message: "Anúncio removido e contatos apagados." };
}

export async function ignorarDenuncias(itemId: string): Promise<AdminResult> {
  if (!(await isAdmin())) return { ok: false, error: "Sua sessão de síndico expirou. Entre de novo." };
  if (!isUuid(itemId)) return { ok: false, error: "Anúncio não encontrado." };

  const { data, error } = await supabaseAdmin().from("items").update({ reports: 0 }).eq("id", itemId).select("id");
  if (error) return { ok: false, error: "Não foi possível atualizar agora. Tente de novo." };
  if (!data?.length) return { ok: false, error: "Este anúncio já não existe." };

  revalidatePath("/admin");
  return { ok: true, message: "Denúncias arquivadas. O anúncio continua no mural." };
}
