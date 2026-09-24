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
