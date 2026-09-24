"use client";

import Form from "next/form";
import { useRef } from "react";
import { Select } from "@/components/ui";
import { CATEGORIES, CONDITIONS, STATUSES } from "@/lib/catalog";
import type { SortOption } from "@/lib/data/items";
import type { ExploreParams } from "./explore-url";

type Props = {
  params: ExploreParams;
  sortOptions: { value: SortOption; label: string }[];
};

const selectClass = "min-h-11 bg-surface text-[13px] font-medium text-text";

/**
 * Busca + filtros de /explorar. É um <Form> GET: a URL é a única fonte de
 * verdade e tudo funciona sem JavaScript (Enter ou botão Buscar). Com JS, trocar
 * um filtro já aplica a busca.
 */
export function ExploreFilters({ params, sortOptions }: Props) {
  const form = useRef<HTMLFormElement>(null);
  const submit = () => form.current?.requestSubmit();

  // Campos vazios (e a ordenação padrão) não vão para a URL: /explorar?status=doado
  // em vez de /explorar?q=&cat=&cond=&status=doado&sort=recentes.
  const skipDefaults = (e: React.FormEvent<HTMLFormElement>) => {
    const fields = [...e.currentTarget.elements].filter(
      (el): el is HTMLInputElement | HTMLSelectElement =>
        (el instanceof HTMLInputElement || el instanceof HTMLSelectElement) &&
        (el.value.trim() === "" || (el.name === "sort" && el.value === "recentes")),
    );
    fields.forEach((el) => (el.disabled = true));
    // setTimeout, não requestAnimationFrame: rAF fica pausado em abas em segundo plano.
    setTimeout(() => fields.forEach((el) => (el.disabled = false)));
  };

  return (
    // key: quando a URL muda (ex.: clique numa pílula), os campos recomeçam com os valores novos.
    <Form
      ref={form}
      key={JSON.stringify(params)}
      action="/explorar"
      onSubmit={skipDefaults}
      role="search"
      className="flex flex-col gap-3 xl:flex-row xl:items-end"
    >
      <div className="flex min-w-0 flex-1 gap-2 xl:max-w-[400px]">
        <label htmlFor="busca" className="sr-only">
          Buscar itens
        </label>
        <div className="flex h-11 min-w-0 flex-1 items-center gap-2.5 rounded-control border-[1.5px] border-border bg-bg px-3.5 focus-within:border-primary focus-within:bg-surface">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true" className="shrink-0 text-text-2">
            <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M15.5 15.5L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            id="busca"
            name="q"
            type="search"
            defaultValue={params.q}
            placeholder="Buscar itens..."
            maxLength={80}
            className="h-full w-full min-w-0 bg-transparent text-sm text-text outline-none placeholder:text-text-2/70 focus-visible:outline-none"
          />
        </div>
        <button
          type="submit"
          className="min-h-11 shrink-0 rounded-control bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover"
        >
          Buscar
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:flex xl:flex-1 xl:items-end">
        <Select label="Filtrar por categoria" hideLabel name="cat" defaultValue={params.cat ?? ""} onChange={submit} inputClassName={selectClass}>
          <option value="">Categoria</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </Select>
        <Select label="Filtrar por condição" hideLabel name="cond" defaultValue={params.cond ?? ""} onChange={submit} inputClassName={selectClass}>
          <option value="">Condição</option>
          {CONDITIONS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </Select>
        <Select label="Filtrar por status" hideLabel name="status" defaultValue={params.status ?? ""} onChange={submit} inputClassName={selectClass}>
          <option value="">Status</option>
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </Select>
        <Select
          label="Ordenar por"
          hideLabel
          name="sort"
          defaultValue={params.sort ?? "recentes"}
          onChange={submit}
          inputClassName={selectClass}
          className="xl:ml-auto"
        >
          {sortOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </div>
    </Form>
  );
}
