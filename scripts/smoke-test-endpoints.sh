#!/bin/bash
# Runtime Smoke Test for Restored Endpoints
# Verifies all 8 endpoints are registered (not 404)
# Expected: 401/403 (auth required) or 400 (validation) but NOT 404

set -e
set -m  # Enable job control for process groups

echo "🔥 Smoke Testing Restored Endpoints..."
echo ""

# Configuration
BACKEND_PORT=${BACKEND_PORT:-3000}
VITE_PORT=8080
MAX_WAIT=30
LOG_FILE="/tmp/postd-smoke-test-$$.log"

# Cleanup function - kills the entire process group
cleanup() {
  echo ""
  echo "Stopping dev servers..."
  
  # Kill the process group (negative PID)
  if [ -n "$SERVER_PID" ]; then
    kill -- -$SERVER_PID 2>/dev/null || true
    wait $SERVER_PID 2>/dev/null || true
  fi
  
  # Fallback: if anything is still on the port, kill it
  local remaining_pid=$(lsof -ti:$BACKEND_PORT 2>/dev/null || true)
  if [ -n "$remaining_pid" ]; then
    echo "⚠️  Killing stale process on port $BACKEND_PORT: $remaining_pid"
    kill $remaining_pid 2>/dev/null || true
    sleep 1
  fi
  
  # Clean up log files
  rm -f "$LOG_FILE" /tmp/debug-response.json 2>/dev/null || true
}

# Set trap to always cleanup on exit
trap cleanup EXIT

# Start server in background as its own process group
echo "Starting dev servers (Vite + Express)..."
pnpm dev > "$LOG_FILE" 2>&1 &
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
  echo ""
  echo "❌ Server failed to start. Last 200 lines of logs:"
  tail -200 "$LOG_FILE" 2>/dev/null || echo "No logs available"
  exit 1
fi

echo ""

# Verify server identity and mounted routes
echo "Checking server identity..."
debug_status=$(curl -s -o /tmp/debug-response.json -w "%{http_code}" "http://localhost:${BACKEND_PORT}/__debug/routes" 2>/dev/null || echo "000")
debug_response=$(cat /tmp/debug-response.json 2>/dev/null || echo "{}")

if [ "$debug_status" = "404" ]; then
  echo "❌ ERROR: Debug endpoint /__debug/routes returned 404!"
  echo ""
  echo "This means NODE_ENV might be set to 'production' in dev mode."
  echo ""
  echo "Server logs (last 100 lines):"
  tail -100 "$LOG_FILE" 2>/dev/null || echo "No logs available"
  echo ""
  echo "Processes on port $BACKEND_PORT:"
  lsof -i :$BACKEND_PORT 2>/dev/null || echo "None"
  exit 1
fi

if [ "$debug_status" = "200" ] && [ "$debug_response" != "{}" ]; then
  echo "✅ Debug endpoint accessible"
  echo ""
  echo "Server Identity:"
  echo "$debug_response" | jq -r '"  PID: \(.pid)"' 2>/dev/null || echo "  (parse error)"
  echo "$debug_response" | jq -r '"  Boot File: \(.bootFile)"' 2>/dev/null || echo ""
  echo "$debug_response" | jq -r '"  Port: \(.port)"' 2>/dev/null || echo ""
  echo "$debug_response" | jq -r '"  Route Count: \(.routeCount)"' 2>/dev/null || echo ""
  
  echo ""
  echo "Checking for required routes..."
  routes_json=$(echo "$debug_response" | jq -r '.mountedRoutes[]' 2>/dev/null || echo "")
  
  required_routes=("/api/metrics" "/api/reports" "/api/white-label" "/api/trial" "/api/client-portal" "/api/publishing" "/api/integrations" "/api/ai-rewrite")
  
  missing_routes=0
  for route in "${required_routes[@]}"; do
    if echo "$routes_json" | grep -q "$route"; then
      echo "  ✅ $route found in router stack"
    else
      echo "  ⚠️  $route NOT in router stack (will verify via direct test)"
      missing_routes=$((missing_routes + 1))
    fi
  done
  
  if [ $missing_routes -gt 0 ]; then
    echo ""
    echo "⚠️  Warning: $missing_routes route(s) not visible in debug stack"
    echo "   (This might be a route extraction issue, not a registration issue)"
    echo "   Continuing with direct endpoint tests..."
  fi
  echo ""
else
  echo "⚠️  Debug endpoint not available (might be production mode)"
  echo ""
fi

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
  # 501 = not implemented yet (SUCCESS - route exists but not implemented)
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
  elif [ "$status" = "501" ]; then
    echo "✅ $name: $status (registered, not implemented yet)"
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

# Results (cleanup handled by trap)
echo ""
if [ $failed -eq 0 ]; then
  echo "✅ All 8 endpoints registered and responding!"
  exit 0
else
  echo "❌ $failed endpoint(s) returned 404"
  exit 1
fi

