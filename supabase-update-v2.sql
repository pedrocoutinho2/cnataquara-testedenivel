-- ============================================================
-- CNA Taquara — Teste de Nível Online — ATUALIZAÇÃO v2
-- Rodar no SQL Editor do Supabase (a tabela v1 já deve existir)
-- ============================================================

-- Novas colunas para a etapa de conversação e avaliação por IA
alter table public.leads_teste_nivel
  add column if not exists respostas_abertas jsonb,   -- [{pergunta, resposta, modo: falado|escrito}]
  add column if not exists avaliacao_ia jsonb,        -- {notas[], nivel_sugerido, resumo_consultor,...}
  add column if not exists avaliado_em timestamptz;

-- Consulta útil para a equipe comercial: fila de contato
-- (nível e avaliação ficam SÓ aqui — o aluno nunca vê)
/*
select
  created_at,
  nome, idade, telefone,
  acertos || '/' || total_perguntas as objetivas,
  resultado_nivel                    as nivel_objetivas,
  avaliacao_ia->>'nivel_sugerido'    as nivel_ia,
  avaliacao_ia->>'resumo_consultor'  as resumo_para_contato,
  utm_source, utm_campaign,
  concluido
from leads_teste_nivel
order by created_at desc;
*/
