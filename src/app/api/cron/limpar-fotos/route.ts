import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { PHOTO_BUCKET, thumbPath } from "@/lib/catalog";
import { supabaseAdmin } from "@/lib/supabase/server";

/*
 * Job diário (vercel.json → crons): apaga do Storage as fotos de anúncios que
 * expiraram ou foram removidos. O gatilho do banco coloca os caminhos em
 * photo_cleanup_queue; o Supabase não deixa apagar arquivos por SQL.
 *
 * A Vercel chama com "Authorization: Bearer <CRON_SECRET>". Esta rota fica
 * fora do código do condomínio (ver matcher do proxy) e só aceita o segredo.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const got = Buffer.from(req.headers.get("authorization") ?? "");
  const want = Buffer.from(`Bearer ${secret}`);
  if (!secret || got.length !== want.length || !timingSafeEqual(got, want)) {
    return NextResponse.json({ error: "não autorizado" }, { status: 401 });
  }

  const db = supabaseAdmin();
  const { data: queue, error } = await db.from("photo_cleanup_queue").select("path").limit(200);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const paths = queue.map((q) => q.path);
  if (paths.length > 0) {
    const { error: stError } = await db.storage.from(PHOTO_BUCKET).remove(paths.flatMap((p) => [p, thumbPath(p)]));
    if (stError) return NextResponse.json({ error: stError.message }, { status: 500 });
    await db.from("photo_cleanup_queue").delete().in("path", paths);
  }

  return NextResponse.json({ removidas: paths.length });
}
