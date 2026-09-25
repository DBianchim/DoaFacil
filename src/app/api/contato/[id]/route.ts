import { NextResponse } from "next/server";
import { hasCondoAccess } from "@/lib/condo";
import { formatPhone, linkEmail, linkInstagram, linkPhone, linkWhatsApp, maskEmail, whatsAppMessage } from "@/lib/contact-links";
import { allowRequest, isUuid } from "@/lib/rate-limit";
import type { ContactChannel, ContactResponse } from "@/lib/contact-types";
import { supabaseAdmin } from "@/lib/supabase/server";

const error = (status: number, message: string) => NextResponse.json({ error: message }, { status });

/**
 * "Tenho interesse": única saída dos contatos (regra 5 do CLAUDE.md).
 * Verifica o cookie do condomínio, aplica rate limit, soma 1 em "viram o contato"
 * e devolve os canais já como links prontos.
 */
export async function POST(_req: Request, ctx: RouteContext<"/api/contato/[id]">) {
  if (!(await hasCondoAccess())) return error(401, "Acesso restrito aos moradores.");

  const { id } = await ctx.params;
  if (!isUuid(id)) return error(404, "Anúncio não encontrado.");

  // 30 contatos por hora por visitante: sobra para uso normal, trava robôs.
  if (!(await allowRequest("contato", 30, 60 * 60))) {
    return error(429, "Muitos pedidos de contato em pouco tempo. Tente de novo em alguns minutos.");
  }

  const db = supabaseAdmin();
  const { data: item } = await db
    .from("items")
    .select("title, nickname, block")
    .eq("id", id)
    .maybeSingle();
  if (!item) return error(404, "Este anúncio não está mais no mural.");

  const { data, error: rpcError } = await db.rpc("registrar_interesse", { p_item_id: id });
  if (rpcError) {
    console.error("registrar_interesse:", rpcError.message);
    return error(500, "Não foi possível buscar o contato agora. Tente de novo em instantes.");
  }
  const contact = data?.[0];
  if (!contact) return error(410, "Este item já foi doado ou o anúncio expirou.");

  const channels: ContactChannel[] = [];
  if (contact.whatsapp)
    channels.push({
      kind: "whatsapp",
      href: linkWhatsApp(contact.whatsapp, item.nickname, item.title),
      display: formatPhone(contact.whatsapp),
    });
  if (contact.email)
    channels.push({
      kind: "email",
      href: linkEmail(contact.email, item.nickname, item.title),
      display: maskEmail(contact.email),
    });
  if (contact.phone)
    channels.push({ kind: "phone", href: linkPhone(contact.phone), display: formatPhone(contact.phone) });
  if (contact.instagram)
    channels.push({
      kind: "instagram",
      href: linkInstagram(contact.instagram),
      display: `@${contact.instagram.replace(/^@/, "")}`,
    });

  const body: ContactResponse = {
    nickname: item.nickname,
    title: item.title,
    block: item.block,
    whatsappMessage: contact.whatsapp ? whatsAppMessage(item.nickname, item.title) : null,
    channels,
    interestClicks: contact.interest_clicks,
  };
  return NextResponse.json(body, { headers: { "Cache-Control": "no-store" } });
}
