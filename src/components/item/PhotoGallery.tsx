"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

type Props = {
  title: string;
  photos: { url: string; thumbUrl: string }[];
  placeholder: { icon: string; bg: string };
};

/** Foto principal + miniaturas. Sem fotos, mostra o ícone da categoria. */
export function PhotoGallery({ title, photos, placeholder }: Props) {
  const [current, setCurrent] = useState(0);

  if (photos.length === 0) {
    return (
      <div
        className="flex h-64 items-center justify-center rounded-[20px] border border-border text-[96px] sm:h-[420px] sm:text-[120px]"
        style={{ backgroundColor: placeholder.bg }}
      >
        <span role="img" aria-label="Sem foto">
          {placeholder.icon}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative h-72 overflow-hidden rounded-[20px] border border-border bg-muted sm:h-[420px]">
        {/* URLs assinadas do Supabase: <img> simples (ver ItemCard). */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photos[current].url}
          alt={photos.length > 1 ? `${title} — foto ${current + 1} de ${photos.length}` : title}
          className="size-full object-contain"
        />
      </div>
      {photos.length > 1 && (
        <ul className="flex gap-2.5 overflow-x-auto pb-1" aria-label="Fotos do item">
          {photos.map((p, i) => (
            <li key={p.url} className="shrink-0">
              <button
                type="button"
                onClick={() => setCurrent(i)}
                aria-label={`Ver foto ${i + 1}`}
                aria-current={i === current ? "true" : undefined}
                className={cn(
                  "block h-[72px] w-[90px] overflow-hidden rounded-xl border-2 transition-colors",
                  i === current ? "border-primary-light" : "border-border hover:border-disabled",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.thumbUrl} alt="" className="size-full object-cover" loading="lazy" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
