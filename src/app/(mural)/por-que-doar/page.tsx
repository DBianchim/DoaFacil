import type { Metadata } from "next";
import { DonationChecklist } from "@/components/educacao/DonationChecklist";
import { ButtonLink } from "@/components/ui";
import { requireCondoAccess } from "@/lib/condo";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  title: "Por que doar",
  description: "Por que doar faz diferença, como doar bem e o que fazer com o que não pode ser doado.",
};

const MOTIVOS = [
  {
    icon: "🌍",
    bg: "bg-primary-pale",
    title: "Menos lixo, mais vida útil",
    text: "Fabricar qualquer objeto consome água, energia e matéria-prima. Cada item reaproveitado adia a compra de um novo e evita que algo em bom estado vire resíduo.",
  },
  {
    icon: "💚",
    bg: "bg-accent-pale",
    title: "Ajuda de verdade",
    text: "O que está parado na sua casa pode ser exatamente o que falta na casa do vizinho: um berço, livros para a escola, um fogão para quem acabou de se mudar.",
  },
  {
    icon: "🤝",
    bg: "bg-primary-pale",
    title: "Vizinhança mais unida",
    text: "Doar entre vizinhos cria conversa, confiança e laços. Um condomínio onde as pessoas se ajudam é um lugar melhor para morar.",
  },
  {
    icon: "🏠",
    bg: "bg-accent-pale",
    title: "Casa mais leve",
    text: "Desapegar libera espaço, reduz o acúmulo e ajuda a perceber o que realmente usamos — e o que não precisamos comprar de novo.",
  },
];

// Lei nº 12.305/2010 (Política Nacional de Resíduos Sólidos), art. 9º.
const ORDEM = [
  { title: "Não gerar", text: "Evitar o que não precisa existir: recusar brindes, embalagens e compras por impulso." },
  { title: "Reduzir", text: "Comprar menos e melhor, escolhendo o que dura mais." },
  { title: "Reutilizar", text: "Dar nova vida ao que já existe — consertar, emprestar e doar.", destaque: true },
  { title: "Reciclar", text: "Quando não dá mais para usar, separar para a coleta seletiva." },
  { title: "Tratar", text: "Resíduos que não podem ser reciclados recebem tratamento adequado." },
  { title: "Disposição final", text: "Só o que sobra (rejeitos) vai para o aterro sanitário." },
];

const CINCO_RS = [
  { r: "Repensar", text: "Eu preciso mesmo disso?" },
  { r: "Recusar", text: "Dizer não ao que vira lixo rápido." },
  { r: "Reduzir", text: "Consumir menos e com mais cuidado." },
  { r: "Reutilizar", text: "Usar de novo, consertar, doar." },
  { r: "Reciclar", text: "Separar o que não tem mais uso." },
];

const NAO_DOAR = [
  { icon: "💊", title: "Remédios", text: "Mesmo dentro da validade. Devolva em farmácias com ponto de coleta." },
  { icon: "🥫", title: "Alimentos abertos ou vencidos", text: "Alimentos seguem regras de segurança próprias." },
  { icon: "🧴", title: "Higiene pessoal usada", text: "Escovas, cosméticos e produtos abertos não devem circular." },
  { icon: "🚗", title: "Cadeirinha de carro batida ou vencida", text: "Ela tem prazo de validade e pode não proteger depois de um acidente." },
  { icon: "🔋", title: "Pilhas, baterias e produtos químicos", text: "Vão para pontos de coleta específicos, nunca para o lixo comum." },
  { icon: "🧩", title: "Itens quebrados sem conserto", text: "Se não tem uso, o destino certo é a reciclagem ou o descarte adequado." },
];

