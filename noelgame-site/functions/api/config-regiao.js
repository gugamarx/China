// GET /api/config-regiao → moeda, preços e gateway ativo para o país do visitante.
import { PRECOS, PLANOS, regiao, gateway, json } from '../../lib/precos.js';

export async function onRequestGet({ request, env }) {
  const pais = request.cf?.country || null;
  const r = regiao(pais);
  return json({ pais, ...r, planos: PLANOS, precos: PRECOS[r.moeda], gateway: gateway(env, r.regiao) });
}
