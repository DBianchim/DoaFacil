import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  Input,
  ItemGridSkeleton,
  Logo,
  Select,
  Skeleton,
  StatusBadge,
  Textarea,
} from "@/components/ui";
import { InteractiveDemo } from "./InteractiveDemo";

export const metadata: Metadata = { title: "Componentes" };

const swatches = [
  ["primary", "bg-primary"],
  ["primary-dark", "bg-primary-dark"],
  ["primary-light", "bg-primary-light"],
  ["primary-pale", "bg-primary-pale"],
  ["accent", "bg-accent"],
  ["accent-pale", "bg-accent-pale"],
  ["whatsapp", "bg-whatsapp"],
  ["danger", "bg-danger"],
  ["bg", "bg-bg"],
  ["border", "bg-border"],
  ["text", "bg-text"],
  ["text-2", "bg-text-2"],
];

/** Vitrine dos componentes base. Só existe em desenvolvimento. */
export default function ComponentesPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-4 py-10 sm:px-8 sm:py-14">
      <header className="flex flex-col gap-3">
        <Logo />
        <h1 className="text-h2 sm:text-h1">Componentes base</h1>
        <p className="text-body text-text-2">Vitrine dos tokens e componentes do Doa Fácil (só em desenvolvimento).</p>
      </header>

      <Section title="Cores">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {swatches.map(([name, cls]) => (
            <div key={name} className="overflow-hidden rounded-xl border border-border bg-surface">
              <div className={`h-14 ${cls}`} />
              <p className="px-3 py-2 text-caption font-semibold">{name}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Tipografia">
        <Card className="flex flex-col gap-4">
          <p className="text-h2 sm:text-h1">H1 — Aquilo que não usamos</p>
          <p className="text-h2">H2 — Doações recentes</p>
          <p className="text-h3">H3 — Como funciona?</p>
          <p className="text-body text-text-2">
            Corpo — Doe, encontre e reutilize objetos com os moradores do seu condomínio.
          </p>
          <p className="text-caption font-medium text-text-2">Legenda — Publicado há 2 dias · Bloco A</p>
          <p className="text-badge font-bold text-primary uppercase">Badge — Disponível</p>
        </Card>
      </Section>

      <Section title="Botões">
        <Card className="flex flex-col gap-6">
          <Row>
            <Button>Publicar doação</Button>
            <Button variant="secondary">Enviar mensagem</Button>
            <Button variant="neutral">Cancelar</Button>
            <Button variant="ghost">Ver todos</Button>
            <Button disabled>Desativado</Button>
            <Button loading>Publicando</Button>
          </Row>
          <Row>
            <Button variant="danger-soft">Remover publicação</Button>
            <Button variant="success-soft">Marcar como doado</Button>
            <Button variant="accent-soft" size="sm">
              Reservar
            </Button>
            <Button variant="danger">Remover</Button>
            <Button variant="whatsapp">Chamar no WhatsApp</Button>
          </Row>
          <Row>
            <Button size="sm">Pequeno</Button>
            <Button size="md">Médio</Button>
            <Button size="lg">Grande</Button>
            <ButtonLink href="/" variant="secondary">
              Link com cara de botão
            </ButtonLink>
          </Row>
        </Card>
      </Section>

      <Section title="Badges">
        <Card>
          <Row>
            <StatusBadge status="disponivel" />
            <StatusBadge status="reservado" />
            <StatusBadge status="doado" />
            <Badge tone="highlight">Novo</Badge>
            <Badge shape="tag">Móveis</Badge>
            <Badge shape="tag" tone="condition">
              Boa condição
            </Badge>
            <StatusBadge status="reservado" shape="tag" dot />
          </Row>
        </Card>
      </Section>

      <Section title="Campos">
        <Card className="grid gap-5 sm:grid-cols-2">
          <Input label="Título do item" placeholder="Ex.: Mesa de escritório" required hint="Entre 3 e 80 caracteres." />
          <Input label="Bloco" placeholder="Ex.: A" optional />
          <Input label="WhatsApp" defaultValue="(11) 9999" error="Informe um número com DDD." />
          <Select label="Categoria" defaultValue="">
            <option value="" disabled>
              Escolha uma categoria
            </option>
            <option value="moveis">Móveis</option>
            <option value="livros">Livros</option>
          </Select>
          <Textarea
            label="Descrição"
            placeholder="Conte o estado, medidas, marca…"
            className="sm:col-span-2"
            optional
          />
        </Card>
      </Section>

      <Section title="Modal, confirmação e toast">
        <InteractiveDemo />
      </Section>

      <Section title="Skeleton">
        <Skeleton className="mb-5 h-6 w-48" />
        <ItemGridSkeleton count={4} />
      </Section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="flex items-center gap-2.5 text-lg font-bold">
        <span aria-hidden="true" className="h-5 w-1 rounded-sm bg-primary" />
        {title}
      </h2>
      {children}
    </section>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-3">{children}</div>;
}
