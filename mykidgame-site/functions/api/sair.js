// Cloudflare Pages Function — descadastro em 1 clique
// GET  /api/sair?email=<email>&t=<hmac>  → remove da lista e mostra confirmação
// POST /api/sair?email=<email>&t=<hmac>  → mesmo efeito (RFC 8058, header List-Unsubscribe-Post)
//
// t = HMAC-SHA256(UNSUB_SECRET, email em minúsculas), em hex.
// Para gerar o link num e-mail (Node/Workers):
//   const t = await hmacHex(env.UNSUB_SECRET, email.toLowerCase());
//   const link = `https://<dominio>/api/sair?email=${encodeURIComponent(email)}&t=${t}`;

export async function onRequestGet(ctx) { return handle(ctx, 'html'); }
export async function onRequestPost(ctx) { return handle(ctx, 'json'); }

async function handle({ request, env }, mode) {
  const url = new URL(request.url);
  const email = String(url.searchParams.get('email') || '').trim().toLowerCase();
  const t = String(url.searchParams.get('t') || '').toLowerCase();
  const en = url.searchParams.get('lang') === 'en';

  if (!env.UNSUB_SECRET || !env.LISTA) return reply(mode, 500, en, 'cfg');
  if (!email || !/^[0-9a-f]{64}$/.test(t)) return reply(mode, 400, en, 'bad');

  const expected = await hmacHex(env.UNSUB_SECRET, email);
  if (!safeEqual(expected, t)) return reply(mode, 403, en, 'bad');

  await env.LISTA.delete(`email:${email}`);

  if (env.RESEND_API_KEY && env.RESEND_AUDIENCE_ID) {
    try {
      await fetch(`https://api.resend.com/audiences/${env.RESEND_AUDIENCE_ID}/contacts/${encodeURIComponent(email)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${env.RESEND_API_KEY}` },
      });
    } catch {}
  }
  return reply(mode, 200, en, 'ok');
}

async function hmacHex(secret, msg) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(msg));
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

const MSG = {
  ok:  { pt: ['Pronto, você saiu da lista', 'Seu e-mail foi removido e você não vai receber mais e-mails de novidades da MyKidGame.'],
         en: ["Done, you're unsubscribed", "Your email was removed and you won't receive any more MyKidGame news emails."] },
  bad: { pt: ['Link inválido', 'Este link de descadastro não é válido. Escreva para hohoho@noelgame.app que removemos você manualmente.'],
         en: ['Invalid link', "This unsubscribe link isn't valid. Email hohoho@noelgame.app and we'll remove you manually."] },
  cfg: { pt: ['Erro temporário', 'Tente de novo em alguns minutos ou escreva para hohoho@noelgame.app.'],
         en: ['Temporary error', 'Please try again in a few minutes or email hohoho@noelgame.app.'] },
};

function reply(mode, status, en, key) {
  const [title, text] = MSG[key][en ? 'en' : 'pt'];
  const headers = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' };
  if (mode === 'json') {
    return new Response(JSON.stringify({ ok: status === 200 }), { status, headers: { ...headers, 'Content-Type': 'application/json' } });
  }
  const html = `<!DOCTYPE html><html lang="${en ? 'en' : 'pt-BR'}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${title} · MyKidGame</title><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/legal.css"></head><body><main class="wrap center"><div class="box"><h1 class="px">${title}</h1><p>${text}</p><p><a class="btn" href="/${en ? '?lang=en' : ''}">${en ? '← Back to home' : '← Voltar ao início'}</a></p></div></main></body></html>`;
  return new Response(html, { status, headers: { ...headers, 'Content-Type': 'text/html; charset=utf-8' } });
}
