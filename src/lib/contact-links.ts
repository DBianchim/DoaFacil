/** Links de contato (ver CLAUDE.md). Usado no servidor para montar a resposta de /api/contato. */

/** Só dígitos, com DDI 55. "(11) 98765-4321" → "5511987654321". */
export function phoneDigits(numero: string) {
  const d = numero.replace(/\D/g, "");
  return d.startsWith("55") && d.length >= 12 ? d : `55${d}`;
}

export function linkWhatsApp(numero: string, apelido: string, item: string) {
  return `https://wa.me/${phoneDigits(numero)}?text=${encodeURIComponent(whatsAppMessage(apelido, item))}`;
}

export function whatsAppMessage(apelido: string, item: string) {
  return `Oi, ${apelido}! Vi sua doação de "${item}" no Doa Fácil. Ainda está disponível?`;
}

export function linkEmail(email: string, apelido: string, item: string) {
  const subject = `Doa Fácil: ${item}`;
  const body = `Oi, ${apelido}! Vi sua doação de "${item}" no Doa Fácil. Ainda está disponível?`;
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export const linkPhone = (numero: string) => `tel:+${phoneDigits(numero)}`;

export const linkInstagram = (usuario: string) => `https://instagram.com/${usuario.replace(/^@/, "")}`;

/** "ricardo.s@gmail.com" → "r•••••@gmail.com" */
export function maskEmail(email: string) {
  const [user, domain] = email.split("@");
  if (!domain) return "•••••";
  return `${user.slice(0, 1)}•••••@${domain}`;
}

/** "11987654321" → "(11) 98765-4321" */
export function formatPhone(numero: string) {
  const d = numero.replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return numero;
}
