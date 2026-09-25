"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { publicarDoacao } from "@/app/(mural)/publicar/actions";
import { Badge, Button, Input, Select, Textarea } from "@/components/ui";
import { CATEGORIES, CONDITIONS, MAX_PHOTOS, categoryIcon, categoryLabel, conditionLabel, isCategory, isCondition, placeholderBg } from "@/lib/catalog";
import { cn } from "@/lib/cn";
import { resizePhoto, type ResizedPhoto } from "@/lib/image-resize";
import { CHANNEL_ERRORS, CHANNELS, LIMITS, normalizeChannel, type ChannelKey } from "@/lib/publish-rules";

type Step = 1 | 2 | 3;
type Photo = ResizedPhoto & { id: string };

const STEP_LABELS = ["O item", "Seu contato", "Publicar"];

export function PublishForm() {
  const router = useRouter();
  const formId = useId();
  const [step, setStep] = useState<Step>(1);
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Etapa 1
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [processing, setProcessing] = useState(0);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");

  // Etapa 2
  const [active, setActive] = useState<Record<ChannelKey, boolean>>({ whatsapp: true, email: false, phone: false, instagram: false });
  const [contacts, setContacts] = useState<Record<ChannelKey, string>>({ whatsapp: "", email: "", phone: "", instagram: "" });
  const [nickname, setNickname] = useState("");
  const [block, setBlock] = useState("");
  const [pickupInfo, setPickupInfo] = useState("");
  const [consent, setConsent] = useState(false);

  // Libera as prévias da memória ao sair.
  const photosRef = useRef(photos);
  photosRef.current = photos;
  useEffect(() => () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.previewUrl)), []);

  // Ao trocar de etapa (não no primeiro carregamento), leva o foco e a tela para o título da etapa.
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
    window.scrollTo({ top: 0 });
  }, [step]);

  async function addFiles(files: FileList | null) {
    if (!files) return;
    const room = MAX_PHOTOS - photos.length;
    const chosen = [...files].slice(0, room);
    if (files.length > room) setErrors((e) => ({ ...e, photos: `Você pode enviar até ${MAX_PHOTOS} fotos.` }));
    else
      setErrors((e) => {
        const next = { ...e };
        delete next.photos;
        return next;
      });
    setProcessing((n) => n + chosen.length);
    for (const file of chosen) {
      try {
        const resized = await resizePhoto(file);
        setPhotos((list) => (list.length < MAX_PHOTOS ? [...list, { ...resized, id: crypto.randomUUID() }] : list));
      } catch {
        setErrors((e) => ({ ...e, photos: `Não conseguimos abrir “${file.name}”. Tente uma foto em JPG ou PNG.` }));
      } finally {
        setProcessing((n) => n - 1);
      }
    }
  }

  function removePhoto(id: string) {
    setPhotos((list) => {
      const p = list.find((x) => x.id === id);
      if (p) URL.revokeObjectURL(p.previewUrl);
      return list.filter((x) => x.id !== id);
    });
  }

  function validateStep1() {
    const e: Record<string, string> = {};
    const t = title.trim();
    if (t.length < LIMITS.title.min) e.title = "Dê um título ao item, ex.: Mesa de escritório.";
    if (!isCategory(category)) e.category = "Escolha uma categoria.";
    if (!isCondition(condition)) e.condition = "Escolha a condição do item.";
    return e;
  }

  function validateStep2() {
    const e: Record<string, string> = {};
    let any = false;
    for (const c of CHANNELS) {
      if (!active[c.key]) continue;
      if (!contacts[c.key].trim()) e[c.key] = `Preencha o seu ${c.label} ou desmarque esta opção.`;
      else if (!normalizeChannel(c.key, contacts[c.key])) e[c.key] = CHANNEL_ERRORS[c.key];
      else any = true;
    }
    if (!any && !CHANNELS.some((c) => e[c.key])) e.channels = "Escolha pelo menos uma forma de contato.";
    if (nickname.trim().length < LIMITS.nickname.min) e.nickname = "Diga como quer aparecer, ex.: Ricardo.";
    if (!consent) e.consent = "Para publicar, autorize a exibição dos seus contatos para os interessados.";
    return e;
  }

  function goToStep2() {
    const e = validateStep1();
    setErrors(e);
    if (processing > 0) return;
    if (Object.keys(e).length === 0) setStep(2);
    else focusFirstError(e);
  }

  function focusFirstError(e: Record<string, string>) {
    const first = Object.keys(e)[0];
    setTimeout(() => document.getElementById(`${formId}-${first}`)?.focus());
  }

  function submit() {
    const e = validateStep2();
    setErrors(e);
    setFormError(null);
    if (Object.keys(e).length > 0) return focusFirstError(e);

    const fd = new FormData();
    fd.set("title", title);
    fd.set("category", category);
    fd.set("condition", condition);
    fd.set("description", description);
    fd.set("notes", notes);
    fd.set("nickname", nickname);
    fd.set("block", block);
    fd.set("pickupInfo", pickupInfo);
    for (const c of CHANNELS) if (active[c.key]) fd.set(c.key, contacts[c.key]);
    if (consent) fd.set("consent", "on");
    photos.forEach((p, i) => {
      const ext = p.full.type === "image/webp" ? "webp" : "jpg";
      fd.append("photo", p.full, `${i}.${ext}`);
      fd.append("thumb", p.thumb, `${i}_t.${ext}`);
    });

    setStep(3);
    startTransition(async () => {
      try {
        const res = await publicarDoacao(fd);
        if (res.ok) {
          router.push(`/publicado?item=${res.itemId}`);
          return;
        }
        setErrors(res.fieldErrors ?? {});
        setFormError(res.error);
        const step1Fields = ["title", "category", "condition", "description", "notes", "photos"];
        setStep(Object.keys(res.fieldErrors ?? {}).some((k) => step1Fields.includes(k)) ? 1 : 2);
      } catch {
        setFormError("Sem conexão com o servidor. Suas informações continuam aqui — tente de novo.");
        setStep(2);
      }
    });
  }

  const fid = (name: string) => `${formId}-${name}`;
  const activeChannels = CHANNELS.filter((c) => active[c.key]);

  return (
    <div className="mx-auto w-full max-w-[1200px] flex-1 px-4 pb-10 sm:px-8">
      <Stepper step={step} />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <div className="flex min-w-0 flex-col gap-6">
          {formError && (
            <div role="alert" className="rounded-xl border border-danger-border bg-danger-pale px-4 py-3 text-sm font-semibold text-danger-ink">
              {formError}
            </div>
          )}

          {step === 1 && (
            <>
              <section className="flex flex-col gap-5 rounded-panel border border-border bg-surface p-5 sm:p-7">
                <div>
                  <h1 ref={headingRef} tabIndex={-1} className="text-xl font-extrabold tracking-tight outline-none sm:text-h3">
                    O que você vai doar?
                  </h1>
                  <p className="mt-1 text-sm text-text-2">Fotos e uma boa descrição ajudam o vizinho a decidir rápido.</p>
                </div>

                {/* Fotos */}
                <fieldset className="flex flex-col gap-2.5">
                  <legend className="mb-2.5 text-[13px] font-semibold">
                    Fotos <span className="font-medium text-text-2">(opcional, até {MAX_PHOTOS})</span>
                  </legend>
                  <ul className="grid grid-cols-3 gap-2.5 sm:grid-cols-5">
                    {photos.map((p, i) => (
                      <li key={p.id} className="relative aspect-square overflow-hidden rounded-xl border border-border bg-muted">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.previewUrl} alt={`Foto ${i + 1}`} className="size-full object-cover" />
                        {i === 0 && (
                          <span className="absolute bottom-1.5 left-1.5 rounded-full bg-text/80 px-2 py-0.5 text-[10px] font-bold text-white">
                            Capa
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => removePhoto(p.id)}
                          aria-label={`Remover foto ${i + 1}`}
                          className="absolute top-1 right-1 flex size-11 items-center justify-center"
                        >
                          <span className="flex size-7 items-center justify-center rounded-full bg-text/80 text-white">
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                          </span>
                        </button>
                      </li>
                    ))}
                    {Array.from({ length: processing }, (_, i) => (
                      <li key={`p${i}`} className="flex aspect-square items-center justify-center rounded-xl border border-dashed border-disabled bg-bg text-xs text-text-2">
                        Preparando…
                      </li>
                    ))}
                    {photos.length + processing < MAX_PHOTOS && (
                      <li className="aspect-square">
                        <label
                          htmlFor={fid("photos")}
                          className="flex size-full cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-[1.5px] border-dashed border-primary-light bg-primary-mist text-center text-xs font-semibold text-primary hover:bg-primary-pale has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-primary"
                        >
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          </svg>
                          Adicionar foto
                          <input
                            id={fid("photos")}
                            type="file"
                            accept="image/*"
                            multiple
                            className="sr-only"
                            aria-describedby={errors.photos ? fid("photos-error") : undefined}
                            onChange={(e) => {
                              void addFiles(e.target.files);
                              e.target.value = "";
                            }}
                          />
                        </label>
                      </li>
                    )}
                  </ul>
                  {errors.photos && (
                    <p id={fid("photos-error")} role="alert" className="text-xs font-medium text-danger">
                      {errors.photos}
                    </p>
                  )}
                  <p className="text-xs text-text-2">As fotos são reduzidas no seu aparelho antes do envio. A primeira vira a capa.</p>
                </fieldset>

                <Input
                  id={fid("title")}
                  label="Título"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={LIMITS.title.max}
                  placeholder="Ex.: Mesa de escritório em L"
                  error={errors.title}
                  hint={`${title.length}/${LIMITS.title.max}`}
                />

                <div className="grid gap-5 sm:grid-cols-2">
                  <Select id={fid("category")} label="Categoria" required value={category} onChange={(e) => setCategory(e.target.value)} error={errors.category}>
                    <option value="" disabled>
                      Escolha uma categoria
                    </option>
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </Select>

                  <fieldset aria-describedby={errors.condition ? fid("condition-error") : undefined}>
                    <legend className="mb-1.5 text-[13px] font-semibold">
                      Condição <span className="text-danger" aria-hidden="true">*</span>
                    </legend>
                    <div className="grid grid-cols-2 gap-2">
                      {CONDITIONS.map((c, i) => (
                        <label
                          key={c.value}
                          className={cn(
                            "flex min-h-11 cursor-pointer items-center justify-center rounded-control border-[1.5px] px-2 text-center text-[13px] font-semibold transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-primary",
                            condition === c.value ? "border-primary-light bg-primary-pale text-primary" : "border-border bg-surface text-text-2 hover:border-disabled",
                          )}
                        >
                          <input
                            id={i === 0 ? fid("condition") : undefined}
                            type="radio"
                            name="condition"
                            value={c.value}
                            checked={condition === c.value}
                            onChange={() => setCondition(c.value)}
                            className="sr-only"
                          />
                          {c.label}
                        </label>
                      ))}
                    </div>
                    {errors.condition && (
                      <p id={fid("condition-error")} className="mt-1.5 text-xs font-medium text-danger">
                        {errors.condition}
                      </p>
                    )}
                  </fieldset>
                </div>

                <Textarea
                  id={fid("description")}
                  label="Descrição"
                  optional
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={LIMITS.description}
                  placeholder="Estado, medidas, marca, tempo de uso…"
                  error={errors.description}
                  hint={`${description.length}/${LIMITS.description}`}
                />
                <Input
                  id={fid("notes")}
                  label="Observações"
                  optional
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={LIMITS.notes}
                  placeholder="Ex.: precisa de 2 pessoas para carregar"
                  error={errors.notes}
                />
              </section>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button size="lg" onClick={goToStep2} disabled={processing > 0}>
                  {processing > 0 ? "Preparando fotos…" : "Continuar"}
                </Button>
              </div>
            </>
          )}

          {step >= 2 && (
            <>
              <section className="flex items-center gap-4 rounded-card border border-border bg-surface p-4">
                <ItemThumb photo={photos[0]} category={category} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-primary">Etapa 1 concluída</p>
                  <p className="truncate font-bold">{title}</p>
                  <p className="text-xs text-text-2">
                    {isCategory(category) && categoryLabel(category)} · {isCondition(condition) && conditionLabel(condition)} ·{" "}
                    {photos.length === 1 ? "1 foto" : `${photos.length} fotos`}
                  </p>
                </div>
                <Button variant="neutral" size="sm" onClick={() => setStep(1)} disabled={pending}>
                  Editar
                </Button>
              </section>

              <fieldset disabled={pending} className="flex flex-col gap-6">
                <section className="flex flex-col gap-4 rounded-panel border border-border bg-surface p-5 sm:p-7">
                  <div>
                    <h1 ref={headingRef} tabIndex={-1} className="text-xl font-extrabold tracking-tight outline-none sm:text-h3">
                      Como você quer ser contatado?
                    </h1>
                    <p className="mt-1 text-sm text-text-2">
                      Escolha um ou mais canais. Eles só aparecem para vizinhos que clicarem em “Tenho interesse”.
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {CHANNELS.map((c) => (
                      <div
                        key={c.key}
                        className={cn(
                          "flex flex-col gap-3 rounded-[14px] border-[1.5px] p-3.5 transition-colors",
                          active[c.key] ? "border-primary-light bg-[#F4FAF6]" : "border-border bg-surface",
                        )}
                      >
                        <button
                          type="button"
                          aria-pressed={active[c.key]}
                          onClick={() => setActive((a) => ({ ...a, [c.key]: !a[c.key] }))}
                          className="flex min-h-11 items-start gap-3 text-left"
                        >
                          <span
                            aria-hidden="true"
                            className={cn(
                              "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border-[1.5px]",
                              active[c.key] ? "border-primary bg-primary text-white" : "border-disabled bg-surface",
                            )}
                          >
                            {active[c.key] && (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                <path d="M5 12.5l5 5L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </span>
                          <span className="flex flex-col">
                            <span className="text-sm font-bold">{c.label}</span>
                            <span className="text-xs text-text-2">{c.hint}</span>
                          </span>
                        </button>
                        {active[c.key] && (
                          <Input
                            id={fid(c.key)}
                            label={c.label}
                            hideLabel
                            inputMode={c.inputMode}
                            type={c.key === "email" ? "email" : "text"}
                            autoComplete={c.key === "email" ? "email" : c.key === "instagram" ? "off" : "tel"}
                            value={contacts[c.key]}
                            onChange={(e) => setContacts((v) => ({ ...v, [c.key]: e.target.value }))}
                            placeholder={c.placeholder}
                            error={errors[c.key]}
                            inputClassName="bg-surface"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  {errors.channels && (
                    <p id={fid("channels")} tabIndex={-1} role="alert" className="text-xs font-medium text-danger">
                      {errors.channels}
                    </p>
                  )}
                </section>

                <section className="flex flex-col gap-4 rounded-panel border border-border bg-surface p-5 sm:p-7">
                  <div>
                    <h2 className="text-lg font-bold">Como você aparece no anúncio</h2>
                    <p className="mt-1 text-sm text-text-2">Não pedimos nome completo nem número do apartamento.</p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_160px]">
                    <Input
                      id={fid("nickname")}
                      label="Apelido"
                      required
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      maxLength={LIMITS.nickname.max}
                      autoComplete="nickname"
                      placeholder="Ex.: Ricardo"
                      error={errors.nickname}
                    />
                    <Input
                      id={fid("block")}
                      label="Bloco"
                      optional
                      value={block}
                      onChange={(e) => setBlock(e.target.value)}
                      maxLength={LIMITS.block}
                      placeholder="Ex.: A"
                      error={errors.block}
                    />
                  </div>
                  <Input
                    id={fid("pickupInfo")}
                    label="Quando dá para retirar?"
                    optional
                    value={pickupInfo}
                    onChange={(e) => setPickupInfo(e.target.value)}
                    maxLength={LIMITS.pickupInfo}
                    placeholder="Ex.: fins de semana, 9h às 17h · dias úteis após 18h"
                    error={errors.pickupInfo}
                  />
                </section>

                <div className="flex flex-col gap-1.5">
                  <label
                    className={cn(
                      "flex cursor-pointer gap-3 rounded-[14px] border-[1.5px] bg-surface px-[18px] py-4",
                      errors.consent ? "border-danger" : consent ? "border-primary" : "border-border",
                    )}
                  >
                    <input
                      id={fid("consent")}
                      type="checkbox"
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                      aria-invalid={errors.consent ? true : undefined}
                      aria-describedby={errors.consent ? fid("consent-error") : undefined}
                      className="mt-0.5 size-5 shrink-0 accent-primary"
                    />
                    <span className="text-sm leading-relaxed">
                      Autorizo exibir os contatos acima para moradores do condomínio interessados neste item. Eles são apagados
                      quando o anúncio for removido ou expirar.
                    </span>
                  </label>
                  {errors.consent && (
                    <p id={fid("consent-error")} className="text-xs font-medium text-danger">
                      {errors.consent}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                    <Button variant="neutral" size="lg" onClick={() => setStep(1)}>
                      Voltar
                    </Button>
                    <Button size="lg" onClick={submit} loading={pending}>
                      {pending ? "Publicando…" : "Publicar doação"}
                    </Button>
                  </div>
                  <p className="text-center text-xs text-text-2 sm:text-right">
                    O anúncio fica no ar por 30 dias. Você pode renovar pelo seu link de doador.
                  </p>
                </div>
              </fieldset>
            </>
          )}
        </div>

        {/* Pré-visualização */}
        <aside aria-label="Pré-visualização do anúncio" className="hidden lg:sticky lg:top-[92px] lg:block">
          <p className="mb-2.5 text-badge font-bold tracking-wider text-text-2 uppercase">Pré-visualização</p>
          <div className="overflow-hidden rounded-card border border-border bg-surface">
            <div
              className="relative flex h-44 items-center justify-center text-[52px]"
              style={{ backgroundColor: isCategory(category) ? placeholderBg(category) : "#EEF7F1" }}
            >
              {photos[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photos[0].previewUrl} alt="" className="absolute inset-0 size-full object-cover" />
              ) : (
                <span aria-hidden="true">{isCategory(category) ? categoryIcon(category) : "📦"}</span>
              )}
              <Badge tone="available" className="absolute top-2.5 left-2.5">
                Disponível
              </Badge>
            </div>
            <div className="flex flex-col gap-2 p-4">
              <p className="font-bold">{title.trim() || "Título do item"}</p>
              <div className="flex flex-wrap gap-1.5">
                {isCategory(category) && <Badge shape="tag">{categoryLabel(category)}</Badge>}
                {isCondition(condition) && (
                  <Badge shape="tag" tone="condition">
                    {conditionLabel(condition)}
                  </Badge>
                )}
              </div>
              <p className="border-t border-divider pt-2.5 text-xs text-text-2">
                Doado por <strong className="text-text">{nickname.trim() || "você"}</strong>
                {block.trim() && ` · Bloco ${block.trim().toUpperCase()}`}
              </p>
              {step >= 2 && activeChannels.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {activeChannels.map((c) => (
                    <span key={c.key} className="rounded-full border border-border bg-bg px-2.5 py-0.5 text-[11px] font-semibold text-text-2">
                      {c.label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-text-2">
            Seus contatos ficam escondidos até alguém clicar em “Tenho interesse”.
          </p>
        </aside>
      </div>
    </div>
  );
}

function Stepper({ step }: { step: Step }) {
  return (
    <nav aria-label="Etapas da publicação" className="py-6 md:py-8">
      <ol className="flex items-center gap-2 sm:gap-3">
        {STEP_LABELS.map((label, i) => {
          const n = (i + 1) as Step;
          const done = n < step;
          const current = n === step;
          return (
            <li key={label} aria-current={current ? "step" : undefined} className="flex flex-1 items-center gap-2 sm:gap-3 last:flex-none">
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                  done ? "bg-primary text-white" : current ? "bg-primary text-white ring-4 ring-primary-pale" : "border-[1.5px] border-disabled bg-surface text-text-2",
                )}
              >
                {done ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M5 12.5l5 5L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  n
                )}
              </span>
              <span className={cn("text-[13px] font-semibold whitespace-nowrap", current ? "text-text" : "text-text-2", !current && "max-sm:sr-only")}>
                {label}
                {done && <span className="sr-only"> (concluída)</span>}
              </span>
              {i < STEP_LABELS.length - 1 && <span aria-hidden="true" className={cn("h-0.5 flex-1 rounded", done ? "bg-primary" : "bg-border")} />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function ItemThumb({ photo, category }: { photo?: Photo; category: string }) {
  return (
    <span
      aria-hidden="true"
      className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl text-2xl"
      style={{ backgroundColor: isCategory(category) ? placeholderBg(category) : "#EEF7F1" }}
    >
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo.previewUrl} alt="" className="size-full object-cover" />
      ) : isCategory(category) ? (
        categoryIcon(category)
      ) : (
        "📦"
      )}
    </span>
  );
}
