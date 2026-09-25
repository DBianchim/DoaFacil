import type { Metadata } from "next";
import QRCode from "qrcode";
import { ButtonLink, Logo } from "@/components/ui";
import { requireAdmin } from "@/lib/admin";
import { siteOrigin } from "@/lib/donor";
import { env } from "@/lib/env";
import { PrintButton } from "./PrintButton";

export const metadata: Metadata = { title: "Cartaz do condomínio" };

const STEPS = ["Veja o que os vizinhos estão doando", "Chame o doador pelo WhatsApp", "Publique o que você não usa mais"];

/**
 * Cartaz A4 com QR Code (design/Cartaz.dc.html). Só o síndico acessa: o cartaz
 * mostra o código do condomínio. O QR abre /entrar?c=CODIGO, que grava o cookie.
 */
export default async function CartazPage() {
  await requireAdmin();

  const origin = await siteOrigin();
  const code = env.condoCode;
  const accessUrl = `${origin}/entrar?c=${encodeURIComponent(code)}`;
  const qrSvg = await QRCode.toString(accessUrl, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 0,
    color: { dark: "#1A2B1A", light: "#FFFFFF" },
  });
  const host = new URL(origin).host;

  return (
    <div className="flex min-h-dvh flex-col items-center gap-6 bg-muted px-4 py-8 print:block print:bg-white print:p-0">
      <div className="flex w-full max-w-[794px] flex-wrap items-center justify-between gap-3 print:hidden">
        <ButtonLink href="/admin" variant="neutral">
          ← Voltar ao painel
        </ButtonLink>
        <PrintButton />
      </div>
      <p className="max-w-[794px] text-sm text-text-2 print:hidden">
        Dica: na janela de impressão escolha papel A4, margens “Nenhuma” e ative “Gráficos de plano de fundo” para sair
        com as cores.
      </p>

      {/* Folha A4: 794 × 1123 px a 96 dpi */}
      <article className="cartaz flex aspect-[210/297] w-full max-w-[794px] flex-col overflow-hidden bg-bg shadow-modal print:w-[210mm] print:max-w-none print:shadow-none">
        <header className="flex flex-col gap-[2.5%] bg-primary px-[8%] pt-[7%] pb-[8%]">
          <div className="flex items-center gap-3">
            <Logo tone="onDark" className="[&>span:first-child]:size-12 [&>span:last-child]:text-[26px]" />
            <span className="ml-auto text-sm font-bold text-primary-pale">{env.condoName}</span>
          </div>
          <h1 className="mt-3 text-[clamp(28px,6.8vw,54px)] leading-[1.08] font-extrabold tracking-tight text-white">
            Tem algo parado em casa?
            <br />
            Um vizinho pode precisar.
          </h1>
          <p className="text-[clamp(15px,2.5vw,20px)] leading-normal text-primary-pale">
            O mural de doações do nosso condomínio. Grátis, sem cadastro.
          </p>
        </header>

        <div className="flex flex-1 flex-col items-center justify-center gap-[6%] px-[8%] py-[6%] sm:flex-row">
          <div className="aspect-square w-[55%] shrink-0 rounded-[28px] bg-white p-[3.5%] shadow-[0_12px_40px_rgb(45_106_79/0.18)] sm:w-[40%]">
            <div
              role="img"
              aria-label="QR Code de acesso ao mural"
              className="size-full [&>svg]:size-full"
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />
          </div>
          <div className="flex flex-col gap-5">
            <p className="text-[15px] font-extrabold tracking-[0.1em] text-primary uppercase">Aponte a câmera do celular</p>
            <ol className="flex flex-col gap-4">
              {STEPS.map((s, i) => (
                <li key={s} className="flex items-start gap-3.5">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary font-extrabold text-white">
                    {i + 1}
                  </span>
                  <span className="text-lg leading-snug">{s}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <footer className="mx-[8%] mb-[7%] flex flex-col gap-3 rounded-[20px] border-2 border-dashed border-primary-light bg-white px-7 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-text-2">
              Sem câmera? Acesse <strong className="text-text">{host}</strong> e digite o código:
            </p>
            <p className="mt-1 text-xs text-text-2">Uso exclusivo dos moradores · não compartilhe fora do condomínio</p>
          </div>
          <p className="font-mono text-[clamp(22px,4.3vw,34px)] font-extrabold tracking-[0.12em] text-primary">{code}</p>
        </footer>
      </article>
    </div>
  );
}
