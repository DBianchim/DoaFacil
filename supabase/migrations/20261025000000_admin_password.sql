-- =============================================================================
-- Senha do síndico trocável pelo painel /admin + código de recuperação.
--
-- Guarda só hashes (scrypt, com salt) — nunca a senha nem o código.
-- Enquanto não houver linha nesta tabela, o login usa a variável
-- ADMIN_PASSWORD da Vercel; no primeiro acesso o síndico cria a própria senha
-- e recebe um código de recuperação para o "Esqueci a senha".
--
-- Pode ser executado mais de uma vez (e também por cima da versão anterior
-- deste arquivo, que não tinha a coluna recovery_hash).
-- Mesma regra das outras tabelas: RLS sem policies e nenhum privilégio para
-- anon/authenticated; só o servidor (service role) lê e grava.
-- =============================================================================

create table if not exists public.admin_config (
  id boolean primary key default true check (id), -- uma linha só
  password_hash text not null check (password_hash like 'scrypt$%'),
  updated_at timestamptz not null default now()
);

alter table public.admin_config
  add column if not exists recovery_hash text check (recovery_hash is null or recovery_hash like 'scrypt$%');

alter table public.admin_config enable row level security;

revoke all on public.admin_config from anon, authenticated;
grant all on public.admin_config to service_role;
