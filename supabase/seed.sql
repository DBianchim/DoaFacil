-- =============================================================================
-- Dados de exemplo para desenvolvimento. NÃO rode em produção.
--
-- O doador de demonstração tem a chave "demo-doafacil-chave-de-teste"
-- (abra /minhas?k=demo-doafacil-chave-de-teste para gerenciar estes itens).
--
-- Para apagar tudo antes de colocar no ar:
--   delete from public.donors where key_hash = '791fdacab568e366174f9c2361f30f5d827ef8df79d84169c9fad9b55f066a00';
--   update public.impact_stats set donated = 0, contacts = 0;
-- =============================================================================

-- Recomeça do zero a cada execução (os itens do doador saem em cascata).
delete from public.donors where key_hash = '791fdacab568e366174f9c2361f30f5d827ef8df79d84169c9fad9b55f066a00';

with doador as (
  insert into public.donors (key_hash)
  values ('791fdacab568e366174f9c2361f30f5d827ef8df79d84169c9fad9b55f066a00')
  returning id
),
novos as (
  insert into public.items
    (donor_id, title, description, category, condition, status, nickname, block, pickup_info, interest_clicks, reports, created_at, expires_at)
  select doador.id, v.title, v.description, v.category, v.condition, v.status, v.nickname, v.block, v.pickup_info,
         v.clicks, v.reports, now() - v.age, now() - v.age + interval '30 days'
  from doador,
  (values
    ('Mesa de Escritório em L', 'Mesa em formato L, cor carvalho, 160×140 cm. Usada por 2 anos em home office, sem arranhões.', 'moveis', 'boa', 'disponivel', 'Ricardo', 'A', 'Retirada na portaria, à noite.', 7, 0, interval '2 hours'),
    ('Bicicleta Infantil Aro 16', 'Com rodinhas. Pneus calibrados, precisa só de um ajuste no freio.', 'esportes', 'usada', 'disponivel', 'Marina', 'B', null, 3, 0, interval '7 hours'),
    ('Livros de Culinária (5 un)', 'Coleção com receitas brasileiras e de confeitaria.', 'livros', 'otima', 'reservado', 'Paulo', 'C', null, 2, 0, interval '1 day'),
    ('Cadeira Gamer', 'Reclinável, encosto de braço ajustável. Pequeno rasgo no assento.', 'moveis', 'boa', 'disponivel', 'Ricardo', 'A', null, 5, 0, interval '2 days'),
    ('Micro-ondas 20 L', 'Funcionando perfeitamente, troquei por um maior.', 'eletrodomesticos', 'boa', 'disponivel', 'Lúcia', null, 'Pode buscar no fim de semana.', 9, 0, interval '3 days'),
    ('Roupa Infantil Lote (0–2 anos)', 'Bodies, macacões e casacos. Tudo lavado.', 'roupas', 'otima', 'doado', 'Marina', 'B', null, 11, 0, interval '4 days'),
    ('Jaqueta Jeans Masculina M', null, 'roupas', 'usada', 'disponivel', 'Tiago', 'D', null, 1, 0, interval '5 days'),
    ('Kit Lego Clássico', 'Cerca de 400 peças, sem a caixa original.', 'brinquedos', 'boa', 'disponivel', 'Fernanda', 'C', null, 4, 0, interval '6 days'),
    ('Muda de Costela-de-Adão', 'Vaso de 20 cm incluso.', 'plantas', 'novo', 'disponivel', 'Lúcia', null, null, 2, 0, interval '8 days'),
    ('Fogão 4 Bocas', 'Acendimento automático em 3 bocas. Forno funciona bem.', 'eletrodomesticos', 'usada', 'reservado', 'Tiago', 'D', 'Precisa de 2 pessoas para carregar.', 6, 0, interval '10 days'),
    ('Tapete de Yoga', null, 'esportes', 'otima', 'disponivel', 'Fernanda', 'C', null, 0, 0, interval '12 days'),
    ('Caixa de Materiais Escolares', 'Cadernos novos, lápis de cor e mochila.', 'outros', 'novo', 'disponivel', 'Paulo', 'C', null, 3, 2, interval '20 days'),
    ('Estante de Livros 5 Prateleiras', 'Branca, 180 cm de altura. Desmontada.', 'moveis', 'boa', 'disponivel', 'Marina', 'B', null, 1, 0, interval '27 days')
  ) as v(title, description, category, condition, status, nickname, block, pickup_info, clicks, reports, age)
  returning id, nickname
)
insert into public.item_contacts (item_id, whatsapp, email, instagram, consent_at)
select id,
       '11900000000',
       lower(translate(nickname, 'úí', 'ui')) || '@exemplo.com',
       case when nickname = 'Fernanda' then 'fernanda.exemplo' end,
       now()
from novos;

update public.impact_stats set donated = 847, contacts = 1940;
