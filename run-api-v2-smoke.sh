#!/usr/bin/env bash

# POSTD API v2 Smoke Test Script
# Quick sanity check that auth + v2 endpoints + reviews + webhooks are wired and responding.

API_BASE_URL="${API_BASE_URL:-http://localhost:8080}"
API_URL="$API_BASE_URL/api"

# You can override these via env vars if you want
API_EMAIL="${API_EMAIL:-test+1@example.com}"
API_PASSWORD="${API_PASSWORD:-testing123}"

# Brand ID can be passed in; if empty, we'll create a test brand
TEST_BRAND_ID="${TEST_BRAND_ID:-}"

OK=0
WARN=0
FAIL=0

divider() {
  printf '\n============================================================\n'
}

log() {
  echo -e "$1"
}

require_jq() {
  if ! command -v jq >/dev/null 2>&1; then
    echo "❌ jq is required for this script. Please install it (e.g. 'brew install jq') and re-run."
    exit 1
  fi
}

record_result() {
  local status="$1" # OK/WARN/FAIL
  case "$status" in
    OK)   OK=$((OK+1));;
    WARN) WARN=$((WARN+1));;
    FAIL) FAIL=$((FAIL+1));;
  esac
}

test_endpoint() {
  local label="$1"
  local method="$2"
  local url="$3"
  local headers="$4"    # additional -H args
  local data="$5"       # JSON body or empty
  local expected_codes="$6" # space-separated status codes considered OK
  local allow_warn_codes="${7:-}" # space-separated status codes considered WARN (not FAIL)

  local curl_cmd=(curl -s -o /tmp/api_test_body -w "%{http_code}" -X "$method" "$url")
  if [[ -n "$headers" ]]; then
    # headers is a string of -H args; eval is easiest here
    # shellcheck disable=SC2086
    curl_cmd+=($headers)
  fi
  if [[ -n "$data" ]]; then
    curl_cmd+=(-H "Content-Type: application/json" -d "$data")
  fi

  local status_code
  status_code="$("${curl_cmd[@]}")"
  local body
  body="$(cat /tmp/api_test_body)"

  if [[ " $expected_codes " == *" $status_code "* ]]; then
    echo "✅ [OK]   $label → $status_code"
    record_result "OK"
  elif [[ -n "$allow_warn_codes" && " $allow_warn_codes " == *" $status_code "* ]]; then
    echo "⚠️  [WARN] $label → $status_code"
    echo "     Body: $body"
    record_result "WARN"
  else
    echo "❌ [FAIL] $label → $status_code"
    echo "     Body: $body"
    record_result "FAIL"
  fi
}

