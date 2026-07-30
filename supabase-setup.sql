-- ============================================================
-- CNA Taquara — Teste de Nível Online
-- Setup do Supabase (rodar no SQL Editor do projeto)
-- ============================================================

create table if not exists public.leads_teste_nivel (
  id uuid primary key,
  created_at timestamptz not null default now(),

  -- dados do lead
  nome text not null,
  idade int,
  telefone text not null,
  aceite_lgpd boolean not null default false,
  aceite_cookies boolean not null default false,
  responsavel_autorizou boolean,          -- true quando idade < 18

  -- atribuição de campanha
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,

  -- resultado do teste
  resultado_nivel text,                   -- Iniciante | Básico | Intermediário | Pré-avançado | Avançado
  curso_recomendado text,                 -- CNA Fly, Progression, Expansion, Gold/Platinum
  acertos int,
  total_perguntas int,
  respostas jsonb,                        -- detalhe pergunta a pergunta
  concluido boolean not null default false,
  concluido_em timestamptz
);

-- Índices úteis para acompanhamento
create index if not exists idx_leads_tn_created on public.leads_teste_nivel (created_at desc);
create index if not exists idx_leads_tn_concluido on public.leads_teste_nivel (concluido);
create index if not exists idx_leads_tn_campanha on public.leads_teste_nivel (utm_campaign);

-- ============================================================
-- Segurança (RLS)
-- A página usa a chave ANON. O público pode:
--   - INSERIR um lead (início do teste)
--   - ATUALIZAR o próprio lead (fim do teste), apenas conhecendo o UUID
-- O público NÃO pode ler nada (sem policy de SELECT para anon).
-- A leitura dos leads é feita só pelo painel do Supabase ou service_role.
-- ============================================================

alter table public.leads_teste_nivel enable row level security;

drop policy if exists "anon pode inserir lead" on public.leads_teste_nivel;
create policy "anon pode inserir lead"
  on public.leads_teste_nivel
  for insert
  to anon
  with check (true);

drop policy if exists "anon pode atualizar resultado" on public.leads_teste_nivel;
create policy "anon pode atualizar resultado"
  on public.leads_teste_nivel
  for update
  to anon
  using (true)
  with check (true);

-- Observação: como não há policy de SELECT para anon, ninguém consegue
-- listar leads pela API pública. O update exige conhecer o UUID exato
-- (gerado aleatoriamente no navegador), o que impede alteração de
-- registros de terceiros na prática.
