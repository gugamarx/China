# NoelGame (noelgame-cvo.pages.dev)

Site do NoelGame no Cloudflare Pages. HTML/CSS/JS puros, sem build.

## O que já funciona
- Landing PT/EN com **teste grátis do Peekaboo** (foto processada só no navegador, ou "Testar com o Papai Noel").
- Demonstração animada (Peekaboo + Memória) que passa a usar a foto do teste.
- Pacotes e preços por região via `GET /api/config-regiao` (BRL no Brasil; EUR/GBP/USD fora).
- Cupons públicos de 20% via `GET /api/validar-cupom?c=` (lista fixa em `lib/precos.js`).
- `POST /api/checkout` com interruptor de gateway. Com `GATEWAY_* = disabled` responde "em breve"
  e, se a pessoa marcou o opt-in, grava o e-mail na lista (`KV LISTA`, compartilhado com a MyKidGame).
- Lista de espera (`/api/lista-espera`) e descadastro com HMAC (`/api/sair`).
- Páginas legais PT/EN, 404, robots, sitemap, headers de segurança e `noindex` em `/j/*`.

## Plano para segunda
1. **Supabase**: criar o projeto e rodar `sql/schema.sql`. Secrets: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`.
2. **Checkout**: em `functions/api/checkout.js`, criar o registro em `jogos` (status `pendente`) e implementar
   `mercadoPago()` (preferência + `notification_url` → `/api/webhook-mp`), depois `dodo()`.
   Ligar com `wrangler.toml` → `GATEWAY_BR = "mercadopago"`. Secret: `MP_ACCESS_TOKEN`.
3. **Webhooks idempotentes**: `webhook-mp.js` e `webhook-global.js` (upsert por `payment_id`).
4. **Cupons**: trocar a lista fixa por `consumir_cupom` (inclui `VIP-NOEL01..20` com bypass → `criar.html`).
5. **R2 + upload**: bucket privado, `upload-fotos.js`, `img.js`, `criar.html`, `jogar.html` (`/j/[token]`).
6. **Resend**: e-mail 1 (link do jogo) e cron do Dia 45/60. Secrets: `RESEND_API_KEY`, `RESEND_AUDIENCE_ID`.
7. **Vozes ElevenLabs**: salvar os MP3 em `public/audio/<idioma>/<fala>.mp3`
   (falas usadas hoje: `achou`, `parabens`, `ops`) e trocar `AUDIO_LINES=false` para `true` no `index.html`.
8. **Domínio**: adicionar `noelgame.app` em Custom domains e trocar `noelgame-cvo.pages.dev` no robots/sitemap.

## Deploy
```bash
export CLOUDFLARE_API_TOKEN=...   # nunca commitar
wrangler pages deploy --project-name noelgame --branch main
```
