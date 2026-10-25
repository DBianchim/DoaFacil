"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useId, useRef, useState } from "react";
import {
  criarSenhaInicial,
  novoCodigoRecuperacao,
  recuperarSenha,
  trocarSenhaAdmin,
  type PasswordState,
} from "@/app/(mural)/admin/actions";
import { Button, Input, useToast } from "@/components/ui";

type Action = (prev: PasswordState, fd: FormData) => Promise<PasswordState>;

/** Mostra erros gerais como toast (os de campo aparecem em cada campo). */
function useErrorToast(state: PasswordState) {
  const toast = useToast();
  useEffect(() => {
    if (state.error) toast(state.error, "error");
  }, [state, toast]);
}

function NewPasswordFields({ state, minLength }: { state: PasswordState; minLength: number }) {
  return (
    <>
      <Input
        name="nova"
        type="password"
        label="Senha nova"
        required
        minLength={minLength}
        autoComplete="new-password"
        hint={`Pelo menos ${minLength} caracteres. Uma frase longa é fácil de lembrar e difícil de adivinhar.`}
        error={state.fieldErrors?.nova}
      />
      <Input
        name="confirmacao"
        type="password"
        label="Repita a senha nova"
        required
        autoComplete="new-password"
        error={state.fieldErrors?.confirmacao}
      />
    </>
  );
}

/**
 * Código de recuperação recém-gerado. Só aparece esta vez: o banco guarda apenas
 * o hash. O botão de continuar só libera depois de confirmar que guardou.
 */
export function RecoveryCodeCard({ code, continueLabel = "Continuar", onContinue }: { code: string; continueLabel?: string; onContinue: () => void }) {
  const toast = useToast();
  const id = useId();
  const [saved, setSaved] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => headingRef.current?.focus(), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      toast("Código copiado.");
    } catch {
      toast("Não foi possível copiar. Anote o código à mão.", "error");
    }
  }

  function download() {
    const text =
      `Doa Fácil — código de recuperação do síndico\n\n${code}\n\n` +
      `Use em "Esqueci a senha" na tela de entrada do painel (/admin/recuperar).\n` +
      `Cada código vale uma vez. Guarde em local seguro e não compartilhe.\n`;
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "doafacil-codigo-recuperacao.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div role="region" aria-labelledby={`${id}-titulo`} className="flex flex-col gap-4 rounded-2xl border-2 border-accent-border bg-accent-pale p-5">
      <div>
        <h3 id={`${id}-titulo`} ref={headingRef} tabIndex={-1} className="text-lg font-bold text-accent-ink outline-none">
          Guarde seu código de recuperação
        </h3>
        <p className="mt-1 text-sm leading-relaxed text-accent-ink">
          Se você esquecer a senha, é com este código que cria uma nova, sem precisar falar com ninguém.{" "}
          <strong>Ele aparece só agora</strong> — nem o site consegue mostrar de novo.
        </p>
      </div>
      <p className="rounded-xl border border-accent-border bg-surface px-4 py-3 text-center font-mono text-xl font-bold tracking-[0.12em] break-all text-text sm:text-2xl">
        {code}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button variant="neutral" size="sm" onClick={() => void copy()}>
          Copiar código
        </Button>
        <Button variant="neutral" size="sm" onClick={download}>
          Baixar como arquivo
        </Button>
      </div>
      <label className="flex cursor-pointer items-start gap-3 text-sm text-accent-ink">
        <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-primary" />
        Guardei o código em um lugar seguro (gerenciador de senhas, arquivo protegido ou papel guardado).
      </label>
      <div>
        <Button onClick={onContinue} disabled={!saved}>
          {continueLabel}
        </Button>
      </div>
    </div>
  );
}

/** Primeiro acesso: entrou com a senha inicial (ADMIN_PASSWORD) e cria a própria. */
export function AdminSetupForm({ minLength }: { minLength: number }) {
  const router = useRouter();
  const [state, action, pending] = useActionState<PasswordState, FormData>(criarSenhaInicial as Action, {});
  useErrorToast(state);

  if (state.ok && state.recoveryCode) {
    return <RecoveryCodeCard code={state.recoveryCode} continueLabel="Ir para o painel" onContinue={() => router.refresh()} />;
  }
  return (
    <form action={action} className="flex flex-col gap-4">
      <NewPasswordFields state={state} minLength={minLength} />
      <div>
        <Button type="submit" loading={pending}>
          Criar minha senha
        </Button>
      </div>
    </form>
  );
}

