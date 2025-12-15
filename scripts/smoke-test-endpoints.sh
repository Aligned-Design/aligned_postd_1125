#!/bin/bash
# Runtime Smoke Test for Restored Endpoints
# Verifies all 8 endpoints are registered (not 404)
# Expected: 401/403 (auth required) or 400 (validation) but NOT 404

set -e

echo "🔥 Smoke Testing Restored Endpoints..."
echo ""

# Configuration
BACKEND_PORT=${PORT:-3000}
VITE_PORT=8080
MAX_WAIT=30

# Start server in background
echo "Starting dev servers (Vite + Express)..."
pnpm dev > /tmp/server.log 2>&1 &
SERVER_PID=$!

# Function to check if backend is ready
wait_for_backend() {
  local endpoint="http://localhost:$BACKEND_PORT/health"
  local elapsed=0
  
  echo "Waiting for backend server at $endpoint..."
  
  while [ $elapsed -lt $MAX_WAIT ]; do
    if curl -s -f "$endpoint" > /dev/null 2>&1; then
      echo "✅ Backend server ready!"
      return 0
    fi
    sleep 1
    elapsed=$((elapsed + 1))
    echo -n "."
  done
  
  echo ""
  echo "❌ Backend server failed to start within ${MAX_WAIT}s"
  return 1
}

# Wait for backend to be ready
if ! wait_for_backend; then
  echo "Server logs:"
  cat /tmp/server.log 2>/dev/null || echo "No logs available"
  kill $SERVER_PID 2>/dev/null || true
  exit 1
fi

echo ""

# Function to test endpoint (test against backend directly to avoid proxy issues)
test_endpoint() {
  local method=$1
  local endpoint=$2
  local data=$3
  local name=$4
  
  local url="http://localhost:${BACKEND_PORT}${endpoint}"
  
  if [ -z "$data" ]; then
    status=$(curl -s -o /dev/null -w "%{http_code}" -X $method "$url" 2>/dev/null || echo "000")
  else
    status=$(curl -s -o /dev/null -w "%{http_code}" -X $method "$url" \
      -H "Content-Type: application/json" \
      -d "$data" 2>/dev/null || echo "000")
  fi
  
  # 404 = endpoint not registered (FAIL)
  # 401/403 = auth required (SUCCESS - route exists)
  # 400 = validation error (SUCCESS - route exists)
  # 200-299 = success (SUCCESS)
  # 500+ = server error (SUCCESS - route exists but errored)
  
  if [ "$status" = "404" ]; then
    echo "❌ $name: 404 NOT FOUND (endpoint not registered!)"
    return 1
  elif [ "$status" = "000" ]; then
    echo "⚠️  $name: Connection failed"
    return 1
  elif [ "$status" = "401" ] || [ "$status" = "403" ]; then
    echo "✅ $name: $status (registered, auth required)"
    return 0
  elif [ "$status" = "400" ]; then
    echo "✅ $name: $status (registered, validation error)"
    return 0
  elif [ "${status:0:1}" = "2" ]; then
    echo "✅ $name: $status (registered, success)"
    return 0
  elif [ "${status:0:1}" = "5" ]; then
    echo "✅ $name: $status (registered, server error)"
    return 0
  else
    echo "✅ $name: $status (registered)"
    return 0
  fi
}

# Test all 8 endpoints
failed=0

test_endpoint "GET" "/api/metrics/ai/snapshot" "" "1. /api/metrics" || failed=$((failed+1))
test_endpoint "GET" "/api/reports" "" "2. /api/reports" || failed=$((failed+1))
test_endpoint "GET" "/api/white-label/config" "" "3. /api/white-label" || failed=$((failed+1))
test_endpoint "GET" "/api/trial/status" "" "4. /api/trial" || failed=$((failed+1))
test_endpoint "GET" "/api/client-portal/dashboard" "" "5. /api/client-portal" || failed=$((failed+1))
test_endpoint "GET" "/api/publishing/jobs" "" "6. /api/publishing" || failed=$((failed+1))
test_endpoint "GET" "/api/integrations" "" "7. /api/integrations" || failed=$((failed+1))
test_endpoint "POST" "/api/ai-rewrite" '{"content":"test","platform":"instagram","brandId":"550e8400-e29b-41d4-a716-446655440000"}' "8. /api/ai-rewrite" || failed=$((failed+1))

# Cleanup
echo ""
echo "Stopping server..."
kill $SERVER_PID 2>/dev/null || true
wait $SERVER_PID 2>/dev/null || true

echo ""
if [ $failed -eq 0 ]; then
  echo "✅ All 8 endpoints registered and responding!"
  exit 0
else
  echo "❌ $failed endpoint(s) returned 404"
  exit 1
fi

