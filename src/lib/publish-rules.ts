/**
 * Regras do formulário de publicação, compartilhadas entre navegador e servidor.
 * O navegador usa para avisar na hora; o servidor revalida tudo.
 */

export const LIMITS = {
  title: { min: 3, max: 80 },
  description: 500,
  notes: 300,
  nickname: { min: 2, max: 30 },
  block: 10,
  pickupInfo: 200,
} as const;

export type ChannelKey = "whatsapp" | "email" | "phone" | "instagram";

export const CHANNELS: { key: ChannelKey; label: string; hint: string; placeholder: string; inputMode: "tel" | "email" | "text" }[] = [
  { key: "whatsapp", label: "WhatsApp", hint: "Recomendado — abre conversa com mensagem pronta", placeholder: "(11) 98765-4321", inputMode: "tel" },
  { key: "email", label: "E-mail", hint: "Aparece parcialmente oculto no anúncio", placeholder: "voce@email.com", inputMode: "email" },
  { key: "phone", label: "Ligação", hint: "Para quem prefere telefonar", placeholder: "(11) 98765-4321", inputMode: "tel" },
  { key: "instagram", label: "Instagram", hint: "Seu @ para mensagem direta", placeholder: "@seuperfil", inputMode: "text" },
];

/** Telefone brasileiro com DDD: 10 ou 11 dígitos (com ou sem 55 na frente). Devolve só dígitos. */
export function normalizePhone(v: string): string | null {
  let d = v.replace(/\D/g, "");
  if ((d.length === 12 || d.length === 13) && d.startsWith("55")) d = d.slice(2);
  return d.length === 10 || d.length === 11 ? d : null;
}

export function normalizeEmail(v: string): string | null {
  const e = v.trim().toLowerCase();
  return e.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) ? e : null;
}

export function normalizeInstagram(v: string): string | null {
  const u = v.trim().replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/\/.*$/, "");
  return /^[A-Za-z0-9._]{1,30}$/.test(u) ? u : null;
}

export const CHANNEL_ERRORS: Record<ChannelKey, string> = {
  whatsapp: "Informe o WhatsApp com DDD, ex.: (11) 98765-4321.",
  phone: "Informe o telefone com DDD, ex.: (11) 98765-4321.",
  email: "Informe um e-mail válido, ex.: voce@email.com.",
  instagram: "Informe só o seu @, ex.: @seuperfil.",
};

export function normalizeChannel(key: ChannelKey, v: string): string | null {
  if (key === "email") return normalizeEmail(v);
  if (key === "instagram") return normalizeInstagram(v);
  return normalizePhone(v);
}

/** Fotos */
export const PHOTO_MAX_SIDE = 1600;
export const THUMB_MAX_SIDE = 600;
// 5 × (550 + 120) KB ≈ 3,4 MB: cabe no limite de 4 MB da Server Action.
export const PHOTO_MAX_BYTES = 550 * 1024;
export const THUMB_MAX_BYTES = 120 * 1024;
