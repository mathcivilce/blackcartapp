// Shopify API helper functions for order tracking and revenue calculation

interface ShopifyOrder {
  id: number;
  name: string; // Order number like "#1001"
  created_at: string;
  line_items: Array<{
    id: number;
    product_id: number | null;
    variant_id: number | null;
    title: string;
    price: string;
    quantity: number;
    sku: string | null;
    name: string;
  }>;
  total_price: string;
  currency: string;
}

interface OrderSyncResult {
  success: boolean;
  ordersChecked: number;
  protectionSalesFound: number;
  newSalesRecorded: number;
  totalRevenue: number;
  totalCommission: number;
  errors: string[];
}

/**
 * Fetch orders from Shopify Admin API
 */
export async function fetchShopifyOrders(
  shopDomain: string,
  apiToken: string,
  options: {
    createdAtMin?: string;
    createdAtMax?: string;
    limit?: number;
    status?: 'any' | 'open' | 'closed' | 'cancelled';
  } = {}
): Promise<{ orders: ShopifyOrder[]; error?: string }> {
  const {
    createdAtMin,
    createdAtMax,
    limit = 250,
    status = 'any'
  } = options;

  try {
    // Build query parameters
    const params = new URLSearchParams({
      status,
      limit: limit.toString(),
    });

    if (createdAtMin) params.append('created_at_min', createdAtMin);
    if (createdAtMax) params.append('created_at_max', createdAtMax);

    const url = `https://${shopDomain}/admin/api/2024-01/orders.json?${params}`;

    console.log(`📡 Fetching orders from ${shopDomain}...`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': apiToken,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Shopify API error:`, response.status, errorText);
      return {
        orders: [],
        error: `Shopify API error: ${response.status} ${response.statusText}`
      };
    }

    const data = await response.json();
    console.log(`✅ Fetched ${data.orders?.length || 0} orders`);

    return { orders: data.orders || [] };
  } catch (error) {
    console.error('❌ Error fetching Shopify orders:', error);
    return {
      orders: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Check if a line item is a protection product
 * Matches by product handle, SKU, or title
 */
export function isProtectionProduct(
  lineItem: ShopifyOrder['line_items'][0],
  protectionProductId: string | null
): boolean {
  if (!protectionProductId) return false;

  const normalizedProductId = protectionProductId.toLowerCase().trim();
  
  // Check SKU
  if (lineItem.sku && lineItem.sku.toLowerCase().includes(normalizedProductId)) {
    return true;
  }

  // Check product title
  if (lineItem.title && lineItem.title.toLowerCase().includes(normalizedProductId)) {
    return true;
  }

  // Check product name
  if (lineItem.name && lineItem.name.toLowerCase().includes(normalizedProductId)) {
    return true;
  }

  // Common protection product identifiers
  const protectionKeywords = ['shipping protection', 'shipping insurance', 'package protection'];
  const itemTitle = lineItem.title?.toLowerCase() || '';
  
  return protectionKeywords.some(keyword => itemTitle.includes(keyword));
}

/**
 * Calculate commission from protection price
 * Default: 25% commission rate
 */
export function calculateCommission(
  protectionPrice: number,
  commissionRate: number = 0.25
): number {
  return Math.round(protectionPrice * commissionRate);
}

/**
 * Parse Shopify price string to cents
 * @deprecated Use convertCurrencyToUSDCents instead for currency conversion
 */
export function priceStringToCents(priceString: string): number {
  const price = parseFloat(priceString);
  if (isNaN(price)) return 0;
  return Math.round(price * 100);
}

/**
 * Fetch exchange rate from source currency to USD
 * Uses exchangerate-api.com (free tier: 1,500 requests/month)
 * Returns cached rate if available and fresh (< 24 hours old)
 */
let exchangeRateCache: { [key: string]: { rate: number; timestamp: number } } = {};
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export async function getExchangeRateToUSD(
  fromCurrency: string
): Promise<{ rate: number; error?: string }> {
  // If already USD, rate is 1
  if (fromCurrency === 'USD') {
    return { rate: 1 };
  }

  // Check cache first
  const cached = exchangeRateCache[fromCurrency];
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    console.log(`💰 Using cached exchange rate: ${fromCurrency} -> USD = ${cached.rate}`);
    return { rate: cached.rate };
  }

  try {
    // Free API - no key required for basic usage
    // Fetches latest rates with USD as base
    const response = await fetch(
      `https://api.exchangerate-api.com/v4/latest/${fromCurrency}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error(`❌ Exchange rate API error: ${response.status}`);
      return {
        rate: 1, // Fallback to 1:1 if API fails
        error: `Failed to fetch exchange rate: ${response.statusText}`,
      };
    }

    const data = await response.json();
    const rateToUSD = data.rates?.USD || 1;

    // Cache the rate
    exchangeRateCache[fromCurrency] = {
      rate: rateToUSD,
      timestamp: Date.now(),
    };

    console.log(`💱 Fetched exchange rate: ${fromCurrency} -> USD = ${rateToUSD}`);
    return { rate: rateToUSD };
  } catch (error) {
    console.error('❌ Error fetching exchange rate:', error);
    return {
      rate: 1, // Fallback to 1:1 if error
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Convert price from any currency to USD cents
 * This is the main function to use for all price conversions
 * 
 * @param priceString - Price as string (e.g., "599" for 599 JPY)
 * @param currency - ISO currency code (e.g., "JPY", "USD", "EUR")
 * @returns Price in USD cents
 * 
 * @example
 * // Convert 599 JPY to USD cents
 * const usdCents = await convertCurrencyToUSDCents("599", "JPY");
 * // Returns ~400 cents ($4.00 USD) assuming 1 JPY = 0.0067 USD
 */
export async function convertCurrencyToUSDCents(
  priceString: string,
  currency: string
): Promise<{ priceInUSDCents: number; exchangeRate?: number; error?: string }> {
  const price = parseFloat(priceString);
  
  if (isNaN(price) || price < 0) {
    return { priceInUSDCents: 0, error: 'Invalid price' };
  }

  // If already USD, just convert to cents
  if (currency === 'USD') {
    return { priceInUSDCents: Math.round(price * 100), exchangeRate: 1 };
  }

  // Get exchange rate
  const { rate, error } = await getExchangeRateToUSD(currency);

  if (error) {
    console.warn(`⚠️ Currency conversion warning: ${error}. Using 1:1 rate.`);
  }

  // Convert: price in foreign currency * exchange rate = price in USD
  const priceInUSD = price * rate;
  const priceInUSDCents = Math.round(priceInUSD * 100);

  console.log(`💵 Converted ${price} ${currency} -> ${priceInUSD.toFixed(2)} USD (${priceInUSDCents} cents) @ rate ${rate}`);

  return {
    priceInUSDCents,
    exchangeRate: rate,
    error,
  };
}

/**
 * Get date range for last N days
 */
export function getDateRange(daysBack: number = 1): {
  startDate: string;
  endDate: string;
} {
  const now = new Date();
  const endDate = now.toISOString();
  
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - daysBack);
  
  return {
    startDate: startDate.toISOString(),
    endDate: endDate
  };
}

/**
 * Get month identifier (e.g., "2024-01")
 */
export function getMonthIdentifier(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Validate Shopify API token and fetch shop info including currency
 */
export async function validateShopifyToken(
  shopDomain: string,
  apiToken: string
): Promise<{
  valid: boolean;
  shopInfo?: {
    id: number;
    name: string;
    domain: string;
    email: string;
    currency: string; // ISO 4217 currency code (e.g., "USD", "JPY")
  };
  error?: string;
}> {
  try {
    const response = await fetch(
      `https://${shopDomain}/admin/api/2024-01/shop.json`,
      {
        headers: {
          'X-Shopify-Access-Token': apiToken,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      return {
        valid: false,
        error: response.status === 401 
          ? 'Invalid API token'
          : `Shopify API error: ${response.statusText}`
      };
    }

    const data = await response.json();
    
    return {
      valid: true,
      shopInfo: {
        id: data.shop.id,
        name: data.shop.name,
        domain: data.shop.domain,
        email: data.shop.email,
        currency: data.shop.currency || 'USD' // Shop's base currency
      }
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export type { ShopifyOrder, OrderSyncResult };

