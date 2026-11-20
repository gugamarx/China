// Cloudflare Pages Function — POST /api/lista-espera
// Binding KV obrigatório: LISTA. Secrets: UNSUB_SECRET (obrigatório para gerar o link de descadastro),
// RESEND_API_KEY + RESEND_AUDIENCE_ID (opcionais, para também enviar ao Resend Audiences).

const CONSENT_VERSION = '2026-11-20';

export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); } catch { return json({ ok: false }, 400); }

  // honeypot: bots preenchem o campo "site"; respondemos ok sem gravar nada
  if (body.site) return json({ ok: true });

  const email = String(body.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200 || body.consentimento !== true) {
    return json({ ok: false, erro: 'dados inválidos' }, 400);
  }
  if (!env.LISTA) return json({ ok: false, erro: 'KV não configurado' }, 500);

  const registro = {
    email,
    tema: String(body.tema || "noelgame").replace(/[^a-z0-9_-]/gi, '').slice(0, 30) || 'todos',
    idioma: body.idioma === 'en' ? 'en' : 'pt',
    consentimento_marketing: true,
    consentimento_versao: CONSENT_VERSION,
    pais: request.cf?.country || null,
    criado_em: new Date().toISOString(),
  };
  await env.LISTA.put(`email:${email}`, JSON.stringify(registro));

  if (env.RESEND_API_KEY && env.RESEND_AUDIENCE_ID) {
    try {
      await fetch(`https://api.resend.com/audiences/${env.RESEND_AUDIENCE_ID}/contacts`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, unsubscribed: false }),
      });
    } catch {}
  }

  return json({ ok: true });
}

const json = (d, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
