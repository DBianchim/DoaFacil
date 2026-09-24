import type { Metadata } from "next";
import { Button, Input, Logo } from "@/components/ui";
import { safeNextPath } from "@/lib/condo-token";
import { formatNumber, getImpactStats } from "@/lib/data/stats";
import { env } from "@/lib/env";

export const metadata: Metadata = { title: "Entrar" };

/*
 * O formulário é um GET simples para /entrar?c=CODIGO: o proxy valida o código,
 * grava o cookie e redireciona. Funciona até sem JavaScript, igual ao QR Code.
 * Se a página renderiza com ?c= preenchido, é porque o código estava errado.
 */
export default async function EntrarPage({ searchParams }: PageProps<"/entrar">) {
  const params = await searchParams;
  const typed = typeof params.c === "string" ? params.c : undefined;
  const next = safeNextPath(typeof params.next === "string" ? params.next : null);
  const invalid = typed !== undefined;
  const stats = await getImpactStats();

  return (
    <main className="grid min-h-dvh flex-1 lg:grid-cols-2">
      {/* Painel da marca */}
      <section className="flex flex-col justify-between gap-8 bg-gradient-to-br from-primary to-primary-dark px-5 py-7 text-white sm:px-10 lg:px-16 lg:py-14">
        <Logo tone="onDark" />
        <div className="flex flex-col gap-4">
          <p className="text-caption font-bold tracking-wider text-primary-light uppercase">{env.condoName}</p>
          <h1 className="max-w-lg text-[28px] leading-tight font-extrabold tracking-tight sm:text-[34px] lg:text-[40px]">
            Aquilo que não usamos pode ser útil para um vizinho.
          </h1>
          <p className="max-w-md text-body text-primary-pale lg:text-base">
            Sem cadastro e sem senha. O mural é só para quem mora aqui — por isso pedimos o código do condomínio uma
            única vez.
          </p>
        </div>
        {stats && (
          <dl className="hidden gap-7 sm:flex">
            <div className="flex flex-col-reverse">
              <dt className="text-xs text-primary-pale">itens doados</dt>
              <dd className="text-[26px] font-extrabold">{formatNumber(stats.donated)}</dd>
            </div>
            <div className="flex flex-col-reverse">
              <dt className="text-xs text-primary-pale">disponíveis agora</dt>
              <dd className="text-[26px] font-extrabold">{formatNumber(stats.available)}</dd>
            </div>
          </dl>
        )}
      </section>

      {/* Formulário */}
      <section className="flex items-start justify-center px-5 py-10 sm:px-10 lg:items-center lg:py-12">
        <div className="flex w-full max-w-[420px] flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-[28px]">Digite o código do condomínio</h2>
            <p className="text-sm leading-relaxed text-text-2">
              Você encontra o código no cartaz do elevador e da portaria. Se leu o QR Code, a entrada é automática.
            </p>
          </div>

          <form action="/entrar" method="get" className="flex flex-col gap-4">
            {next && <input type="hidden" name="next" value={next} />}
            <Input
              name="c"
              label="Código de acesso"
              defaultValue={typed}
              placeholder="Ex.: ABCD-1234"
              required
              autoFocus={invalid}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              maxLength={40}
              error={
                invalid
                  ? "Código não reconhecido. Confira o cartaz mais recente — o código pode ter sido trocado pelo síndico."
                  : undefined
              }
              inputClassName="min-h-14 rounded-xl bg-surface px-[18px] text-xl font-bold tracking-[0.15em] uppercase placeholder:font-medium placeholder:tracking-normal placeholder:normal-case"
            />
            <Button type="submit" size="lg" fullWidth className="text-base font-bold">
              Entrar no mural
            </Button>
          </form>

          <div className="flex items-center gap-3.5 rounded-[14px] border border-border bg-surface p-4">
            <span
              aria-hidden="true"
              className="flex size-11 shrink-0 items-center justify-center rounded-control bg-primary-pale"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="#2D6A4F" strokeWidth="1.6" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="#2D6A4F" strokeWidth="1.6" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="#2D6A4F" strokeWidth="1.6" />
                <path
                  d="M14 14H17V17M21 14V21H14V18"
                  stroke="#2D6A4F"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <p className="text-caption text-text-2">
              Seu navegador lembra o acesso por 6 meses. Não é preciso criar conta.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
