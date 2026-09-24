-- =============================================================================
-- Doa Fácil — schema inicial
--
-- Regra de segurança (CLAUDE.md): a chave anon do Supabase é pública, então
-- RLS fica ligado em TODAS as tabelas sem nenhuma policy, e anon/authenticated
-- não recebem privilégio algum. Todo acesso passa pelo servidor Next.js com a
-- service role.
--
-- Como aplicar: cole este arquivo no SQL Editor do Supabase e execute
-- (ou `npx supabase db push`, se usar a CLI).
-- =============================================================================

-- Extensões ------------------------------------------------------------------

create extension if not exists unaccent with schema extensions;
create extension if not exists pg_trgm with schema extensions;
-- No Supabase o pg_cron é instalado em pg_catalog e cria o schema "cron".
create extension if not exists pg_cron with schema pg_catalog;

-- Busca sem acento e sem maiúsculas ("fogao" encontra "Fogão").
-- unaccent() não é IMMUTABLE; este wrapper fixa o dicionário para poder ser
-- usado em coluna gerada e índice.
create or replace function public.normalizar_busca(texto text)
returns text
language sql
immutable
parallel safe
strict
set search_path = ''
as $$
  select lower(extensions.unaccent('extensions.unaccent'::regdictionary, texto))
$$;

-- Tabelas --------------------------------------------------------------------

create table public.donors (
  id uuid primary key default gen_random_uuid(),
  -- sha256 (hex) da chave do doador; a chave em si nunca é salva
  key_hash text not null unique check (key_hash ~ '^[0-9a-f]{64}$'),
  recovery_email text check (char_length(recovery_email) <= 254),
  created_at timestamptz not null default now()
);

create table public.items (
  id uuid primary key default gen_random_uuid(),
  donor_id uuid not null references public.donors (id) on delete cascade,
  title text not null check (char_length(title) between 3 and 80),
  description text check (char_length(description) <= 500),
  notes text check (char_length(notes) <= 300),
  category text not null check (
    category in ('moveis', 'eletrodomesticos', 'roupas', 'livros', 'brinquedos', 'plantas', 'esportes', 'outros')
  ),
  condition text not null check (condition in ('novo', 'otima', 'boa', 'usada')),
  status text not null default 'disponivel' check (status in ('disponivel', 'reservado', 'doado')),
  photos text[] not null default '{}' check (cardinality(photos) <= 5), -- paths no bucket item-photos
  nickname text not null check (char_length(nickname) between 2 and 30),
  block text check (char_length(block) <= 10),
  pickup_info text check (char_length(pickup_info) <= 200),
  interest_clicks int not null default 0 check (interest_clicks >= 0),
  reports int not null default 0 check (reports >= 0),
  expires_at timestamptz not null default now() + interval '30 days',
  created_at timestamptz not null default now(),
  search_text text generated always as (
    public.normalizar_busca(title || ' ' || coalesce(description, ''))
  ) stored
);

create index items_status_created_idx on public.items (status, created_at desc);
create index items_category_idx on public.items (category);
create index items_donor_idx on public.items (donor_id);
create index items_expires_idx on public.items (expires_at);
create index items_reports_idx on public.items (reports desc) where reports > 0;
create index items_search_idx on public.items using gin (search_text extensions.gin_trgm_ops);

-- Contatos ficam separados e só saem pela rota POST /api/contato/[id].
create table public.item_contacts (
  item_id uuid primary key references public.items (id) on delete cascade,
  whatsapp text check (char_length(whatsapp) <= 20),
  phone text check (char_length(phone) <= 20),
  email text check (char_length(email) <= 254),
  instagram text check (char_length(instagram) <= 40),
  consent_at timestamptz not null,
  check (coalesce(whatsapp, phone, email, instagram) is not null)
);

-- Números de impacto da Home. Anúncios são apagados ao expirar, então os
-- totais históricos ("itens doados", "contatos feitos") vivem aqui.
create table public.impact_stats (
  id boolean primary key default true check (id),
  donated int not null default 0,
  contacts int not null default 0
);
insert into public.impact_stats default values;

-- Rate limit simples (publicação, contato, denúncia). A chave é algo como
-- 'contato:<hash do IP>'; o servidor nunca grava o IP em texto puro.
create table public.rate_limits (
  key text primary key,
  window_start timestamptz not null,
  hits int not null
);

