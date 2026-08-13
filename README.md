# CNA Taquara — Teste de Nível Online (captura de leads)

Landing page de teste de nível de inglês para campanhas de tráfego pago. Stack: HTML único + Supabase (banco) + GitHub Pages (hospedagem). Sem build, sem dependências para instalar.

## Arquivos

| Arquivo | O que é |
|---|---|
| `index.html` | Página completa: formulário de lead, teste de 12 perguntas, resultado e CTA de WhatsApp |
| `termos-lgpd.html` | Termos de Uso e Política de Privacidade (LGPD) |
| `politica-cookies.html` | Política de Cookies |
| `supabase-setup.sql` | Script para criar a tabela e as regras de segurança no Supabase |

## Como funciona o teste

- 12 perguntas de múltipla escolha, em 4 blocos de dificuldade crescente (baseados nos Oral Placement Tests oficiais: Fly → Progression → Expansion → Gold/Platinum).
- Uma pergunta por tela, feedback imediato (verde/vermelho), avanço automático. Dura ~3 minutos.
- Resultado: o nível é o último bloco em que a pessoa acerta 2 de 3. Mapeamento:
  - Bloco 1 reprovado → **Iniciante** (CNA Fly 1)
  - Bloco 1 ok, 2 não → **Básico** (CNA Fly)
  - Bloco 2 ok, 3 não → **Intermediário** (CNA Progression)
  - Bloco 3 ok, 4 não → **Pré-avançado** (CNA Expansion)
  - Bloco 4 ok → **Avançado** (CNA Gold / Platinum)
- O resultado sempre traz o aviso de que é preliminar e convida para o teste oral gratuito (alinhado ao procedimento oficial: QI CNA → Oral Placement Test).

## Captura do lead

- O lead é salvo no Supabase **antes** do teste começar (nome, idade, telefone validado, aceites, UTMs). Se a pessoa abandonar no meio, o contato já está garantido.
- Ao concluir, o mesmo registro é atualizado com nível, acertos e respostas.
- Menor de 18 anos: o formulário exige o aceite do responsável legal (checkbox extra), em linha com LGPD art. 14 e ECA Digital.
- Parâmetros `utm_source`, `utm_medium`, `utm_campaign` e `utm_content` são capturados automaticamente da URL — use-os nos links dos anúncios para medir canal de verdade (nada de "Flyer" 😄).

## Passo a passo para publicar

### 1. Supabase
1. No projeto do Supabase, abra **SQL Editor** e rode o conteúdo de `supabase-setup.sql`.
2. Em **Settings → API**, copie a **Project URL** e a **anon public key**.

### 2. Configurar a página
No topo do `<script>` em `index.html`, preencha:

```js
const CONFIG = {
  SUPABASE_URL: "https://SEU-PROJETO.supabase.co",
  SUPABASE_ANON_KEY: "sua-anon-key",
  WHATSAPP: "5521XXXXXXXXX",   // número da unidade com 55 + DDD
  TABELA: "leads_teste_nivel"
};
```

> A anon key é pública por natureza (vai no navegador de qualquer forma). A segurança vem das policies RLS: o público só insere/atualiza, nunca lê.

### 3. Pendências [CONFIRMAR] antes de ir ao ar
- Número de WhatsApp da unidade (em `index.html`, CONFIG.WHATSAPP)
- Razão social e CNPJ (em `termos-lgpd.html`)
- E-mail de contato para direitos do titular (em `termos-lgpd.html`)

### 4. GitHub Pages
1. Crie um repositório (ex.: `cnataquara-testedenivel`) e suba os 4 arquivos na raiz.
2. Em **Settings → Pages**, escolha a branch `main` e a pasta `/ (root)`.
3. A página fica em `https://SEU-USUARIO.github.io/cnataquara-testedenivel/`.

### 5. Links de campanha (exemplo)
```
https://SEU-USUARIO.github.io/cnataquara-testedenivel/?utm_source=meta&utm_medium=paid&utm_campaign=teste-nivel-agosto&utm_content=reels-01
```

## Acompanhamento dos leads

No painel do Supabase, **Table Editor → leads_teste_nivel**. Consulta útil (SQL Editor):

```sql
select created_at, nome, idade, telefone, resultado_nivel, acertos,
       utm_source, utm_campaign, concluido
from leads_teste_nivel
order by created_at desc;
```

## Se quiser evoluir depois

- Adicionar Meta Pixel / Google Tag para otimizar as campanhas por conversão (atualizar a Política de Cookies antes).
- Colocar o logo e a Dani (recorte transparente) na página — hoje ela usa o wordmark em texto para não depender de assets.
- Versão do teste para Espanhol (En Contacto) reaproveitando a mesma estrutura.
- Dashboard de leads dentro do CRM unificado (mesma instância Supabase).