export default async function PorQueDoarPage() {
  await requireCondoAccess();

  return (
    <main className="flex-1">
      {/* HERO */}
      <section className="bg-[linear-gradient(150deg,#D8F3DC_0%,#F0F7F2_45%,#F7F8F5_80%)]">
        <div className="mx-auto max-w-[1100px] px-4 pt-10 pb-12 sm:px-8 md:pt-16 md:pb-16">
          <span className="mb-4 inline-block rounded-full bg-surface px-3.5 py-1.5 text-badge font-bold tracking-wider text-primary uppercase">
            Doar é cuidar
          </span>
          <h1 className="mb-4 max-w-3xl text-[32px] leading-[1.12] font-extrabold tracking-tight md:text-[42px] lg:text-h1">
            Aquilo que não usamos mais pode ser útil para alguém da nossa comunidade
          </h1>
          <p className="max-w-2xl text-body text-text-2 md:text-[17px] md:leading-relaxed">
            Doar é um gesto simples que cuida de três coisas ao mesmo tempo: do planeta, do vizinho e da própria casa.
            Entenda por que isso importa e como fazer do jeito certo no {env.condoName}.
          </p>
        </div>
      </section>

      <div className="mx-auto flex max-w-[1100px] flex-col gap-14 px-4 pt-12 sm:px-8 md:gap-18 md:pt-14">
        {/* MOTIVOS */}
        <section aria-labelledby="titulo-motivos">
          <h2 id="titulo-motivos" className="mb-2 text-[26px] leading-tight font-extrabold tracking-tight md:text-h2">
            Por que doar faz diferença
          </h2>
          <p className="mb-7 text-body text-text-2">Quatro motivos para dar uma segunda vida ao que está parado.</p>
          <ul className="grid gap-4 sm:grid-cols-2">
            {MOTIVOS.map((m) => (
              <li key={m.title} className="flex gap-4 rounded-[20px] border border-border bg-surface p-5 md:p-6">
                <span aria-hidden="true" className={`flex size-12 shrink-0 items-center justify-center rounded-[14px] text-[22px] ${m.bg}`}>
                  {m.icon}
                </span>
                <div>
                  <h3 className="mb-1.5 text-[17px] font-bold">{m.title}</h3>
                  <p className="text-sm leading-relaxed text-text-2">{m.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* ORDEM DE PRIORIDADE */}
        <section aria-labelledby="titulo-ordem" className="rounded-panel bg-primary px-5 py-8 text-white md:px-10 md:py-11">
          <h2 id="titulo-ordem" className="mb-2 text-[24px] leading-tight font-extrabold tracking-tight md:text-[30px]">
            Doar vem antes de reciclar
          </h2>
          <p className="mb-7 max-w-3xl text-sm leading-relaxed text-primary-pale md:text-body">
            A Política Nacional de Resíduos Sólidos (Lei nº 12.305/2010) define uma ordem de prioridade para lidar com o
            que descartamos. Reciclar é importante, mas <strong className="text-white">reutilizar vem antes</strong>: o
            objeto continua servindo do jeito que é, sem gastar energia para ser transformado.
          </p>
          <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ORDEM.map((o, i) => (
              <li
                key={o.title}
                className={
                  o.destaque
                    ? "flex gap-3 rounded-2xl bg-white p-4 text-text ring-4 ring-primary-light"
                    : "flex gap-3 rounded-2xl bg-white/10 p-4"
                }
              >
                <span
                  aria-hidden="true"
                  className={
                    o.destaque
                      ? "flex size-8 shrink-0 items-center justify-center rounded-full bg-primary font-extrabold text-white"
                      : "flex size-8 shrink-0 items-center justify-center rounded-full bg-white/20 font-extrabold"
                  }
                >
                  {i + 1}
                </span>
                <div>
                  <p className="font-bold">
                    {o.title}
                    {o.destaque && (
                      <span className="ml-2 rounded-full bg-primary-pale px-2 py-0.5 align-middle text-badge font-bold text-primary uppercase">
                        É aqui que a doação entra
                      </span>
                    )}
                  </p>
                  <p className={o.destaque ? "mt-1 text-caption text-text-2" : "mt-1 text-caption text-white"}>{o.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-6 text-xs text-primary-pale">
            Fonte: Lei nº 12.305/2010, art. 9º — “não geração, redução, reutilização, reciclagem, tratamento dos resíduos
            sólidos e disposição final ambientalmente adequada dos rejeitos”.
          </p>
        </section>

        {/* 5 Rs + ODS 12 */}
        <section aria-labelledby="titulo-5rs" className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <div>
            <h2 id="titulo-5rs" className="mb-2 text-[24px] leading-tight font-extrabold tracking-tight md:text-[28px]">
              Os 5 Rs do consumo consciente
            </h2>
            <p className="mb-6 text-body text-text-2">Um jeito fácil de lembrar, em casa e com as crianças:</p>
            <ol className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 md:grid-cols-5">
              {CINCO_RS.map((item) => (
                <li
                  key={item.r}
                  className={
                    item.r === "Reutilizar"
                      ? "rounded-card border-[1.5px] border-primary-light bg-primary-pale p-4"
                      : "rounded-card border border-border bg-surface p-4"
                  }
                >
                  <p className="text-[17px] font-extrabold text-primary">{item.r}</p>
                  <p className="mt-1 text-caption text-text-2">{item.text}</p>
                </li>
              ))}
            </ol>
          </div>
          <aside className="rounded-[20px] border border-border bg-surface p-5 md:p-6">
            <p className="mb-2 text-badge font-bold tracking-wider text-accent-text uppercase">Agenda 2030 da ONU</p>
            <h3 className="mb-2 text-[17px] font-bold">ODS 12 — Consumo e produção responsáveis</h3>
            <p className="text-sm leading-relaxed text-text-2">
              Um dos 17 Objetivos de Desenvolvimento Sustentável é reduzir a geração de resíduos por meio da prevenção,
              redução, reciclagem e reúso. Cada doação no mural é uma pequena contribuição local para essa meta global.
            </p>
          </aside>
        </section>

        {/* CHECKLIST */}
        <section aria-labelledby="titulo-checklist" className="rounded-panel border border-border bg-surface p-5 md:p-8">
          <h2 id="titulo-checklist" className="mb-2 text-[24px] leading-tight font-extrabold tracking-tight md:text-[28px]">
            Antes de doar, confira
          </h2>
          <p className="mb-6 text-body text-text-2">
            Doar bem é doar algo que o vizinho vai conseguir usar. Um minuto de cuidado evita frustração dos dois lados.
          </p>
          <DonationChecklist />
        </section>

        {/* NÃO DOAR */}
        <section aria-labelledby="titulo-nao-doar">
          <h2 id="titulo-nao-doar" className="mb-2 text-[24px] leading-tight font-extrabold tracking-tight md:text-[28px]">
            O que não doar pelo mural
          </h2>
          <p className="mb-6 text-body text-text-2">Alguns itens têm riscos à saúde ou à segurança, ou precisam de um descarte especial.</p>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {NAO_DOAR.map((n) => (
              <li key={n.title} className="flex gap-3 rounded-card border border-danger-border bg-danger-pale p-4">
                <span aria-hidden="true" className="text-2xl">
                  {n.icon}
                </span>
                <div>
                  <p className="text-sm font-bold text-danger-ink">{n.title}</p>
                  <p className="mt-0.5 text-caption text-danger-ink">{n.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* BOAS PRÁTICAS */}
        <section aria-labelledby="titulo-praticas">
          <h2 id="titulo-praticas" className="mb-6 text-[24px] leading-tight font-extrabold tracking-tight md:text-[28px]">
            Boas práticas entre vizinhos
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[20px] border border-border bg-surface p-5 md:p-6">
              <h3 className="mb-3 flex items-center gap-2 text-[17px] font-bold">
                <span aria-hidden="true">🎁</span> Para quem doa
              </h3>
              <ul className="flex list-disc flex-col gap-2 pl-5 text-sm leading-relaxed text-text-2 marker:text-primary-light">
                <li>Responda quem chamar, mesmo que seja para dizer que o item já tem destino.</li>
                <li>Marque como <strong className="text-text">reservado</strong> assim que combinar, e como <strong className="text-text">doado</strong> depois da retirada.</li>
                <li>Seja honesto na descrição: defeitos avisados evitam viagens perdidas.</li>
                <li>Combine a entrega na portaria ou em uma área comum.</li>
              </ul>
            </div>
            <div className="rounded-[20px] border border-border bg-surface p-5 md:p-6">
              <h3 className="mb-3 flex items-center gap-2 text-[17px] font-bold">
                <span aria-hidden="true">🙌</span> Para quem recebe
              </h3>
              <ul className="flex list-disc flex-col gap-2 pl-5 text-sm leading-relaxed text-text-2 marker:text-primary-light">
                <li>Peça só o que você vai usar — assim o item chega a quem precisa.</li>
                <li>Combine um horário e cumpra. Se desistir, avise o doador.</li>
                <li>Aqui tudo é doação: <strong className="text-text">nunca pague nada</strong>. Desconfie de qualquer pedido de dinheiro.</li>
                <li>Um “obrigado” faz a próxima doação acontecer.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* DESTINO */}
        <section aria-labelledby="titulo-destino" className="rounded-panel bg-accent-pale p-5 md:p-8">
          <h2 id="titulo-destino" className="mb-2 text-[22px] leading-tight font-extrabold tracking-tight text-accent-ink md:text-[26px]">
            E o que ninguém quis?
          </h2>
          <p className="mb-5 text-sm leading-relaxed text-accent-ink md:text-body">
            Se o anúncio expirou sem interessados, ainda há bons caminhos antes do lixo comum:
          </p>
          <ul className="grid gap-3 text-sm text-accent-ink sm:grid-cols-2">
            <li className="rounded-xl bg-surface/70 p-4">
              <strong>Instituições e bazares beneficentes</strong> recebem roupas, móveis e utensílios em bom estado.
            </li>
            <li className="rounded-xl bg-surface/70 p-4">
              <strong>Coleta seletiva</strong> do condomínio para papel, plástico, vidro e metal limpos e separados.
            </li>
            <li className="rounded-xl bg-surface/70 p-4">
              <strong>Eletroeletrônicos, pilhas e lâmpadas</strong> têm pontos de entrega próprios (logística reversa).
            </li>
            <li className="rounded-xl bg-surface/70 p-4">
              <strong>Móveis grandes</strong>: muitas prefeituras têm serviço de coleta de volumosos. Vale consultar.
            </li>
          </ul>
        </section>

        {/* CTA */}
        <section aria-labelledby="titulo-cta" className="flex flex-col items-center gap-4 rounded-panel border border-border bg-surface px-5 py-10 text-center">
          <h2 id="titulo-cta" className="text-[24px] leading-tight font-extrabold tracking-tight md:text-[28px]">
            Que tal começar agora?
          </h2>
          <p className="max-w-xl text-body text-text-2">
            Olhe ao redor: tem algo parado que pode fazer a diferença para um vizinho?
          </p>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <ButtonLink href="/publicar" size="lg">
              Publicar doação
            </ButtonLink>
            <ButtonLink href="/explorar" size="lg" variant="secondary">
              Ver o que estão doando
            </ButtonLink>
          </div>
        </section>
      </div>
    </main>
  );
}
