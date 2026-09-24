const TZ = "America/Sao_Paulo";

const dayKey = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });
const hour = new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, hour: "numeric" });
const shortDate = new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, day: "numeric", month: "short" });

/** Dias de calendário (no fuso de Brasília) entre a data e agora. */
function calendarDaysAgo(date: Date, now: Date) {
  return Math.round((Date.parse(dayKey.format(now)) - Date.parse(dayKey.format(date))) / 86_400_000);
}

/** "Hoje, 14h", "Ontem, 18h", "3 dias atrás", "1 semana", "12 de set." */
export function relativeDate(iso: string, now = new Date()): string {
  const date = new Date(iso);
  const days = calendarDaysAgo(date, now);
  if (days <= 0) return `Hoje, ${hour.format(date)}h`;
  if (days === 1) return `Ontem, ${hour.format(date)}h`;
  if (days < 7) return `${days} dias atrás`;
  if (days < 14) return "1 semana";
  if (days < 30) return `${Math.floor(days / 7)} semanas`;
  return shortDate.format(date);
}

/** "em 25 dias", "amanhã", "hoje" — para a data de expiração. */
export function expiresIn(iso: string, now = new Date()): string {
  const days = -calendarDaysAgo(new Date(iso), now);
  if (days <= 0) return "hoje";
  if (days === 1) return "amanhã";
  return `em ${days} dias`;
}

/** plural(3, "item", "itens") → "3 itens" */
export function plural(n: number, one: string, many: string) {
  return `${n.toLocaleString("pt-BR")} ${n === 1 ? one : many}`;
}
