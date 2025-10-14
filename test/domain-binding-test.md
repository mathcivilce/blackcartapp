# Domain Binding Security Test

## Test Data from Database

**Store 1:**
- Domain: `example-store.myshopify.com`
- Token: `b6d359e0-3198-4246-b2ba-614454062c1a`
- Status: `active`

**Store 2:**
- Domain: `www.furrymart.com.au`
- Token: `2e4b4c6a-2a24-4f03-9ee5-a63140308167`
- Status: `active`

---

## Test Scenarios

### ✅ SCENARIO 1: Valid - Correct Token with Correct Domain
**Request:**
```
GET /api/settings?token=b6d359e0-3198-4246-b2ba-614454062c1a&shop=example-store.myshopify.com
```

**Expected Result:**
- ✅ Status: 200 OK
- ✅ Returns settings for example-store.myshopify.com
- Cart initializes successfully

**Reason:** Token belongs to the requesting domain

---

### ❌ SCENARIO 2: Invalid - Token Stolen/Shared to Different Store
**What Store 2 tries to do:**
```html
<!-- Store 2 copies Store 1's script -->
<script src="cart.js?token=b6d359e0-3198-4246-b2ba-614454062c1a"></script>
```

**When cart.js runs on www.furrymart.com.au:**
- Detects domain: `www.furrymart.com.au` (from `window.Shopify.shop`)
- Extracts token: `b6d359e0-3198-4246-b2ba-614454062c1a`

**Request sent:**
```
GET /api/settings?token=b6d359e0-3198-4246-b2ba-614454062c1a&shop=www.furrymart.com.au
```

**API Validation:**
1. Token lookup: Finds store with domain `example-store.myshopify.com`
2. Domain check: `example-store.myshopify.com` !== `www.furrymart.com.au`
3. ❌ **REJECTED**

**Expected Result:**
- ❌ Status: 403 Forbidden
- ❌ Error: "Domain mismatch"
- ❌ Console logs:
  ```
  🚫 Security: Token is registered to a different store domain.
     Token belongs to: example-store.myshopify.com
     Current domain: www.furrymart.com.au
  ```
- ❌ Cart does NOT initialize
- ✅ Security breach prevented!

---

### ✅ SCENARIO 3: Valid - Each Store Uses Own Token
**Store 2 uses its own token:**
```html
<script src="cart.js?token=2e4b4c6a-2a24-4f03-9ee5-a63140308167"></script>
```

**Request:**
```
GET /api/settings?token=2e4b4c6a-2a24-4f03-9ee5-a63140308167&shop=www.furrymart.com.au
```

**Expected Result:**
- ✅ Status: 200 OK
- ✅ Returns settings for www.furrymart.com.au
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

### Valid Request:
```bash
curl "http://localhost:3001/api/settings?token=b6d359e0-3198-4246-b2ba-614454062c1a&shop=example-store.myshopify.com"
# Should return 200 with settings
```

### Invalid Request (Domain Mismatch):
```bash
curl "http://localhost:3001/api/settings?token=b6d359e0-3198-4246-b2ba-614454062c1a&shop=www.furrymart.com.au"
# Should return 403 with domain mismatch error
```

### Invalid Request (Wrong Token):
```bash
curl "http://localhost:3001/api/settings?token=invalid-token&shop=example-store.myshopify.com"
# Should return 401 unauthorized
```

