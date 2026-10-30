#!/usr/bin/env bash
# End-to-end API contract checks against a real launcherd process and a real
# SQLite file. Every assertion is on observable HTTP behaviour.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
BACKEND="$ROOT/apps/pocket-launcher/backend/launcherd"
WORK="$ROOT/.tmp/api-contract"
PORT="${POCKET_LAUNCHER_TEST_PORT:-18795}"
BASE="http://127.0.0.1:$PORT"

mkdir -p "$WORK"
rm -f "$WORK/launcherd.sqlite" "$WORK/launcherd.sqlite-wal" "$WORK/launcherd.sqlite-shm"

if curl -fsS --max-time 1 "$BASE/api/health" >/dev/null 2>&1; then
  echo "port $PORT already serves something; refusing to reuse it" >&2
  exit 1
fi

(cd "$BACKEND" && go build -o "$WORK/launcherd" .)
LAUNCHER_DB="$WORK/launcherd.sqlite" LAUNCHER_ADDR="127.0.0.1:$PORT" \
  LAUNCHER_STATIC="$ROOT/apps/pocket-launcher/frontend/dist" \
  "$WORK/launcherd" >"$WORK/server.log" 2>&1 &
SERVER_PID=$!
cleanup() {
  kill "$SERVER_PID" 2>/dev/null || true
  wait "$SERVER_PID" 2>/dev/null || true
}
trap cleanup EXIT

for _ in $(seq 1 100); do
  if curl -fsS --max-time 1 "$BASE/api/health" >/dev/null 2>&1; then break; fi
  sleep 0.05
done

fail=0
check() {
  local label="$1" expected="$2" actual="$3"
  if [[ "$actual" != "$expected" ]]; then
    printf 'FAIL %s: expected [%s] got [%s]\n' "$label" "$expected" "$actual" >&2
    fail=1
  else
    printf 'ok   %s\n' "$label"
  fi
}

status_of() { curl -s -o /dev/null -w '%{http_code}' "$@"; }
jq_get() { curl -s "$BASE$1" | jq -r "$2"; }

check "health mode" "mock" "$(jq_get /api/health .mode)"
check "home mock flag" "true" "$(jq_get /api/home .mock)"
check "home has 4 activities" "4" "$(jq_get /api/home '.activities|length')"
check "home has notifications" "4" "$(jq_get /api/home '.notifications|length')"
check "capabilities include touch flag" "false" "$(jq_get /api/capabilities '.items[]|select(.id=="touch")|.available')"

check "search groups include Books" "Books" "$(jq_get '/api/search?q=quiet' '.categories[0]')"
check "empty search is rejected" "400" "$(status_of "$BASE/api/search?q=")"
check "unknown app launch is 404" "404" "$(status_of -X POST "$BASE/api/apps/does-not-exist/launch")"
check "GET on launch is 405" "405" "$(status_of "$BASE/api/apps/reader/launch")"

check "unavailable app keeps name" "GameHub" "$(curl -s -X POST "$BASE/api/apps/gamehub/launch" | jq -r .app.name)"
check "unavailable app not launched" "false" "$(curl -s -X POST "$BASE/api/apps/gamehub/launch" | jq -r .launched)"
check "available app launched" "true" "$(curl -s -X POST "$BASE/api/apps/reader/launch" | jq -r .launched)"
check "launch recorded recent use" "true" "$(jq_get /api/apps '.items[]|select(.id=="reader")|.recentlyUsed')"

curl -s -X POST "$BASE/api/apps/gamehub/pin" >/dev/null
check "pin appears on home" "gamehub" "$(jq_get /api/home '.pinnedApps[0].id')"
curl -s -X POST "$BASE/api/apps/gamehub/unpin" >/dev/null
check "unpin clears home" "0" "$(jq_get /api/home '.pinnedApps|length')"

check "invalid reorder rejected" "400" "$(status_of -X PUT "$BASE/api/apps" -H 'content-type: application/json' -d '{"ids":["reader"]}')"
REORDER='{"ids":["settings","reader","music","video","files","gamehub","store"]}'
check "reorder accepted" "200" "$(status_of -X PUT "$BASE/api/apps" -H 'content-type: application/json' -d "$REORDER")"
check "reorder persisted" "settings" "$(jq_get /api/apps '.items[0].id')"

check "invalid profile rejected" "400" "$(status_of -X PUT "$BASE/api/profile" -H 'content-type: application/json' -d '{"id":"bogus"}')"
check "profile accepted" "200" "$(status_of -X PUT "$BASE/api/profile" -H 'content-type: application/json' -d '{"id":"eink"}')"
check "eink section order" "collections" "$(jq_get /api/home '.widgets[1]')"

curl -s -X PUT "$BASE/api/capabilities" -H 'content-type: application/json' -d '{"wifi":false,"bluetooth":false,"battery":false}' >/dev/null
check "wifi quick setting filtered" "null" "$(jq_get /api/quick-settings '.items.wifi')"
check "brightness remains" "70" "$(jq_get /api/quick-settings '.items.brightness')"

check "preference round trip" "oled" "$(curl -s -X PUT "$BASE/api/preferences" -H 'content-type: application/json' -d '{"theme":"oled"}' | jq -r .items.theme)"
check "unknown preference rejected" "400" "$(status_of -X PUT "$BASE/api/preferences" -H 'content-type: application/json' -d '{"nope":1}')"
check "session save" "200" "$(status_of -X PUT "$BASE/api/session" -H 'content-type: application/json' -d '{"page":"apps"}')"
check "session restore" "apps" "$(jq_get /api/session '.session.page')"

check "SPA root served" "200" "$(status_of "$BASE/")"
check "unknown API stays JSON 404" "404" "$(status_of "$BASE/api/nope")"

if (( fail )); then
  echo "API contract checks failed" >&2
  exit 1
fi
echo "API contract checks passed at $BASE"
