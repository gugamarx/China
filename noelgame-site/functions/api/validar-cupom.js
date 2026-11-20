// GET /api/validar-cupom?c=CODIGO → { ok, desconto }
// Lê a tabela `cupons` do Supabase (secrets SUPABASE_URL + SUPABASE_SERVICE_KEY).
// Se o Supabase não estiver configurado ou falhar, usa a lista fixa de cupons de 20%.
// Só valida: o consumo atômico (consumir_cupom) acontece no checkout.
import { CUPONS_20, json } from '../../lib/precos.js';

export async function onRequestGet({ request, env }) {
  const c = new URL(request.url).searchParams.get('c')?.trim().toUpperCase() || '';
  if (!/^[A-Z0-9-]{3,20}$/.test(c)) return json({ ok: false });

  if (env.SUPABASE_URL && env.SUPABASE_SERVICE_KEY) {
    try {
      const r = await fetch(`${env.SUPABASE_URL}/rest/v1/cupons?codigo=eq.${encodeURIComponent(c)}&ativo=is.true&select=desconto_percentual,usos_atuais,max_usos`, {
        headers: { apikey: env.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}` },
      });
      if (r.ok) {
        const [row] = await r.json();
        if (row && row.usos_atuais < row.max_usos) return json({ ok: true, codigo: c, desconto: row.desconto_percentual });
        return json({ ok: false });
      }
    } catch {}
  }
  if (CUPONS_20.has(c)) return json({ ok: true, codigo: c, desconto: 20 });
  return json({ ok: false });
}