/** Troca de senha sabendo a atual. */
export function AdminChangePasswordForm({ minLength }: { minLength: number }) {
  const toast = useToast();
  const form = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<PasswordState, FormData>(trocarSenhaAdmin as Action, {});
  // Resultado cujo código já foi fechado pelo usuário (o código vem direto do estado da ação).
  const [dismissed, setDismissed] = useState<PasswordState | null>(null);
  useErrorToast(state);

  useEffect(() => {
    if (!state.ok) return;
    form.current?.reset();
    if (!state.recoveryCode) toast("Senha trocada. Use a senha nova nos próximos acessos.");
  }, [state, toast]);

  if (state.ok && state.recoveryCode && dismissed !== state) {
    return <RecoveryCodeCard code={state.recoveryCode} onContinue={() => setDismissed(state)} />;
  }
  return (
    <form ref={form} action={action} className="grid gap-4 md:grid-cols-3 md:items-start">
      <Input name="atual" type="password" label="Senha atual" required autoComplete="current-password" error={state.fieldErrors?.atual} />
      <NewPasswordFields state={state} minLength={minLength} />
      <div className="md:col-span-3">
        <Button type="submit" loading={pending}>
          Trocar senha
        </Button>
      </div>
    </form>
  );
}

/** Gera um código de recuperação novo (o anterior para de valer). */
export function AdminNewRecoveryCodeForm() {
  const form = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<PasswordState, FormData>(novoCodigoRecuperacao as Action, {});
  const [dismissed, setDismissed] = useState<PasswordState | null>(null);
  useErrorToast(state);

  if (state.ok && state.recoveryCode && dismissed !== state) {
    return <RecoveryCodeCard code={state.recoveryCode} onContinue={() => setDismissed(state)} />;
  }
  return (
    <form ref={form} action={action} className="flex flex-col gap-4 sm:flex-row sm:items-start">
      <Input
        name="atual"
        type="password"
        label="Confirme com a senha atual"
        required
        autoComplete="current-password"
        error={state.fieldErrors?.atual}
        className="sm:min-w-72"
      />
      <Button type="submit" variant="secondary" loading={pending} className="sm:mt-[26px]">
        Gerar novo código
      </Button>
    </form>
  );
}

/** "Esqueci a senha": código de recuperação + senha nova. */
export function AdminRecoverForm({ minLength }: { minLength: number }) {
  const router = useRouter();
  const [state, action, pending] = useActionState<PasswordState, FormData>(recuperarSenha as Action, {});
  useErrorToast(state);

  if (state.ok && state.recoveryCode) {
    return (
      <div className="flex flex-col gap-4">
        <p role="status" className="rounded-xl bg-primary-pale px-4 py-3 text-sm font-semibold text-primary">
          Senha redefinida! O código que você usou não vale mais — guarde o novo abaixo.
        </p>
        <RecoveryCodeCard code={state.recoveryCode} continueLabel="Ir para o painel" onContinue={() => router.push("/admin")} />
      </div>
    );
  }
  return (
    <form action={action} className="flex flex-col gap-4">
      <Input
        name="codigo"
        label="Código de recuperação"
        required
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        placeholder="XXXXX-XXXXX-XXXXX-XXXXX"
        error={state.fieldErrors?.codigo}
        inputClassName="font-mono tracking-wider uppercase placeholder:normal-case"
      />
      <NewPasswordFields state={state} minLength={minLength} />
      <Button type="submit" size="lg" loading={pending} fullWidth>
        Redefinir senha
      </Button>
      <Link href="/admin" className="flex min-h-11 items-center justify-center text-sm font-semibold text-primary hover:underline">
        Lembrei a senha — voltar para entrar
      </Link>
    </form>
  );
}
