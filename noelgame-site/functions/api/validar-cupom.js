// GET /api/validar-cupom?c=CODIGO → { ok, desconto }
// TODO (segunda): ler da tabela `cupons` do Supabase (inclui VIP-NOEL 100% e afiliadas).
import { CUPONS_20, json } from '../../lib/precos.js';

export async function onRequestGet({ request }) {
  const c = new URL(request.url).searchParams.get('c')?.trim().toUpperCase() || '';
  if (CUPONS_20.has(c)) return json({ ok: true, codigo: c, desconto: 20 });
  return json({ ok: false });
}
