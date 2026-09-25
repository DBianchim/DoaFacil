"use client";

import { useId, useState } from "react";
import { ButtonLink } from "@/components/ui";
import { cn } from "@/lib/cn";

const ITEMS = [
  { title: "Está limpo", text: "Lavado, sem poeira e sem cheiro de guardado." },
  { title: "Funciona — ou o defeito está avisado", text: "Teste antes. Se tiver algum problema, conte na descrição." },
  { title: "Está completo", text: "Peças, parafusos, carregador, tampas e manual, se tiver." },
  { title: "Tem fotos reais", text: "Fotos do próprio item, com boa luz, mostrando o estado de verdade." },
  { title: "Não tem dados pessoais", text: "Celulares, computadores e pen drives restaurados de fábrica, sem contas nem arquivos." },
  { title: "Eu doaria para alguém que gosto", text: "Se você não daria para um amigo, provavelmente o lugar dele é outro." },
];

/** Checklist "antes de doar" com progresso. Não guarda nada: é só para a pessoa conferir. */
export function DonationChecklist() {
  const id = useId();
  const [checked, setChecked] = useState<boolean[]>(() => ITEMS.map(() => false));
  const done = checked.filter(Boolean).length;
  const all = done === ITEMS.length;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <div
          role="progressbar"
          aria-label="Itens conferidos"
          aria-valuemin={0}
          aria-valuemax={ITEMS.length}
          aria-valuenow={done}
          aria-valuetext={`${done} de ${ITEMS.length} conferidos`}
          className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted"
        >
          <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${(done / ITEMS.length) * 100}%` }} />
        </div>
        <span className="shrink-0 text-caption font-semibold text-text-2">
          {done}/{ITEMS.length}
        </span>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        {ITEMS.map((item, i) => (
          <li key={item.title}>
            <label
              htmlFor={`${id}-${i}`}
              className={cn(
                "flex h-full cursor-pointer gap-3 rounded-[14px] border-[1.5px] p-4 transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-primary",
                checked[i] ? "border-primary-light bg-[#F4FAF6]" : "border-border bg-surface hover:border-disabled",
              )}
            >
              <input
                id={`${id}-${i}`}
                type="checkbox"
                checked={checked[i]}
                onChange={(e) => setChecked((c) => c.map((v, j) => (j === i ? e.target.checked : v)))}
                className="mt-0.5 size-5 shrink-0 accent-primary"
              />
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-bold">{item.title}</span>
                <span className="text-caption text-text-2">{item.text}</span>
              </span>
            </label>
          </li>
        ))}
      </ul>

      <div aria-live="polite">
        {all ? (
          <div className="flex flex-col items-start gap-3 rounded-[14px] bg-primary-pale p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-primary">Tudo conferido! Seu item está pronto para ganhar um novo dono.</p>
            <ButtonLink href="/publicar">Publicar doação</ButtonLink>
          </div>
        ) : (
          <p className="text-caption text-text-2">Marque o que já conferiu. Nada disso é salvo — é só para você.</p>
        )}
      </div>
    </div>
  );
}
