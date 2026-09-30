# CLAUDE.md · cnataquara-testedenivel

Instruções permanentes para sessões do Claude neste repo.

## O que é

Landing page de teste de nível de inglês do CNA (nasceu no CNA Taquara). Captação e
qualificação de lead para campanha de tráfego pago.

- Produção: https://testedenivel.cnataquara.com.br
- Supabase: `gpnwmsnayrqjcmhqrtpx` (o **mesmo** do CRM)
- Nome do repo segue o padrão da unidade: `cnataquara-{subdomínio}`

Já existe documentação no repo. Leia antes de mexer:

| Arquivo | Para quê |
|---|---|
| `README.md` | Como o teste funciona, arquivos, deploy |
| `INSTRUCOES-V2.md` | Mudanças da versão 2 |

## Arquitetura

Sem build. `index.html` com ~965 linhas e **dois** blocos `<script>` (os
outros sistemas da unidade têm um só, não presuma).

```
index.html               formulário de lead, teste, resultado, CTA de WhatsApp
termos-lgpd.html         Termos de Uso e Política de Privacidade
politica-cookies.html    Política de Cookies
supabase-setup.sql       tabela e regras de segurança
supabase-update-v2.sql   migração da v2
supabase/functions/avaliar-respostas/index.ts   correção das abertas
CNAME                    testedenivel.cnataquara.com.br
```

Usa `supabase-js` via CDN:

```js
const CONFIG = { SUPABASE_URL: "https://gpnwmsnayrqjcmhqrtpx.supabase.co", SUPABASE_ANON_KEY: "..." };
sb = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
```

A anon key fica no arquivo, o que é normal: ela é pública por desenho e a
proteção real é RLS. Nunca coloque service role key aqui.

RPC de conclusão: `fn_concluir_teste_nivel`.

### Base única multiunidade (desde 30/09/2026)

O banco `gpnwmsnayrqjcmhqrtpx` ("CRM CNA") é a base única da rede. Tabela de
dado de unidade tem coluna `unidade` (slug de `crm_unidades`). Globais, sem
`unidade`: `crm_unidades`, `crm_modulos`, `crm_papel_permissoes`,
`crm_usuarios`, `crm_sessoes`.

- A página descobre a unidade por `?unidade=<slug>`, validada em
  `crm_unidades` (status diferente de `inativa`). Sem parâmetro ou com slug
  inválido: `taquara`, para os links e QR codes antigos continuarem valendo.
- O insert em `leads_teste_nivel` manda `unidade`; o lead cai no CRM daquela
  unidade.
- Nome exibido vem de `crm_unidades.nome`; WhatsApp do botão vem de
  `crm_configs.whatsapp_contato` da unidade (sem ele, o botão some).
- **Proibido `if` por nome ou slug de unidade.** Comportamento por unidade vem
  do banco (`crm_unidades` e configs com coluna `unidade`).
- O resultado continua mostrando **só a pontuação**, nunca o nível.

No CRM, login é por vínculo (`crm_usuario_unidades`) e `crm_definir_senha` está
depreciada (use `crm_equipe_definir_senha`).

## O teste

12 perguntas de múltipla escolha em 4 blocos de dificuldade crescente,
baseados nos Oral Placement Tests oficiais (Fly, Progression, Expansion,
Gold/Platinum). Uma por tela, feedback imediato, avanço automático, ~3 minutos.

Dois bancos de questão aberta: `OPEN_BANK_A` (pessoal e presente, acessível a
todos os níveis) e `OPEN_BANK_B` (passado, futuro e hipótese, o que diferencia
nível). A correção das abertas roda na Edge Function `avaliar-respostas`.

`CURSO_MAP` traduz resultado em curso recomendado.

## Marca

`MONSTRO_LABELS` carrega o mote de campanha "monstrão". Manter. É assinatura da
unidade, não gracinha solta.

Em conteúdo público sobre curso infantil, use "Crianças" **sem faixa de idade**.
Comunicação que envolve menor é dirigida a pai ou responsável (ECA Digital).

Sem travessão em texto de copy. Endereço é sempre Estrada da Soca, **129**.

## Convivência com o CRM

Mesmo banco do CRM e do escape room. Lead gerado aqui alimenta o funil
comercial. Não crie tabela solta sem prefixo, e não escreva em `crm_*` sem
passar pelo padrão de deduplicação (`crm_wa_chave()` normaliza telefone por
DDD + últimos 8 dígitos).

## Deploy

Nunca entregue arquivo para upload manual. Sempre via API do GitHub.

1. Valide o JS com `node --check` antes de commitar. **São dois blocos
   `<script>`**, valide os dois
2. `GET` do arquivo para pegar o `sha`
3. `PUT` em `contents` com `sha` + conteúdo em base64
4. Poll em `pages/builds/latest` até `built`
5. Confirme lendo via API com `Accept: application/vnd.github.raw`

## Regras

- Busque o arquivo atual antes de editar. Nunca escreva de memória.
- Confirme com o Pedro antes de qualquer operação destrutiva no banco.