-- Fotos de anúncios apagados/editados aguardando remoção do Storage.
-- O Supabase não permite apagar arquivos por SQL, então um job do servidor
-- (Storage API) esvazia esta fila.
create table public.photo_cleanup_queue (
  path text primary key,
  queued_at timestamptz not null default now()
);

-- RLS sem policies -----------------------------------------------------------

alter table public.donors enable row level security;
alter table public.items enable row level security;
alter table public.item_contacts enable row level security;
alter table public.impact_stats enable row level security;
alter table public.rate_limits enable row level security;
alter table public.photo_cleanup_queue enable row level security;

-- Triggers -------------------------------------------------------------------

-- Conta doações concluídas (e desfaz se o doador voltar o status).
create or replace function public.contar_doacao()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'doado' and old.status <> 'doado' then
    update public.impact_stats set donated = donated + 1;
  elsif old.status = 'doado' and new.status <> 'doado' then
    update public.impact_stats set donated = greatest(donated - 1, 0);
  end if;
  return new;
end
$$;

create trigger items_contar_doacao
after update of status on public.items
for each row execute function public.contar_doacao();

-- Enfileira fotos que deixaram de ser usadas (anúncio apagado ou foto trocada).
create or replace function public.enfileirar_fotos_removidas()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  insert into public.photo_cleanup_queue (path)
  select p
  from unnest(old.photos) as p
  where tg_op = 'DELETE' or not (p = any (new.photos))
  on conflict (path) do nothing;
  return null;
end
$$;

create trigger items_fotos_removidas
after delete or update of photos on public.items
for each row execute function public.enfileirar_fotos_removidas();

-- Funções chamadas pelo servidor --------------------------------------------

-- "Tenho interesse": incrementa o contador e devolve os canais numa só ida ao
-- banco. Não devolve nada para anúncio expirado, doado ou inexistente.
create or replace function public.registrar_interesse(p_item_id uuid)
returns table (
  whatsapp text,
  phone text,
  email text,
  instagram text,
  interest_clicks int
)
language plpgsql
set search_path = ''
as $$
#variable_conflict use_column
begin
  return query
  with alvo as (
    update public.items i
    set interest_clicks = i.interest_clicks + 1
    where i.id = p_item_id
      and i.status <> 'doado'
      and i.expires_at > now()
    returning i.id, i.interest_clicks
  )
  select c.whatsapp, c.phone, c.email, c.instagram, alvo.interest_clicks
  from alvo
  join public.item_contacts c on c.item_id = alvo.id;

  if found then
    update public.impact_stats set contacts = contacts + 1;
  end if;
end
$$;

-- Janela fixa: devolve true se ainda cabe mais uma requisição.
create or replace function public.consumir_rate_limit(p_key text, p_max int, p_window_seconds int)
returns boolean
language sql
set search_path = ''
as $$
  insert into public.rate_limits as r (key, window_start, hits)
  values (p_key, now(), 1)
  on conflict (key) do update set
    hits = case
      when r.window_start < now() - make_interval(secs => p_window_seconds) then 1
      else r.hits + 1
    end,
    window_start = case
      when r.window_start < now() - make_interval(secs => p_window_seconds) then now()
      else r.window_start
    end
  returning hits <= p_max
$$;

-- Privilégios ----------------------------------------------------------------
-- Defesa em profundidade: além do RLS sem policies, anon e authenticated não
-- recebem nenhum privilégio. Isso também bloqueia chamar as funções acima via
-- /rest/v1/rpc com a chave anon.

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke execute on all functions in schema public from public, anon, authenticated;

alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;

grant all on all tables in schema public to service_role;
grant execute on all functions in schema public to service_role;

-- Storage --------------------------------------------------------------------
-- Bucket privado: fotos só saem por signed URLs geradas no servidor.
-- storage.objects já tem RLS ligado e, sem policies, anon não lê nem grava.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('item-photos', 'item-photos', false, 3145728, array['image/jpeg', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Jobs agendados (horários em UTC; 03:00 UTC = 00:00 em Brasília) ------------

-- Ao expirar, o anúncio é apagado e o contato vai junto (on delete cascade).
select cron.schedule(
  'expirar-anuncios',
  '0 3 * * *',
  $$ delete from public.items where expires_at < now() $$
);

select cron.schedule(
  'limpar-rate-limits',
  '17 * * * *',
  $$ delete from public.rate_limits where window_start < now() - interval '1 day' $$
);
