# Domain Binding Security Test

## Test Data from Database

**Store 1:**
- Domain: `8cd001-2.myshopify.com` (www.furrymart.com.au)
- Token: `2e4b4c6a-2a24-4f03-9ee5-a63140308167`
- Status: `active`

**Store 2:**
- Domain: `example-store.myshopify.com`
- Token: `b6d359e0-3198-4246-b2ba-614454062c1a`
- Status: `active`

---

## Test Scenarios

### ✅ SCENARIO 1: Valid - Correct Token with Correct Domain
**Request:**
```
GET /api/settings?token=2e4b4c6a-2a24-4f03-9ee5-a63140308167&shop=8cd001-2.myshopify.com
```

**Expected Result:**
- ✅ Status: 200 OK
- ✅ Returns settings for 8cd001-2.myshopify.com (www.furrymart.com.au)
- Cart initializes successfully

**Reason:** Token belongs to the requesting domain

---

### ❌ SCENARIO 2: Invalid - Token Stolen/Shared to Different Store
**What Store 2 tries to do:**
```html
<!-- Store 2 copies Store 1's script -->
<script src="cart.js?token=2e4b4c6a-2a24-4f03-9ee5-a63140308167"></script>
```

**When cart.js runs on example-store.myshopify.com:**
- Detects domain: `example-store.myshopify.com` (from `window.Shopify.shop`)
- Extracts token: `2e4b4c6a-2a24-4f03-9ee5-a63140308167`

**Request sent:**
```
GET /api/settings?token=2e4b4c6a-2a24-4f03-9ee5-a63140308167&shop=example-store.myshopify.com
```

**API Validation:**
1. Token lookup: Finds store with domain `8cd001-2.myshopify.com`
2. Domain check: `8cd001-2.myshopify.com` !== `example-store.myshopify.com`
3. ❌ **REJECTED**

**Expected Result:**
- ❌ Status: 403 Forbidden
- ❌ Error: "Domain mismatch"
- ❌ Console logs:
  ```
  🚫 Security: Token is registered to a different store domain.
     Token belongs to: 8cd001-2.myshopify.com
     Current domain: example-store.myshopify.com
  ```
- ❌ Cart does NOT initialize
- ✅ Security breach prevented!

---

### ✅ SCENARIO 3: Valid - Each Store Uses Own Token
**Store 2 uses its own token:**
```html
<script src="cart.js?token=b6d359e0-3198-4246-b2ba-614454062c1a"></script>
```

**Request:**
```
GET /api/settings?token=b6d359e0-3198-4246-b2ba-614454062c1a&shop=example-store.myshopify.com
```

**Expected Result:**
- ✅ Status: 200 OK
- ✅ Returns settings for example-store.myshopify.com
- Cart initializes successfully

---

## Security Benefits

### Before Domain Binding:
❌ Store B could use Store A's token freely
❌ No way to detect unauthorized usage
❌ Billing issues and data attribution problems

### After Domain Binding:
✅ Token only works on registered domain
✅ Automatic detection and rejection of stolen tokens
✅ Clear audit trail in logs
✅ Proper billing per store
✅ Data integrity maintained

---

## Implementation Details

### Client-Side (cart.js):
```javascript
// Always sends BOTH token AND shop domain
const url = CONFIG.token 
  ? `${CONFIG.appUrl}/api/settings?token=${CONFIG.token}&shop=${CONFIG.shopDomain}`
  : `${CONFIG.appUrl}/api/settings?shop=${CONFIG.shopDomain}`;
```

### Server-Side (API):
```typescript
// Validates token belongs to requesting domain
if (shop && store.shop_domain !== shop) {
  return NextResponse.json({ 
    error: 'Domain mismatch',
    message: 'This token is registered to a different store',
    registered_domain: store.shop_domain,
    requesting_domain: shop
  }, { status: 403 });
}
```

---

## Test Execution

To manually test, you can make these curl requests:

### Valid Request (www.furrymart.com.au):
```bash
curl "http://localhost:3001/api/settings?token=2e4b4c6a-2a24-4f03-9ee5-a63140308167&shop=8cd001-2.myshopify.com"
# Should return 200 with settings
```

### Valid Request (example-store):
```bash
curl "http://localhost:3001/api/settings?token=b6d359e0-3198-4246-b2ba-614454062c1a&shop=example-store.myshopify.com"
# Should return 200 with settings
```

### Invalid Request (Domain Mismatch):
```bash
curl "http://localhost:3001/api/settings?token=2e4b4c6a-2a24-4f03-9ee5-a63140308167&shop=example-store.myshopify.com"
# Should return 403 with domain mismatch error
```

### Invalid Request (Wrong Token):
```bash
curl "http://localhost:3001/api/settings?token=invalid-token&shop=8cd001-2.myshopify.com"
# Should return 401 unauthorized
```

