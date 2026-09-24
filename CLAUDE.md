# Doa Fácil — Plataforma de doações do condomínio

Projeto de atividade extensionista. Mural web onde moradores de um condomínio publicam itens para doar e outros moradores entram em contato direto com o doador para combinar a retirada.

Princípio central: "Aquilo que não usamos mais pode ser útil para alguém da nossa própria comunidade."

Toda a interface é em **português do Brasil**.

## Decisões de produto (não mudar sem perguntar)

- **Sem contas de usuário.** Não existe cadastro, login nem senha.
- **Sem chat interno.** O doador informa como quer ser contatado (WhatsApp, e-mail, ligação e/ou Instagram) e o interessado fala com ele por fora da plataforma.
- **Acesso coletivo por código do condomínio.** Um QR Code no elevador/portaria abre `/entrar?c=CODIGO`, que grava um cookie. Sem cookie válido, todas as páginas redirecionam para `/entrar`.
- **Chave de doador (um link por pessoa, não por anúncio).** Na primeira publicação o sistema gera uma chave aleatória, salva no navegador (cookie httpOnly) e mostra o link `/minhas?k=CHAVE`. Publicações seguintes no mesmo navegador usam a mesma chave. Abrir o link em outro aparelho restaura a chave. E-mail de recuperação é opcional.
- **Anúncios expiram em 30 dias** (renováveis pelo painel). Ao expirar ou ser removido, o contato do doador é apagado.
- **Contato só aparece após clique em "Tenho interesse"**, e cada clique incrementa o contador "viram o contato".
- **Privacidade:** o anúncio mostra apenas apelido e bloco (opcional). Nunca nome completo nem número do apartamento. E-mail aparece parcialmente oculto até o clique. Consentimento LGPD obrigatório na publicação.
- Botão "Denunciar anúncio" em cada item; um acesso de administrador (síndico) pode remover anúncios.

## Stack

- **Next.js 16 (App Router) + TypeScript** hospedado na **Vercel** — leia @AGENTS.md (no Next 16 o `middleware.ts` se chama `proxy.ts`)
- **Supabase**: Postgres, Storage (fotos), `pg_cron` (expiração)
- Estilo: Tailwind CSS com os tokens abaixo
- Fonte: Plus Jakarta Sans (next/font/google)

## Segurança — regra mais importante

A chave `anon` do Supabase fica exposta no navegador. Portanto:

1. **RLS ativado em todas as tabelas, sem nenhuma policy para `anon` ou `authenticated`.**
2. **Todo acesso a dados passa pelo servidor Next.js** (Server Components, Server Actions, Route Handlers) usando a `SUPABASE_SERVICE_ROLE_KEY`, que existe só em variáveis de ambiente da Vercel. Nunca importar o cliente service-role em código `"use client"`.
3. Toda rota/ação de dados verifica o cookie do condomínio antes de responder.
4. A chave do doador nunca é salva em texto puro: guardar `sha256(chave)`. Ações de gerenciamento (reservar, doar, renovar, editar, remover) validam que o item pertence ao doador daquela chave.
5. Contatos ficam na tabela separada `item_contacts` e só saem pela rota `POST /api/contato/[id]`.
6. Adicionar `noindex` (metadata robots) em todo o site. Rate limit simples na publicação e na rota de contato.

## Banco de dados (ponto de partida)

```sql
create table donors (
  id uuid primary key default gen_random_uuid(),
  key_hash text not null unique,
  recovery_email text,
  created_at timestamptz not null default now()
);

create table items (
  id uuid primary key default gen_random_uuid(),
  donor_id uuid not null references donors(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 80),
  description text check (char_length(description) <= 500),
  notes text,
  category text not null,          -- moveis | eletrodomesticos | roupas | livros | brinquedos | plantas | esportes | outros
  condition text not null,         -- novo | otima | boa | usada
  status text not null default 'disponivel' check (status in ('disponivel','reservado','doado')),
  photos text[] not null default '{}',   -- paths no Storage
  nickname text not null,
  block text,
  pickup_info text,
  interest_clicks int not null default 0,
  reports int not null default 0,
  expires_at timestamptz not null default now() + interval '30 days',
  created_at timestamptz not null default now()
);

create table item_contacts (
  item_id uuid primary key references items(id) on delete cascade,
  whatsapp text,
  phone text,
  email text,
  instagram text,
  consent_at timestamptz not null
);

alter table donors enable row level security;
alter table items enable row level security;
alter table item_contacts enable row level security;

-- expiração diária
select cron.schedule('expirar-anuncios', '0 3 * * *',
  $$ delete from items where expires_at < now() $$);
```

Fotos: bucket privado `item-photos`, servidas via signed URLs geradas no servidor. Redimensionar no navegador antes do upload (máx. ~1600px, JPEG/WebP), até 5 fotos.

## Rotas

