#!/usr/bin/env bash

EMAIL="$1"

if [ -z "$EMAIL" ]; then
  echo "❌ Please provide an email address."
  echo "Usage: ./test_auth.sh you@example.com"
  exit 1
fi

AUTH_URL="http://localhost:3000/auth/signin/resend"
COOKIE_FILE="/tmp/auth_cookies.txt"

echo "🚀 Starting test for: $EMAIL"
echo ""

# Step 1: Get CSRF token and save cookies
CSRF_HTML=$(curl -s -c "$COOKIE_FILE" "$AUTH_URL")

# Extract CSRF token using sed (works on macOS)
CSRF_TOKEN=$(echo "$CSRF_HTML" | sed -n 's/.*name="csrfToken" value="\([^"]*\)".*/\1/p')

if [ -z "$CSRF_TOKEN" ]; then
  echo "❌ Failed to fetch CSRF token. Check server is running and middleware order is correct."
  exit 1
fi

echo "✅ CSRF token fetched: $CSRF_TOKEN"
echo "📨 Sending magic link request..."

# Step 2: Send the email with CSRF token
curl -s -b "$COOKIE_FILE" -X POST "$AUTH_URL" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "csrfToken=$CSRF_TOKEN&email=$EMAIL" \
  -w "\n\nHTTP Status: %{http_code}\n"

echo ""
echo "✅ Done! Check your inbox for the magic link (from noreply@yourdomain.com)."
