import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminRecoverForm } from "@/components/admin/AdminPasswordForms";
import { hasRecoveryCode, isAdmin, MIN_PASSWORD_LENGTH } from "@/lib/admin";
import { requireCondoAccess } from "@/lib/condo";

export const metadata: Metadata = { title: "Esqueci a senha" };

/** "Esqueci a senha" do síndico: código de recuperação + senha nova, sem falar com ninguém. */
export default async function RecuperarSenhaPage() {
  await requireCondoAccess();
  if (await isAdmin()) redirect("/admin");
  const enabled = await hasRecoveryCode();

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-14">
      <div>
        <h1 className="text-[26px] font-extrabold tracking-tight">Esqueci a senha</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-text-2">
          Use o <strong className="text-text">código de recuperação</strong> que apareceu quando você criou a senha (ou o
          arquivo <code>doafacil-codigo-recuperacao.txt</code>, se baixou) e escolha uma senha nova.
        </p>
      </div>
      {enabled ? (
        <section className="rounded-panel border border-border bg-surface p-6">
          <AdminRecoverForm minLength={MIN_PASSWORD_LENGTH} />
        </section>
      ) : (
        <section className="flex flex-col gap-3 rounded-panel border border-border bg-surface p-6 text-sm leading-relaxed text-text-2">
          <p>
            Ainda não existe código de recuperação: a senha própria do síndico não foi criada. Entre com a{" "}
            <strong className="text-text">senha inicial</strong> recebida de quem montou o site — no primeiro acesso o
            painel pede para criar a sua senha e mostra o código.
          </p>
          <Link href="/admin" className="flex min-h-11 items-center font-semibold text-primary hover:underline">
            Voltar para entrar
          </Link>
        </section>
      )}
    </main>
  );
}
