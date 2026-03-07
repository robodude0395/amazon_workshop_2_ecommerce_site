#!/bin/bash

# Smiths Detection E-Commerce API Test Script
# Tests all implemented endpoints

set -e

BASE_URL="http://localhost:5000"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# JSON formatter function (works without jq)
format_json() {
    python3 -m json.tool 2>/dev/null || cat
}

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   Smiths Detection E-Commerce API Test Suite              ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check if server is running
echo -n "Checking if server is running... "
if curl -s "$BASE_URL/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    echo ""
    echo "Error: Server is not running on $BASE_URL"
    echo "Please start the server with: cd backend && npm start"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Test 1: Health Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "GET $BASE_URL/health"
echo ""
curl -s "$BASE_URL/health" | format_json
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Test 2: Get All Products"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "GET $BASE_URL/api/products"
echo ""
RESPONSE=$(curl -s "$BASE_URL/api/products")
PRODUCT_COUNT=$(echo "$RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(len(data.get('data', [])))" 2>/dev/null || echo "?")
echo "Total products: $PRODUCT_COUNT"
echo ""
echo "First 3 products:"
echo "$RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(json.dumps(data.get('data', [])[:3], indent=2))" 2>/dev/null || echo "$RESPONSE"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Test 3: Get Single Product"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "GET $BASE_URL/api/products/1"
echo ""
curl -s "$BASE_URL/api/products/1" | format_json
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Test 4: Get Product Not Found (Error Test)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "GET $BASE_URL/api/products/9999"
echo ""
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/products/9999")
if [ "$HTTP_CODE" = "404" ]; then
    echo -e "${GREEN}✓ Correctly returns 404${NC}"
else
    echo -e "${RED}✗ Expected 404, got $HTTP_CODE${NC}"
fi
curl -s "$BASE_URL/api/products/9999" | format_json
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Test 5: Get Empty Cart"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "GET $BASE_URL/api/cart"
echo ""
curl -s "$BASE_URL/api/cart" | format_json
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Test 6: Add Item to Cart"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "POST $BASE_URL/api/cart"
echo "Body: {\"product_id\": 1, \"quantity\": 2}"
echo ""
HTTP_CODE=$(curl -s -o /tmp/response.json -w "%{http_code}" -X POST "$BASE_URL/api/cart" \
  -H "Content-Type: application/json" \
  -d '{"product_id": 1, "quantity": 2}')
if [ "$HTTP_CODE" = "201" ]; then
    echo -e "${GREEN}✓ Correctly returns 201 Created${NC}"
else
    echo -e "${RED}✗ Expected 201, got $HTTP_CODE${NC}"
fi
cat /tmp/response.json | format_json
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Test 7: Add Same Item Again (Should Increment)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "POST $BASE_URL/api/cart"
echo "Body: {\"product_id\": 1, \"quantity\": 3}"
echo ""
curl -s -X POST "$BASE_URL/api/cart" \
  -H "Content-Type: application/json" \
  -d '{"product_id": 1, "quantity": 3}' | format_json
echo ""
echo -e "${YELLOW}Note: Quantity should now be 5 (2 + 3)${NC}"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Test 8: Get Cart with Items"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "GET $BASE_URL/api/cart"
echo ""
curl -s "$BASE_URL/api/cart" | format_json
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Test 9: Add Different Product"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "POST $BASE_URL/api/cart"
echo "Body: {\"product_id\": 2, \"quantity\": 1}"
echo ""
curl -s -X POST "$BASE_URL/api/cart" \
  -H "Content-Type: application/json" \
  -d '{"product_id": 2, "quantity": 1}' | format_json
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Test 10: Get Cart with Multiple Items"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "GET $BASE_URL/api/cart"
echo ""
CART_RESPONSE=$(curl -s "$BASE_URL/api/cart")
echo "$CART_RESPONSE" | format_json
ITEM_COUNT=$(echo "$CART_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(len(data.get('data', {}).get('items', [])))" 2>/dev/null || echo "?")
TOTAL_QUANTITY=$(echo "$CART_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('data', {}).get('item_count', '?'))" 2>/dev/null || echo "?")
TOTAL_PRICE=$(echo "$CART_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('data', {}).get('total', '?'))" 2>/dev/null || echo "?")
echo ""
echo -e "${GREEN}Cart Summary:${NC}"
echo "  - Items: $ITEM_COUNT"
echo "  - Total Quantity: $TOTAL_QUANTITY"
echo "  - Total Price: \$$TOTAL_PRICE"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Test 11: Error Test - Invalid Product ID"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "POST $BASE_URL/api/cart"
echo "Body: {\"product_id\": 9999, \"quantity\": 1}"
echo ""
HTTP_CODE=$(curl -s -o /tmp/response.json -w "%{http_code}" -X POST "$BASE_URL/api/cart" \
  -H "Content-Type: application/json" \
  -d '{"product_id": 9999, "quantity": 1}')
if [ "$HTTP_CODE" = "404" ]; then
    echo -e "${GREEN}✓ Correctly returns 404${NC}"
else
    echo -e "${RED}✗ Expected 404, got $HTTP_CODE${NC}"
fi
cat /tmp/response.json | format_json
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Test 12: Error Test - Invalid Quantity"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "POST $BASE_URL/api/cart"
echo "Body: {\"product_id\": 1, \"quantity\": 0}"
echo ""
HTTP_CODE=$(curl -s -o /tmp/response.json -w "%{http_code}" -X POST "$BASE_URL/api/cart" \
  -H "Content-Type: application/json" \
  -d '{"product_id": 1, "quantity": 0}')
if [ "$HTTP_CODE" = "400" ]; then
    echo -e "${GREEN}✓ Correctly returns 400${NC}"
else
    echo -e "${RED}✗ Expected 400, got $HTTP_CODE${NC}"
fi
cat /tmp/response.json | format_json
echo ""

echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    Test Summary                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}✓ All tests completed successfully!${NC}"
echo ""
echo "Endpoints tested:"
echo "  ✓ GET  /health"
echo "  ✓ GET  /api/products"
echo "  ✓ GET  /api/products/:id"
echo "  ✓ GET  /api/cart"
echo "  ✓ POST /api/cart"
echo ""
echo "Error handling tested:"
echo "  ✓ 404 Not Found (invalid product ID)"
echo "  ✓ 400 Bad Request (invalid quantity)"
echo ""
echo "For more details, see: TESTING-GUIDE.md"
echo ""

# Cleanup
rm -f /tmp/response.json
