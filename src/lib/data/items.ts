import "server-only";

import { requireCondoAccess } from "@/lib/condo";
import { CATEGORIES, PHOTO_BUCKET, thumbPath, type Category, type Condition, type Status } from "@/lib/catalog";
import { isUuid } from "@/lib/rate-limit";
import { supabaseAdmin } from "@/lib/supabase/server";

/** O que os cards precisam — nunca inclui contato nem dados do doador. */
export type ItemCardData = {
  id: string;
  title: string;
  description: string | null;
  category: Category;
  condition: Condition;
  status: Status;
  block: string | null;
  createdAt: string;
  photoUrl: string | null;
};

export type SortOption = "recentes" | "antigos" | "nome";
export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "recentes", label: "Mais recentes" },
  { value: "antigos", label: "Mais antigos" },
  { value: "nome", label: "Nome (A–Z)" },
];

export type ItemFilters = {
  q?: string;
  category?: Category;
  condition?: Condition;
  status?: Status;
  sort?: SortOption;
  page?: number;
};

export const PAGE_SIZE = 12;

const CARD_COLUMNS = "id, title, description, category, condition, status, block, created_at, photos";

type CardRow = {
  id: string;
  title: string;
  description: string | null;
  category: Category;
  condition: Condition;
  status: Status;
  block: string | null;
  created_at: string;
  photos: string[];
};

/** Mesma normalização da coluna search_text: minúsculas e sem acento. */
function normalizeSearch(q: string) {
  return q
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim()
    .slice(0, 80);
}

/** Escapa curingas do LIKE para a busca ser literal. */
const escapeLike = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

/** URLs assinadas (1h) para vários caminhos do Storage, numa só chamada. */
async function signPaths(paths: string[]): Promise<Map<string, string>> {
  const urls = new Map<string, string>();
  if (paths.length === 0) return urls;
  const { data } = await supabaseAdmin().storage.from(PHOTO_BUCKET).createSignedUrls(paths, 60 * 60);
  for (const s of data ?? []) if (s.path && s.signedUrl && !s.error) urls.set(s.path, s.signedUrl);
  return urls;
}

/** Cards usam a miniatura da primeira foto. */
async function withCoverUrls(rows: CardRow[]): Promise<ItemCardData[]> {
  const urls = await signPaths(rows.filter((r) => r.photos[0]).map((r) => thumbPath(r.photos[0])));
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    category: r.category,
    condition: r.condition,
    status: r.status,
    block: r.block,
    createdAt: r.created_at,
    photoUrl: r.photos[0] ? (urls.get(thumbPath(r.photos[0])) ?? null) : null,
  }));
}

