#!/usr/bin/env bash
# Activa los aportes con tarjeta/PSE/Nequi (Wompi) en dialmedio.org/apoya.
# Ejecútalo desde la carpeta dial-web:  bash scripts/activar-wompi.sh
# Antes: poner la llave pública (pub_prod_…) en wrangler.jsonc → vars.WOMPI_PUBLIC_KEY.
# Te pide pegar el secreto de integridad (no se muestra en pantalla ni se guarda en el repo).
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; . ./.env; set +a   # token de la cuenta de Cloudflare de Dial

echo
echo "Wompi → Desarrollo → Programadores, en modo PRODUCCIÓN → Secretos para integración técnica."
echo "-> Pega el secreto de INTEGRIDAD (empieza por prod_integrity_) y presiona Enter:"
npx wrangler secret put WOMPI_INTEGRITY_SECRET --name dial-medio

echo
echo "Listo. En unos segundos dialmedio.org/apoya mostrará el bloque «Un aporte en línea»."
