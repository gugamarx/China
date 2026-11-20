// Tabela de preços (Blueprint v4). Índices: 0 = +3 fotos (4 total), 1 = +5 (6 total), 2 = +9 (10 total).
export const PLANOS = [4, 6, 10];
export const PRECOS = {
  BRL: [24.99, 30.00, 45.99],
  EUR: [5.99, 7.99, 10.99],
  GBP: [5.99, 7.99, 10.99],
  USD: [5.99, 7.99, 10.99],
};
export const RENOVACAO = { BRL: 9.90, USD: 2.99 };
const EURO = new Set('AT BE CY DE EE ES FI FR GR HR IE IT LT LU LV MT NL PT SI SK'.split(' '));

export function regiao(country) {
  const c = String(country || '').toUpperCase();
  if (c === 'BR') return { regiao: 'BR', moeda: 'BRL' };
  if (c === 'GB') return { regiao: 'GLOBAL', moeda: 'GBP' };
  if (EURO.has(c)) return { regiao: 'GLOBAL', moeda: 'EUR' };
  return { regiao: 'GLOBAL', moeda: 'USD' };
}

// Interruptor de gateway por região, lido das variáveis de ambiente do Pages.
// GATEWAY_BR: disabled | mercadopago | asaas | pix_manual
// GATEWAY_GLOBAL: disabled | dodopayments | paddle
export function gateway(env, reg) {
  return (reg === 'BR' ? env.GATEWAY_BR : env.GATEWAY_GLOBAL) || 'disabled';
}

// Cupons públicos de 20% (temporário, até a tabela `cupons` do Supabase entrar).
// Os de 100% (VIP-NOEL01..20) só serão aceitos via Supabase, com consumo atômico.
export const CUPONS_20 = new Set(['VOVO20', 'MAMAE20', 'NATAL20', 'FAMILIA20', 'CRECHE20', 'GRANDMA20', 'MOM20', 'NOEL20', 'CEIA20', 'AMIGAS20']);

export const json = (d, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
