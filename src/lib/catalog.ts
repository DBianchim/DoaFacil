/** Valores fixos do domínio, espelhando os CHECKs da migração. */

export const CATEGORIES = [
  { value: "moveis", label: "Móveis", icon: "🪑" },
  { value: "eletrodomesticos", label: "Eletrodomésticos", icon: "⚡" },
  { value: "roupas", label: "Roupas", icon: "👕" },
  { value: "livros", label: "Livros", icon: "📚" },
  { value: "brinquedos", label: "Brinquedos", icon: "🧸" },
  { value: "plantas", label: "Plantas", icon: "🌱" },
  { value: "esportes", label: "Esportes", icon: "⚽" },
  { value: "outros", label: "Outros", icon: "📦" },
] as const;

export const CONDITIONS = [
  { value: "novo", label: "Novo" },
  { value: "otima", label: "Ótima condição" },
  { value: "boa", label: "Boa condição" },
  { value: "usada", label: "Usada" },
] as const;

export const STATUSES = [
  { value: "disponivel", label: "Disponível" },
  { value: "reservado", label: "Reservado" },
  { value: "doado", label: "Doado" },
] as const;

export type Category = (typeof CATEGORIES)[number]["value"];
export type Condition = (typeof CONDITIONS)[number]["value"];
export type Status = (typeof STATUSES)[number]["value"];

export const ITEM_TTL_DAYS = 30;
export const MAX_PHOTOS = 5;
export const PHOTO_BUCKET = "item-photos";

const byValue = <T extends { value: string }>(list: readonly T[]) =>
  Object.fromEntries(list.map((x) => [x.value, x])) as Record<T["value"], T>;

const categoryMap = byValue(CATEGORIES);
const conditionMap = byValue(CONDITIONS);

export const isCategory = (v: unknown): v is Category => typeof v === "string" && Object.hasOwn(categoryMap, v);
export const isCondition = (v: unknown): v is Condition => typeof v === "string" && Object.hasOwn(conditionMap, v);
export const isStatus = (v: unknown): v is Status =>
  typeof v === "string" && STATUSES.some((s) => s.value === v);

export const categoryLabel = (c: Category) => categoryMap[c].label;
export const categoryIcon = (c: Category) => categoryMap[c].icon;
export const conditionLabel = (c: Condition) => conditionMap[c].label;

/** Fundo do placeholder quando o item não tem foto (alternando os tons dos protótipos). */
export const placeholderBg = (c: Category) =>
  ["eletrodomesticos", "esportes", "brinquedos"].includes(c) ? "#FEF3EB" : "#EEF7F1";
