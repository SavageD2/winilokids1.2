#!/bin/sh
set -eu

cat <<EOF >/usr/share/nginx/html/app-config.js
window.__WINILO_CONFIG__ = {
  apiBaseUrl: "${WINILO_API_BASE_URL:-/api}",
};
EOF
