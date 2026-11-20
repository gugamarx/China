-- NoelGame — schema Supabase (Blueprint v4.0). Rodar no SQL Editor do Supabase.

create extension if not exists "pgcrypto";

create table public.jogos (
  id uuid primary key default gen_random_uuid(),
  token_acesso text unique not null default encode(gen_random_bytes(18), 'hex'),
  token_exclusao text unique not null default encode(gen_random_bytes(18), 'hex'),
  email_comprador text not null,
  nome_crianca text not null,
  sexo_crianca text not null check (sexo_crianca in ('M', 'F')),
  idioma text not null default 'pt',
  pais_ip text,
  plano_fotos_totais int not null check (plano_fotos_totais in (4, 6, 10)),
  cupom_usado text,
  valor_pago_centavos int not null default 0,
  moeda text not null default 'BRL',
  gateway text not null check (gateway in ('mercadopago', 'asaas', 'dodopayments', 'paddle', 'stripe', 'pix_manual', 'cupom_100')),
  payment_id text unique,
  status text not null default 'pendente' check (status in ('pendente', 'pago', 'publicado', 'expirado')),
  fotos_keys jsonb default '[]'::jsonb,
  consentimento_parental boolean not null default false,
  consentimento_marketing boolean not null default false,
  consentimento_ip_hash text,
  consentimento_em timestamptz,
  aviso_45d_enviado boolean not null default false,
  renovado_ate timestamptz,
  criado_em timestamptz not null default now(),
  expira_em timestamptz not null default (now() + interval '60 days')
);

create table public.cupons (
  codigo text primary key,
  desconto_percentual int not null check (desconto_percentual between 0 and 100),
  max_usos int not null default 100,
  usos_atuais int not null default 0,
  ativo boolean not null default true,
  afiliada text,
  comissao_percentual int not null default 0,
  descricao text,
  criado_em timestamptz not null default now()
);

create table public.eventos (
  id bigserial primary key,
  sessao text,
  evento text not null, -- preview_inicio, oferta_vista, checkout, pago, compartilhou
  pais text,
  idioma text,
  criado_em timestamptz not null default now()
);

alter table public.jogos enable row level security;
alter table public.cupons enable row level security;
alter table public.eventos enable row level security;

-- 10 Cupons de 20% OFF (100 usos cada) para grupos de mães e avós
insert into public.cupons (codigo, desconto_percentual, max_usos, descricao) values
  ('VOVO20', 20, 100, 'Grupo Avós BR'),
  ('MAMAE20', 20, 100, 'Grupo Mães BR'),
  ('NATAL20', 20, 100, 'Campanha Natal 20%'),
  ('FAMILIA20', 20, 100, 'Grupos Família'),
  ('CRECHE20', 20, 100, 'Grupos Escolinha/Creche'),
  ('GRANDMA20', 20, 100, 'Grandmas Global'),
  ('MOM20', 20, 100, 'Moms Global'),
  ('NOEL20', 20, 100, 'Noel Global 20%'),
  ('CEIA20', 20, 100, 'Semana do Natal'),
  ('AMIGAS20', 20, 100, 'Indicação Amigas');

-- 20 Cupons de 100% OFF (1 uso cada) para micro-influenciadoras
insert into public.cupons (codigo, desconto_percentual, max_usos, descricao)
select 'VIP-NOEL' || lpad(g::text, 2, '0'), 100, 1, 'Influencer Cortesia #' || g
from generate_series(1, 20) as g;

create or replace function public.consumir_cupom(p_codigo text)
returns int
language plpgsql
security definer
as $$
declare
  v_desconto int;
begin
  update public.cupons
  set usos_atuais = usos_atuais + 1
  where upper(codigo) = upper(trim(p_codigo))
    and ativo = true
    and usos_atuais < max_usos
  returning desconto_percentual into v_desconto;

  return coalesce(v_desconto, 0);
end;
$$;

create or replace function public.get_jogo_por_token(p_token text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_jogo public.jogos;
begin
  select * into v_jogo
  from public.jogos
  where token_acesso = p_token
    and status = 'publicado'
    and coalesce(renovado_ate, expira_em) > now()
  limit 1;

  if not found then
    return null;
  end if;

  return jsonb_build_object(
    'nome_crianca', v_jogo.nome_crianca,
    'sexo_crianca', v_jogo.sexo_crianca,
    'idioma', v_jogo.idioma,
    'fotos_keys', v_jogo.fotos_keys,
    'expira_em', coalesce(v_jogo.renovado_ate, v_jogo.expira_em)
  );
end;
$$;

-- ------------------------------------------------------------------
-- Acesso: o site só fala com o banco pelas Functions do Cloudflare,
-- usando a service_role key. Nada fica exposto para anon/authenticated.
-- (Projeto criado com "Grant API access to new tables automatically" DESMARCADO.)
-- ------------------------------------------------------------------
grant usage on schema public to service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;

-- As funções security definer não podem ser chamadas pela chave pública (anon)
revoke execute on function public.consumir_cupom(text) from public, anon, authenticated;
revoke execute on function public.get_jogo_por_token(text) from public, anon, authenticated;

-- ------------------------------------------------------------------
-- Hardening (migração "hardening_acesso_publico", aplicada em 20/11/2026)
-- ------------------------------------------------------------------
revoke all on table public.jogos, public.cupons, public.eventos from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
alter function public.consumir_cupom(text) set search_path = public, pg_temp;
alter function public.get_jogo_por_token(text) set search_path = public, pg_temp;
-- rls_auto_enable() é criada pelo Supabase quando "Enable RLS automatically" está marcado
do $$ begin
  if exists (select 1 from pg_proc where proname = 'rls_auto_enable') then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end $$;
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;
