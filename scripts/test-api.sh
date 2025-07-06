#!/bin/bash

# API Testing Script for Care Services Platform

API_URL="http://localhost:3000"
echo "🧪 Testing Care Services API at $API_URL"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Test function
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    
    echo -n "Testing $description... "
    
    if [ -z "$data" ]; then
        response=$(curl -s -X $method "$API_URL$endpoint" -H "Content-Type: application/json")
    else
        response=$(curl -s -X $method "$API_URL$endpoint" -H "Content-Type: application/json" -d "$data")
    fi
    
    if [ $? -eq 0 ] && [ ! -z "$response" ]; then
        echo -e "${GREEN}✓${NC}"
        echo "Response: $response" | jq '.' 2>/dev/null || echo "$response"
    else
        echo -e "${RED}✗${NC}"
    fi
    echo
}

# 1. Test Health Check
test_endpoint "GET" "/health" "" "Health Check"

# 2. Test Root Endpoint
test_endpoint "GET" "/" "" "Root Endpoint"

# 3. Test Registration
echo "🔐 Testing Authentication..."
REGISTER_DATA='{
  "email": "test'$(date +%s)'@test.com",
  "password": "Test@12345",
  "firstName": "Test",
  "lastName": "User",
  "phone": "+1234567890"
}'
test_endpoint "POST" "/api/v1/auth/register" "$REGISTER_DATA" "User Registration"

# 4. Test Login
LOGIN_DATA='{
  "email": "customer1@test.com",
  "password": "Customer@123"
}'
echo "Testing login with customer1..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d "$LOGIN_DATA")

if [ ! -z "$LOGIN_RESPONSE" ]; then
    TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.accessToken' 2>/dev/null)
    if [ "$TOKEN" != "null" ] && [ ! -z "$TOKEN" ]; then
        echo -e "${GREEN}✓ Login successful${NC}"
        echo "Token acquired: ${TOKEN:0:20}..."
        
        # 5. Test Protected Endpoints
        echo
        echo "📋 Testing Protected Endpoints..."
        
        # Test Get Categories
        curl -s -X GET "$API_URL/api/v1/customer/categories" | jq '.'
        
        # Test Search Providers
        curl -s -X GET "$API_URL/api/v1/customer/search?categoryId=&latitude=37.7749&longitude=-122.4194" | jq '.'
        
        # Test Get Availability
        PROVIDER_ID=$(curl -s -X GET "$API_URL/api/v1/customer/search" | jq -r '.data[0].id' 2>/dev/null)
        SERVICE_ID=$(curl -s -X GET "$API_URL/api/v1/customer/search" | jq -r '.data[0].services[0].id' 2>/dev/null)
        
        if [ "$PROVIDER_ID" != "null" ] && [ "$SERVICE_ID" != "null" ]; then
            DATE=$(date -v+1d +%Y-%m-%d 2>/dev/null || date -d "+1 day" +%Y-%m-%d)
            echo "Testing availability for provider: $PROVIDER_ID, service: $SERVICE_ID, date: $DATE"
            curl -s -X GET "$API_URL/api/v1/customer/availability?providerId=$PROVIDER_ID&serviceId=$SERVICE_ID&date=$DATE" | jq '.'
        fi
        
    else
        echo -e "${RED}✗ Login failed${NC}"
    fi
else
    echo -e "${RED}✗ No response from login${NC}"
fi

echo
echo "✅ API testing completed!"