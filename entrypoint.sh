#!/bin/sh
CONFIG_JS="window.__CONFIG__ = { apiUrl: \"${API_URL}\" };"

sed -i "s|<script id=\"runtime-config\"></script>|<script id=\"runtime-config\">${CONFIG_JS}</script>|g" /usr/share/nginx/html/index.html

exec nginx -g "daemon off;"