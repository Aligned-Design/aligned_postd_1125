#!/bin/bash
# Runtime Smoke Test for Restored Endpoints
# Verifies all 8 endpoints are registered (not 404)
# Expected: 401 (auth required) or 400 (validation) but NOT 404

set -e

echo "🔥 Smoke Testing Restored Endpoints..."
echo ""

# Start server in background
echo "Starting server..."
pnpm dev > /tmp/server.log 2>&1 &
SERVER_PID=$!

# Wait for server to be ready
echo "Waiting for server to start..."
sleep 5

# Function to test endpoint
test_endpoint() {
  local method=$1
  local endpoint=$2
  local data=$3
  local name=$4
  
  if [ -z "$data" ]; then
    status=$(curl -s -o /dev/null -w "%{http_code}" -X $method "http://localhost:8080$endpoint" 2>/dev/null || echo "000")
  else
    status=$(curl -s -o /dev/null -w "%{http_code}" -X $method "http://localhost:8080$endpoint" \
      -H "Content-Type: application/json" \
      -d "$data" 2>/dev/null || echo "000")
  fi
  
  if [ "$status" = "404" ]; then
    echo "❌ $name: 404 NOT FOUND (endpoint not registered!)"
    return 1
  elif [ "$status" = "000" ]; then
    echo "⚠️  $name: Connection failed (server not ready?)"
    return 1
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

