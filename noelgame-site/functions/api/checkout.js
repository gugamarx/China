// POST /api/checkout — camada abstrata de pagamento.
// Hoje: gateways desligados → responde { status: 'em_breve' } e, com opt-in, inscreve o e-mail na lista (KV LISTA).
// Segunda: criar o registro em `jogos` (Supabase, status 'pendente') e chamar o gateway da região.
import { PRECOS, PLANOS, CUPONS_20, regiao, gateway, json } from '../../lib/precos.js';

export async function onRequestPost({ request, env }) {
  let b;
  try { b = await request.json(); } catch { return json({ ok: false }, 400); }

  const email = String(b.email || '').trim().toLowerCase();
  const nome = String(b.nome || '').trim().slice(0, 16);
  const idx = PLANOS.indexOf(Number(b.plano));
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !nome || !['M', 'F'].includes(b.sexo) || idx < 0 || b.consentimento_parental !== true) {
    return json({ ok: false, erro: 'dados inválidos' }, 400);
  }

  const r = regiao(request.cf?.country);
  const cupom = String(b.cupom || '').toUpperCase();
  const desconto = CUPONS_20.has(cupom) ? 20 : 0;
  const valor = Math.round(PRECOS[r.moeda][idx] * (100 - desconto)) / 100;
  const pedido = { email, nome, sexo: b.sexo, plano_fotos_totais: PLANOS[idx], moeda: r.moeda, valor, cupom: desconto ? cupom : null,
                   idioma: b.idioma === 'en' ? 'en' : 'pt', pais: request.cf?.country || null, marketing: b.consentimento_marketing === true };

  const gw = gateway(env, r.regiao);
  switch (gw) {
    case 'disabled': {
      if (pedido.marketing && env.LISTA) {
        await env.LISTA.put(`email:${email}`, JSON.stringify({
          email, tema: 'noelgame', idioma: pedido.idioma, consentimento_marketing: true, consentimento_versao: '2026-11-20',
          origem: 'checkout_em_breve', pais: pedido.pais, criado_em: new Date().toISOString(),
        }));
      }
      return json({ status: 'em_breve', avisaremos: pedido.marketing });
    }
    case 'mercadopago':  return json(await mercadoPago(env, pedido, request), 200);
    case 'dodopayments': return json(await dodo(env, pedido, request), 200);
    case 'paddle':       return json(await paddle(env, pedido, request), 200);
    default:             return json({ ok: false, erro: `gateway desconhecido: ${gw}` }, 500);
  }
}

// ---- TODO (segunda): implementar cada gateway e devolver { url } do checkout ----
async function mercadoPago(env, pedido) {
  // POST https://api.mercadopago.com/checkout/preferences  (Authorization: Bearer env.MP_ACCESS_TOKEN)
  // items:[{title:`NoelGame ${pedido.plano_fotos_totais} fotos`, quantity:1, unit_price:pedido.valor, currency_id:'BRL'}],
  // payer:{email}, external_reference:<id do jogo no Supabase>, notification_url:<origem>/api/webhook-mp, back_urls + auto_return
  return { ok: false, erro: 'mercadopago ainda não implementado' };
}
async function dodo(env, pedido) { return { ok: false, erro: 'dodopayments ainda não implementado' }; }
async function paddle(env, pedido) { return { ok: false, erro: 'paddle ainda não implementado' }; }
