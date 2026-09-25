import { NextResponse } from "next/server";
import { hasCondoAccess } from "@/lib/condo";
import { allowRequest, isUuid } from "@/lib/rate-limit";
import { supabaseAdmin } from "@/lib/supabase/server";

const error = (status: number, message: string) => NextResponse.json({ error: message }, { status });

/** "Denunciar anúncio": soma 1 em items.reports para o síndico revisar em /admin. */
export async function POST(_req: Request, ctx: RouteContext<"/api/denunciar/[id]">) {
  if (!(await hasCondoAccess())) return error(401, "Acesso restrito aos moradores.");

  const { id } = await ctx.params;
  if (!isUuid(id)) return error(404, "Anúncio não encontrado.");

  // Uma denúncia por anúncio por visitante (30 dias) e no máximo 10 por dia.
  const [perItem, perDay] = await Promise.all([
    allowRequest("denuncia", 1, 60 * 60 * 24 * 30, id),
    allowRequest("denuncia-dia", 10, 60 * 60 * 24),
  ]);
  if (!perItem) return NextResponse.json({ ok: true, repeated: true });
  if (!perDay) return error(429, "Você já enviou muitas denúncias hoje. Se for urgente, fale com o síndico.");

  const db = supabaseAdmin();
  const { data: item } = await db.from("items").select("reports").eq("id", id).maybeSingle();
  if (!item) return error(404, "Este anúncio não está mais no mural.");

  // Contador simples: uma corrida rara entre duas denúncias simultâneas só perde +1.
  const { error: updError } = await db.from("items").update({ reports: item.reports + 1 }).eq("id", id);
  if (updError) return error(500, "Não foi possível registrar a denúncia agora. Tente de novo.");

  return NextResponse.json({ ok: true });
}
