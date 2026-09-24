import "server-only";

import { requireCondoAccess } from "@/lib/condo";
import { CATEGORIES, PHOTO_BUCKET, type Category, type Condition, type Status } from "@/lib/catalog";
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

/** Gera URLs assinadas (1h) para a primeira foto de cada item, numa só chamada. */
async function withCoverUrls(rows: CardRow[]): Promise<ItemCardData[]> {
  const covers = rows.map((r) => r.photos[0]).filter((p): p is string => Boolean(p));
  const urls = new Map<string, string>();
  if (covers.length > 0) {
    const { data } = await supabaseAdmin().storage.from(PHOTO_BUCKET).createSignedUrls(covers, 60 * 60);
    for (const s of data ?? []) if (s.path && s.signedUrl) urls.set(s.path, s.signedUrl);
  }
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    category: r.category,
    condition: r.condition,
    status: r.status,
    block: r.block,
    createdAt: r.created_at,
    photoUrl: r.photos[0] ? (urls.get(r.photos[0]) ?? null) : null,
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