export async function listItems(filters: ItemFilters) {
  await requireCondoAccess();

  const page = Math.max(1, filters.page ?? 1);
  const from = (page - 1) * PAGE_SIZE;

  let query = supabaseAdmin()
    .from("items")
    .select(CARD_COLUMNS, { count: "exact" })
    .gt("expires_at", new Date().toISOString());

  const q = filters.q ? normalizeSearch(filters.q) : "";
  if (q) {
    // "moveis" também encontra os itens da categoria Móveis, mesmo sem a palavra no título.
    const cats = q.length >= 3 ? CATEGORIES.filter((c) => normalizeSearch(c.label).includes(q)).map((c) => c.value) : [];
    const pattern = `%${escapeLike(q)}%`;
    if (cats.length > 0) {
      // Valor entre aspas para vírgulas/parênteses digitados não quebrarem a sintaxe do filtro.
      const quoted = `"${pattern.replace(/["\\]/g, (c) => `\\${c}`)}"`;
      query = query.or(`search_text.ilike.${quoted},category.in.(${cats.join(",")})`);
    } else {
      query = query.ilike("search_text", pattern);
    }
  }
  if (filters.category) query = query.eq("category", filters.category);
  if (filters.condition) query = query.eq("condition", filters.condition);
  if (filters.status) query = query.eq("status", filters.status);

  switch (filters.sort) {
    case "antigos":
      query = query.order("created_at", { ascending: true });
      break;
    case "nome":
      query = query.order("title", { ascending: true }).order("created_at", { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const { data, count, error } = await query.range(from, from + PAGE_SIZE - 1);
  if (error) {
    // Página além do fim (ex.: ?page=99) volta vazia em vez de quebrar.
    if (error.code === "PGRST103") return { items: [], total: count ?? 0, page, pageCount: 0 };
    throw new Error(`Falha ao listar itens: ${error.message}`);
  }

  const total = count ?? 0;
  return {
    items: await withCoverUrls(data as CardRow[]),
    total,
    page,
    pageCount: Math.ceil(total / PAGE_SIZE),
  };
}

/** Publicações mais novas que ainda estão valendo (disponíveis ou reservadas). */
export async function recentItems(limit = 4): Promise<ItemCardData[]> {
  await requireCondoAccess();
  const { data, error } = await supabaseAdmin()
    .from("items")
    .select(CARD_COLUMNS)
    .neq("status", "doado")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Falha ao buscar recentes: ${error.message}`);
  return withCoverUrls(data as CardRow[]);
}

/** Quantos itens disponíveis há em cada categoria (para os chips da Home). */
export async function categoryCounts(): Promise<Record<Category, number>> {
  await requireCondoAccess();
  const { data, error } = await supabaseAdmin()
    .from("items")
    .select("category")
    .eq("status", "disponivel")
    .gt("expires_at", new Date().toISOString());
  if (error) throw new Error(`Falha ao contar categorias: ${error.message}`);
  const counts = Object.fromEntries(CATEGORIES.map((c) => [c.value, 0])) as Record<Category, number>;
  for (const row of data) counts[row.category] += 1;
  return counts;
}

export type ItemDetail = {
  id: string;
  title: string;
  description: string | null;
  notes: string | null;
  category: Category;
  condition: Condition;
  status: Status;
  nickname: string;
  block: string | null;
  pickupInfo: string | null;
  interestClicks: number;
  createdAt: string;
  expiresAt: string;
  photos: { url: string; thumbUrl: string }[];
  /** Só QUAIS canais existem — os valores nunca saem daqui (só por /api/contato). */
  channels: { whatsapp: boolean; phone: boolean; email: boolean; instagram: boolean };
};

/** Um anúncio para a página de detalhes; null se não existe ou expirou. */
export async function getItem(id: string): Promise<ItemDetail | null> {
  await requireCondoAccess();
  if (!isUuid(id)) return null;

  const db = supabaseAdmin();
  const [{ data: item, error }, { data: contact }] = await Promise.all([
    db
      .from("items")
      .select(
        "id, title, description, notes, category, condition, status, photos, nickname, block, pickup_info, interest_clicks, created_at, expires_at",
      )
      .eq("id", id)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle(),
    db.from("item_contacts").select("whatsapp, phone, email, instagram").eq("item_id", id).maybeSingle(),
  ]);
  if (error) throw new Error(`Falha ao carregar o item: ${error.message}`);
  if (!item) return null;

  const urls = await signPaths(item.photos.flatMap((p) => [p, thumbPath(p)]));
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    notes: item.notes,
    category: item.category,
    condition: item.condition,
    status: item.status,
    nickname: item.nickname,
    block: item.block,
    pickupInfo: item.pickup_info,
    interestClicks: item.interest_clicks,
    createdAt: item.created_at,
    expiresAt: item.expires_at,
    photos: item.photos
      .filter((p) => urls.has(p))
      .map((p) => ({ url: urls.get(p)!, thumbUrl: urls.get(thumbPath(p)) ?? urls.get(p)! })),
    channels: {
      whatsapp: Boolean(contact?.whatsapp),
      phone: Boolean(contact?.phone),
      email: Boolean(contact?.email),
      instagram: Boolean(contact?.instagram),
    },
  };
}
