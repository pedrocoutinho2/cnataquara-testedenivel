// ============================================================
// CNA Taquara — Edge Function: avaliar-respostas
// Recebe as respostas abertas do teste de nível, avalia com IA
// (Claude Haiku) e grava a avaliação no registro do lead.
// A chave da IA fica em segredo no Supabase, nunca no navegador.
// ============================================================

import { createClient } from "npm:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const { lead_id, respostas_abertas, mcq } = await req.json();

    if (!lead_id || !Array.isArray(respostas_abertas) || respostas_abertas.length === 0) {
      return json({ ok: false, error: "payload inválido" }, 400);
    }

    // Limites defensivos (evita abuso do endpoint)
    const respostas = respostas_abertas.slice(0, 3).map((r: any) => ({
      pergunta: String(r.pergunta ?? "").slice(0, 200),
      resposta: String(r.resposta ?? "").slice(0, 800),
      modo: r.modo === "falado" ? "falado" : "escrito",
    }));

    const prompt = `Você é avaliador de teste de nivelamento de inglês de uma escola de idiomas brasileira (CNA). Um candidato respondeu perguntas abertas em inglês, falando (transcrição automática de voz, pode conter pequenos erros de transcrição — não penalize por isso) ou escrevendo.

Resultado das questões objetivas do candidato: ${mcq?.acertos ?? "?"}/12 acertos (bloco básico: ${mcq?.blocos?.b1 ?? "?"}/3, intermediário 1: ${mcq?.blocos?.b2 ?? "?"}/3, intermediário 2: ${mcq?.blocos?.b3 ?? "?"}/3, avançado: ${mcq?.blocos?.b4 ?? "?"}/3).

Respostas abertas:
${respostas.map((r, i) => `${i + 1}. Pergunta: "${r.pergunta}" (respondida por ${r.modo})\nResposta: "${r.resposta}"`).join("\n\n")}

Avalie cada resposta considerando: a resposta está em inglês? É compreensível? Responde à pergunta? Qual a complexidade gramatical e o vocabulário demonstrados? Resposta em português, vazia, sem sentido ou copiada da pergunta recebe nota 0.

Responda APENAS com JSON válido, sem markdown, neste formato exato:
{"notas":[{"pergunta":1,"nota":0,"comentario":"..."}],"nivel_sugerido":"Iniciante|Básico|Intermediário|Pré-avançado|Avançado","coerente_com_objetivas":true,"resumo_consultor":"1-2 frases em português para o consultor comercial usar no contato"}

Escala de nota: 0 (inválida/português), 1 (muito básica mas em inglês), 2 (comunica bem, erros comuns), 3 (fluente e natural). O nivel_sugerido deve combinar as objetivas com as abertas.`;

    const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": Deno.env.get("ANTHROPIC_API_KEY") ?? "",
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 700,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!aiRes.ok) {
      const errBody = await aiRes.text();
      console.error("Erro Anthropic:", aiRes.status, errBody);
      return json({ ok: false, error: "falha na avaliação" }, 502);
    }

    const data = await aiRes.json();
    const raw = (data.content ?? [])
      .filter((c: any) => c.type === "text")
      .map((c: any) => c.text)
      .join("");
    const clean = raw.replace(/```json|```/g, "").trim();

    let avaliacao: unknown;
    try {
      avaliacao = JSON.parse(clean);
    } catch {
      console.error("IA não retornou JSON válido:", clean);
      avaliacao = { erro: "resposta não estruturada", bruto: clean.slice(0, 500) };
    }

    // Grava com service role (o público não consegue chamar o banco diretamente para ler)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { error } = await supabase
      .from("leads_teste_nivel")
      .update({ avaliacao_ia: avaliacao, avaliado_em: new Date().toISOString() })
      .eq("id", lead_id);

    if (error) {
      console.error("Erro ao gravar avaliação:", error);
      return json({ ok: false, error: "falha ao gravar" }, 500);
    }

    return json({ ok: true });
  } catch (e) {
    console.error(e);
    return json({ ok: false, error: String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "content-type": "application/json" },
  });
}
