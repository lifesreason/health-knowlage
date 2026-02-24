#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000/api/v1}"
ADMIN_USERNAME="${ADMIN_USERNAME:-admin}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-admin123}"
WX_LOGIN_CODE="${WX_LOGIN_CODE:-audit-smoke-$(date +%s)}"

json_get() {
  local payload="$1"
  local path="$2"
  printf '%s' "$payload" | node -e '
    const fs = require("fs");
    const input = fs.readFileSync(0, "utf8");
    let data = {};
    try { data = JSON.parse(input); } catch { process.exit(0); }
    const path = process.argv[1].split(".");
    let cur = data;
    for (const key of path) {
      if (cur && Object.prototype.hasOwnProperty.call(cur, key)) {
        cur = cur[key];
      } else {
        cur = "";
        break;
      }
    }
    if (cur === undefined || cur === null) process.stdout.write("");
    else if (typeof cur === "object") process.stdout.write(JSON.stringify(cur));
    else process.stdout.write(String(cur));
  ' "$path"
}

request() {
  local method="$1"
  local url="$2"
  local token="${3:-}"
  local body="${4:-}"

  if [[ -n "$token" && -n "$body" ]]; then
    curl -sS -X "$method" "$url" \
      -H "Authorization: Bearer $token" \
      -H 'Content-Type: application/json' \
      -d "$body"
  elif [[ -n "$token" ]]; then
    curl -sS -X "$method" "$url" \
      -H "Authorization: Bearer $token"
  elif [[ -n "$body" ]]; then
    curl -sS -X "$method" "$url" \
      -H 'Content-Type: application/json' \
      -d "$body"
  else
    curl -sS -X "$method" "$url"
  fi
}

echo "[1/6] admin login"
admin_resp=$(request POST "$BASE_URL/auth/admin/login" "" "{\"username\":\"$ADMIN_USERNAME\",\"password\":\"$ADMIN_PASSWORD\"}")
admin_token=$(json_get "$admin_resp" "data.accessToken")
if [[ -z "$admin_token" ]]; then
  echo "admin login failed: $admin_resp"
  exit 1
fi

echo "[2/6] resolve pending post"
post_id="${PENDING_POST_ID:-}"
if [[ -z "$post_id" ]]; then
  user_token="${USER_TOKEN:-}"
  if [[ -z "$user_token" ]]; then
    user_login_resp=$(request POST "$BASE_URL/auth/login" "" "{\"code\":\"$WX_LOGIN_CODE\"}")
    user_token=$(json_get "$user_login_resp" "data.accessToken")
    if [[ -z "$user_token" ]]; then
      echo "user login failed (maybe WX_LOGIN_MOCK_ENABLED=false): $user_login_resp"
      exit 1
    fi
  fi

  circle_resp=$(request GET "$BASE_URL/circle/list")
  circle_id=$(json_get "$circle_resp" "data.0.id")
  if [[ -z "$circle_id" ]]; then
    echo "no circle found: $circle_resp"
    exit 1
  fi

  publish_payload="{\"circleId\":$circle_id,\"type\":1,\"title\":\"机审联调测试\",\"content\":\"机审 smoke 文本 $(date +%s)\",\"mediaUrls\":[]}"
  publish_resp=$(request POST "$BASE_URL/post/publish" "$user_token" "$publish_payload")
  post_id=$(json_get "$publish_resp" "data.id")
  if [[ -z "$post_id" ]]; then
    echo "publish failed: $publish_resp"
    exit 1
  fi
fi

echo "pending post id: $post_id"

echo "[3/6] machine status"
status_resp=$(request GET "$BASE_URL/audit/machine/status" "$admin_token")
echo "$status_resp"

echo "[4/6] run machine once"
run_resp=$(request POST "$BASE_URL/audit/machine/run-once" "$admin_token")
echo "$run_resp"

echo "[5/6] query audit history"
history_resp=$(request GET "$BASE_URL/audit/history/$post_id" "$admin_token")
echo "$history_resp"

echo "[6/6] done"
echo "TIP: if decision stayed review, continue with manual audit endpoints."
