/** Resposta de POST /api/contato/[id] (compartilhada entre a rota e o modal). */
export type ContactChannel = {
  kind: "whatsapp" | "email" | "phone" | "instagram";
  href: string;
  /** Texto exibido no modal (o e-mail aparece mascarado). */
  display: string;
};

export type ContactResponse = {
  nickname: string;
  title: string;
  block: string | null;
  whatsappMessage: string | null;
  channels: ContactChannel[];
  interestClicks: number;
};
