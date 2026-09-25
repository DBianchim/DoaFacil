"use client";

import { useActionState } from "react";
import { entrarAdmin, type LoginState } from "@/app/(mural)/admin/actions";
import { Button, Input } from "@/components/ui";

export function AdminLogin() {
  const [state, action, pending] = useActionState<LoginState, FormData>(entrarAdmin, {});
  return (
    <form action={action} className="flex flex-col gap-4">
      <Input
        name="password"
        type="password"
        label="Senha do síndico"
        required
        autoComplete="current-password"
        autoFocus
        error={state.error}
      />
      <Button type="submit" size="lg" loading={pending} fullWidth>
        Entrar no painel
      </Button>
    </form>
  );
}