main() {
  require_jq

  divider
  echo "🧪 POSTD API v2 Smoke Test"
  echo
  echo "Base URL:  $API_BASE_URL"
  echo "API URL:   $API_URL"
  echo "Email:     $API_EMAIL"
  echo

  divider
  echo "🔍 Basic health checks..."

  # 1. Root health
  test_endpoint "GET /health" \
    "GET" "$API_BASE_URL/health" "" "" "200"

  # 2. API ping
  test_endpoint "GET /api/ping" \
    "GET" "$API_URL/ping" "" "" "200"

  divider
  echo "🔐 Authentication..."

  # 3. Login (or confirm existing user)
  echo "Logging in as $API_EMAIL ..."
  LOGIN_BODY="$(curl -s -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$API_EMAIL\",\"password\":\"$API_PASSWORD\"}")"

  # If login failed, try signup once then login again
  LOGIN_ERROR_CODE="$(echo "$LOGIN_BODY" | jq -r '.error.code // empty')"

  if [[ -n "$LOGIN_ERROR_CODE" ]]; then
    echo "Login failed with code: $LOGIN_ERROR_CODE"
    echo "Attempting signup for $API_EMAIL ..."
    SIGNUP_BODY="$(curl -s -X POST "$API_URL/auth/signup" \
      -H "Content-Type: application/json" \
      -d "{\"email\":\"$API_EMAIL\",\"password\":\"$API_PASSWORD\",\"name\":\"API Tester\"}")"
    SIGNUP_ERROR_CODE="$(echo "$SIGNUP_BODY" | jq -r '.error.code // empty')"
    if [[ -n "$SIGNUP_ERROR_CODE" && "$SIGNUP_ERROR_CODE" != "INVALID_CREDENTIALS" ]]; then
      echo "❌ Signup failed: $SIGNUP_BODY"
      echo "Cannot continue without a valid user."
      exit 1
    fi

    # Try login again
    LOGIN_BODY="$(curl -s -X POST "$API_URL/auth/login" \
      -H "Content-Type: application/json" \
      -d "{\"email\":\"$API_EMAIL\",\"password\":\"$API_PASSWORD\"}")"
  fi

  ACCESS_TOKEN="$(echo "$LOGIN_BODY" | jq -r '.tokens.accessToken // empty')"

  if [[ -z "$ACCESS_TOKEN" || "$ACCESS_TOKEN" == "null" ]]; then
    echo "❌ Could not extract access token from login response:"
    echo "$LOGIN_BODY"
    exit 1
  fi

  echo "✅ Access token acquired."

  AUTH_HEADER="-H Authorization: Bearer $ACCESS_TOKEN"

  # 4. /auth/me
  test_endpoint "GET /api/auth/me" \
    "GET" "$API_URL/auth/me" "$AUTH_HEADER" "" "200"

  divider
  echo "🏷  Brand setup..."

  if [[ -z "$TEST_BRAND_ID" ]]; then
    echo "No TEST_BRAND_ID provided. Creating a temporary brand..."

    CREATE_BRAND_BODY="$(curl -s -X POST "$API_URL/brands" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      -d '{
        "name": "API Test Brand",
        "website_url": "https://example.com",
        "industry": "Testing",
        "description": "Temporary brand created by API v2 smoke test"
      }')"

    TEST_BRAND_ID="$(echo "$CREATE_BRAND_BODY" | jq -r '.id // empty')"

    if [[ -z "$TEST_BRAND_ID" || "$TEST_BRAND_ID" == "null" ]]; then
      echo "❌ Failed to create test brand:"
      echo "$CREATE_BRAND_BODY"
      exit 1
    fi

    echo "✅ Created test brand: $TEST_BRAND_ID"
  else
    echo "Using provided TEST_BRAND_ID: $TEST_BRAND_ID"
  fi

  divider
  echo "📊 Testing Analytics v2 endpoints..."

  test_endpoint "GET /api/analytics/overview" \
    "GET" "$API_URL/analytics/overview?brandId=$TEST_BRAND_ID&days=30" \
    "$AUTH_HEADER" "" "200"

  test_endpoint "GET /api/analytics/engagement-trend" \
    "GET" "$API_URL/analytics/engagement-trend?brandId=$TEST_BRAND_ID&days=30" \
    "$AUTH_HEADER" "" "200"

  divider
  echo "📁 Testing Media v2 endpoints..."

  test_endpoint "GET /api/media?limit=1" \
    "GET" "$API_URL/media?brandId=$TEST_BRAND_ID&limit=1&offset=0" \
    "$AUTH_HEADER" "" "200"

  test_endpoint "GET /api/media/storage-usage" \
    "GET" "$API_URL/media/storage-usage?brandId=$TEST_BRAND_ID" \
    "$AUTH_HEADER" "" "200"

  divider
  echo "✅ Testing Approvals v2 endpoints..."

  test_endpoint "GET /api/approvals/pending" \
    "GET" "$API_URL/approvals/pending?brandId=$TEST_BRAND_ID&limit=10&offset=0" \
    "$AUTH_HEADER" "" "200 204"

  divider
  echo "💬 Testing Reviews endpoint..."

  test_endpoint "GET /api/reviews/:brandId" \
    "GET" "$API_URL/reviews/$TEST_BRAND_ID" \
    "$AUTH_HEADER" "" "200"

  divider
  echo "📡 Testing Webhooks endpoints..."

  # Zapier webhook (fake event)
  test_endpoint "POST /api/webhooks/zapier" \
    "POST" "$API_URL/webhooks/zapier" \
    "-H x-brand-id: $TEST_BRAND_ID" \
    '{
      "action": "content.test_event",
      "data": {
        "postId": "post-api-test",
        "platform": "test-platform"
      }
    }' \
    "200 202"

  # Webhook status (fake id — 404 is acceptable/warn)
  test_endpoint "GET /api/webhooks/status/:eventId (fake)" \
    "GET" "$API_URL/webhooks/status/non-existent-event" \
    "" "" "200" "404"

  divider
  echo "📊 SUMMARY"
  divider
  echo "✅ OK:   $OK"
  echo "⚠️  WARN: $WARN"
  echo "❌ FAIL: $FAIL"
  echo

  if [[ $FAIL -eq 0 ]]; then
    echo "🎉 All critical wiring checks passed (no FAILs)."
  else
    echo "🚨 Some endpoints FAILED. Check logs above and your server logs."
  fi

  echo
  echo "Brand used for tests: $TEST_BRAND_ID"
  echo
}

main "$@"

