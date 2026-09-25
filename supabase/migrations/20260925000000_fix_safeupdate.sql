-- =============================================================================
-- Correção: o Supabase ativa a extensão pg_safeupdate nas requisições da API,
-- que bloqueia UPDATE sem WHERE ("UPDATE requires a WHERE clause").
-- impact_stats tem uma linha só (id = true), então os UPDATEs passam a
-- filtrar por ela. Sem mudança de comportamento.
-- =============================================================================

create or replace function public.contar_doacao()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'doado' and old.status <> 'doado' then
    update public.impact_stats set donated = donated + 1 where id;
  elsif old.status = 'doado' and new.status <> 'doado' then
    update public.impact_stats set donated = greatest(donated - 1, 0) where id;
  end if;
  return new;
end
$$;

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
    update public.impact_stats set contacts = contacts + 1 where id;
  end if;
end
$$;

-- "create or replace" mantém os privilégios, mas reforçamos por segurança.
revoke execute on function public.contar_doacao() from public, anon, authenticated;
revoke execute on function public.registrar_interesse(uuid) from public, anon, authenticated;
grant execute on function public.registrar_interesse(uuid) to service_role;
