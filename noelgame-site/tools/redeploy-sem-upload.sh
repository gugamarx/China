#!/usr/bin/env bash
# Republica o NoelGame SEM enviar arquivos estáticos (só manifest + Functions).
# Use quando o token da Cloudflare está nos Network secrets do ambiente: o proxy troca o
# header Authorization, e isso quebra o upload de arquivos do `wrangler pages deploy`.
# Funciona só se nenhum arquivo de public/ mudou desde o último deploy completo
# (ex.: para aplicar um secret novo ou mudar só as Functions).
set -euo pipefail
cd "$(dirname "$0")/.."
T=$(mktemp -d); trap 'rm -r "$T"' EXIT
A=https://api.cloudflare.com/client/v4/accounts/9df6fc1d6ad4008d0f7782295ce382bf/pages/projects/noelgame
(cd "$T" && npm init -y >/dev/null && npm i blake3-wasm@2.1.5 >/dev/null 2>&1)
NODE_PATH="$T/node_modules" node tools/manifest.js public "$T/manifest.json"
CLOUDFLARE_API_TOKEN=proxy-injected CLOUDFLARE_ACCOUNT_ID=9df6fc1d6ad4008d0f7782295ce382bf \
  wrangler pages functions build --outfile "$T/_worker.bundle" --output-config-path "$T/config.json" \
  --output-routes-path "$T/_routes.json" --build-output-directory public >/dev/null
curl -s -X POST "$A/deployments" -F "manifest=<$T/manifest.json" -F "branch=main" \
  -F "_headers=@public/_headers" -F "_redirects=@public/_redirects" -F "_routes.json=@$T/_routes.json" \
  -F "_worker.bundle=@$T/_worker.bundle" -F "functions-filepath-routing-config.json=@$T/config.json" \
  | python3 -c "import sys,json;d=json.load(sys.stdin);print('ok' if d['success'] else d['errors'], (d.get('result') or {}).get('url',''))"
