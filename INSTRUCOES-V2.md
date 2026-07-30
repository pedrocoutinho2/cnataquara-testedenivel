# Atualização v2 — Teste de Nível CNA Taquara

## O que mudou

**1. Resultado sem nível.** O aluno agora vê apenas: parabéns com o primeiro nome + quantos acertos (ex.: 9/12) + convite para chamar no WhatsApp e descobrir o resultado completo. O nível calculado (`resultado_nivel`) continua sendo salvo no Supabase, mas só a equipe vê. A mensagem pré-preenchida do WhatsApp também não menciona nível, só os acertos.

**2. Etapa de conversação (falando ou escrevendo).** Depois das 12 objetivas, entram 2 perguntas abertas em inglês ("Tell me about yourself and your family" e "Why do you want to improve your English?"). A pessoa pode:
- **Falar** 🎤 — o navegador transcreve a voz em tempo real (Web Speech API, sem custo). O texto aparece na caixa e pode ser editado.
- **Escrever** — digita direto na caixa.
- **Pular** — link discreto "Prefiro pular"; o lead já está capturado de qualquer forma.

**3. Avaliação por IA.** As respostas abertas são enviadas a uma Edge Function no Supabase, que chama o Claude (modelo Haiku, o mais barato) com uma rubrica: nota 0–3 por resposta, nível sugerido combinando objetivas + abertas, e um resumo em português pronto para o consultor usar no contato. Tudo gravado em `avaliacao_ia` no banco. O aluno não vê nada disso — a tela de resultado aparece na hora, sem esperar a IA.

## Por que Edge Function (importante)

O GitHub Pages é 100% estático: qualquer chave colocada no `index.html` fica visível no código-fonte para qualquer visitante. A Edge Function resolve isso — a chave da Anthropic fica guardada como segredo no Supabase e nunca chega ao navegador. Detalhe de privacidade: a função envia à IA apenas o texto das respostas, sem nome nem telefone (e os termos LGPD já foram atualizados refletindo isso).

## Passo a passo da atualização

### 1. Banco
No SQL Editor do Supabase, rode `supabase-update-v2.sql` (adiciona 3 colunas).

### 2. Chave da IA
1. Crie uma chave em https://console.anthropic.com (Settings → API Keys). Coloque um crédito pequeno (US$ 5 dura MUITO — cada avaliação custa fração de centavo com o Haiku).
2. No painel do Supabase: **Edge Functions → Secrets → Add secret**
   - Nome: `ANTHROPIC_API_KEY`
   - Valor: a chave criada

### 3. Publicar a função
Opção mais simples, pelo painel:
1. **Edge Functions → Deploy a new function → Via Editor**
2. Nome: `avaliar-respostas`
3. Cole o conteúdo de `supabase/functions/avaliar-respostas/index.ts` e publique.

Alternativa por linha de comando (se preferir):
```bash
npx supabase functions deploy avaliar-respostas --project-ref SEU_PROJECT_REF
```

### 4. Página
Substitua o `index.html` do repositório pelo novo (lembrando de recolocar seus valores no bloco `CONFIG` — URL do Supabase, anon key e WhatsApp). Suba também o `termos-lgpd.html` atualizado.

### 5. Testar
Faça o teste completo respondendo uma pergunta aberta por voz e outra por texto. Depois confira no **Table Editor → leads_teste_nivel** se as colunas `respostas_abertas` e `avaliacao_ia` foram preenchidas (a avaliação chega alguns segundos depois da conclusão).

## Compatibilidade do microfone

| Navegador | Voz funciona? |
|---|---|
| Chrome (Android e desktop) | ✅ |
| Edge | ✅ |
| Safari (iPhone/Mac) | ✅ na maioria das versões recentes |
| Firefox | ❌ — o botão de microfone some sozinho e a pessoa responde escrevendo |

A página detecta automaticamente: sem suporte a voz, mostra só a caixa de texto. Ninguém fica travado.

## Visão do consultor (consulta pronta)

```sql
select created_at, nome, telefone,
       acertos || '/12' as objetivas,
       resultado_nivel as nivel_objetivas,
       avaliacao_ia->>'nivel_sugerido' as nivel_ia,
       avaliacao_ia->>'resumo_consultor' as resumo_para_contato
from leads_teste_nivel
where concluido
order by created_at desc;
```

O `resumo_consultor` vem pronto em português — dá para o Marlon, a Sabrina e a Camila usarem direto no primeiro contato.