| Rota | Tela de referência | Notas |
|---|---|---|
| `/entrar` | `design/Entrar.dc.html` | `?c=CODIGO` grava cookie e redireciona para `/`. Estado de erro para código inválido. |
| `/` | `design/Home.dc.html` | Busca, categorias, recentes, "como funciona", números de impacto |
| `/explorar` | `design/Explorar.dc.html` | Busca, filtros (categoria, condição, status), ordenação, paginação. Itens doados com sobreposição "Item doado". |
| `/item/[id]` | `design/Detalhes.dc.html` | "Tenho interesse" abre o modal de contato |
| (modal) | `design/ModalContato.dc.html`, `design/MobileContato.dc.html` | Desktop: modal central. Mobile: bottom sheet. |
| `/publicar` | `design/Publicar.dc.html` | Etapas: 1 O item, 2 Seu contato, 3 Publicar |
| `/publicado` | `design/Sucesso.dc.html` | Mostra o link de doador, copiar, enviar para o próprio WhatsApp, e-mail de recuperação opcional |
| `/minhas` | `design/MinhasDoacoes.dc.html` | `?k=CHAVE` restaura a chave. Reservar, marcar como doado, renovar, remover (com confirmação), toasts |
| `/api/contato/[id]` | — | Verifica cookie, incrementa `interest_clicks`, devolve os canais |
| `/admin` | — | Protegida por `ADMIN_PASSWORD` em env; lista denúncias e remove anúncios |

`design/Cartaz.dc.html` é o cartaz A4 com QR Code, para impressão (pode virar a página `/cartaz` com o QR gerado pela lib `qrcode`).

## Acesso pelo código do condomínio (`src/proxy.ts`)

No Next 16 o middleware se chama **proxy** (`src/proxy.ts`). Regras:

- `/entrar?c=CODIGO` válido grava o cookie `condo` (httpOnly, 6 meses) e redireciona para `?next=` (só caminhos internos) ou `/`. O código é comparado sem diferenciar maiúsculas, espaços e hífens.
- Sem cookie válido: páginas redirecionam para `/entrar?next=<caminho>`; rotas `/api/*` respondem 401.
- **O cookie nunca guarda o `CONDO_CODE_VERSION` puro** (seria forjável criando `condo=v1` à mão). Ele guarda `HMAC-SHA256(chave = código normalizado, "doafacil:condo:" + versão)` — ver `src/lib/condo-token.ts`. Trocar o código **ou** a versão invalida todos os acessos.
- O proxy não basta: páginas, Server Actions e Route Handlers chamam `requireCondoAccess()` / `hasCondoAccess()` de `src/lib/condo.ts`.

## Link de WhatsApp com mensagem pronta

```ts
export function linkWhatsApp(numero: string, apelido: string, item: string) {
  const d = numero.replace(/\D/g, '');
  const n = d.startsWith('55') ? d : `55${d}`;
  const msg = `Oi, ${apelido}! Vi sua doação de "${item}" no Doa Fácil. Ainda está disponível?`;
  return `https://wa.me/${n}?text=${encodeURIComponent(msg)}`;
}
// e-mail: mailto:x?subject=...&body=...   ligação: tel:+55...   instagram: https://instagram.com/usuario
```

## Design tokens

| Token | Valor | Uso |
|---|---|---|
| primary | `#2D6A4F` | botões principais, links, estado ativo |
| primary-dark | `#1A3D2B` | gradientes de painéis |
| primary-light | `#52B788` | detalhes, bordas de seleção |
| primary-pale | `#D8F3DC` | badges "Disponível", fundos suaves |
| accent | `#E07B39` / texto `#B85D1C` | condição do item, "Reservado" |
| accent-pale | `#FEF3EB` | fundo de "Reservado" |
| whatsapp | `#1F7A4D` | botão do WhatsApp |
| danger | `#B42318` / fundo `#FEF2F2` | remover, denunciar, erros |
| bg | `#F7F8F5` | fundo da página |
| surface | `#FFFFFF` | cards |
| border | `#E2EBE2` | bordas |
| text | `#1A2B1A` | texto principal |
| text-2 | `#5C6B5C` | texto secundário |
| text-3 | `#8FA08F` | somente decorativo (não passa contraste para texto pequeno — use text-2) |

Raios: 8–10px inputs/botões, 12–16px cards, 20–24px painéis e modais. Badges em pílula (100px).
Tipografia: H1 50/800, H2 34/800, H3 22/700, corpo 15/400, legenda 13/500, badge 11/700 maiúsculas.

## Sobre os arquivos em `design/`

São protótipos exportados de uma ferramenta de design (formato `.dc.html`): HTML com estilos inline, templates `{{variavel}}`, laços `<sc-for>`, condicionais `<sc-if>` e uma classe `Component` no fim com os dados de exemplo e a lógica de interação. **Use como referência visual e de comportamento, não copie a estrutura.** Recrie como componentes React + Tailwind. Emojis nos cards são só placeholders de foto — no produto real entram as fotos enviadas.

## Requisitos transversais

- Responsivo de verdade: 1440, 1280, 1024, 768, 390 e 360px. No mobile, navegação inferior (Início, Explorar, Minhas doações) e botão flutuante de publicar.
- Acessibilidade: botões e links reais, `label` em todo campo, foco visível, áreas de toque ≥ 44px, estados nunca comunicados só por cor.
- Estados: vazio ("Ainda não existem itens disponíveis. Seja o primeiro a publicar uma doação."), busca sem resultado, loading com skeleton, erro com mensagem orientativa, confirmação antes de ações destrutivas.
- Microcopy natural em pt-BR, como nos protótipos.
