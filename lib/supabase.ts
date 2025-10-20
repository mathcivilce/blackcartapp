import { createClient } from '@supabase/supabase-js';

// Supabase configuration
// ⚡ Edge Runtime Compatible - Works on both Deno (Edge) and Node.js (Serverless)
// @supabase/supabase-js uses fetch API which is available in both runtimes
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ezzpivxxdxcdnmerrcbt.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6enBpdnh4ZHhjZG5tZXJyY2J0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDIwNzE0NiwiZXhwIjoyMDc1NzgzMTQ2fQ.KbKQ0SKyqXYFqylxtUPCr07DiyCdcvwat_YV9tjQoMg';

// Log which key is being used (only log first/last 8 chars for security)
// Compatible with both Edge Runtime (Deno) and Node.js serverless
const isServer = typeof window === 'undefined';
if (isServer) {
  const keySource = process.env.SUPABASE_SERVICE_ROLE_KEY ? 'ENVIRONMENT' : 'FALLBACK';
  const keyPreview = supabaseServiceKey.substring(0, 8) + '...' + supabaseServiceKey.substring(supabaseServiceKey.length - 8);
  
  // Type-safe runtime detection: check if Deno exists in global scope
  // @ts-ignore - Deno only exists in Edge runtime, not during build
  const isEdgeRuntime = typeof globalThis.Deno !== 'undefined';
  const runtime = isEdgeRuntime ? 'EDGE (Deno)' : 'SERVERLESS (Node.js)';
  
  console.log(`⚡ [Supabase] Runtime: ${runtime}`);
  console.log(`🔑 [Supabase] Using service role key from: ${keySource}`);
  console.log(`🔑 [Supabase] Key preview: ${keyPreview}`);
}

// Create Supabase client with service role key (for server-side only)
// The service role key should bypass ALL RLS policies automatically
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'apikey': supabaseServiceKey // Explicitly set API key header
    }
  }
});

// Helper function to execute queries with retry logic for intermittent connection issues
export async function supabaseQueryWithRetry<T = any>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  maxRetries = 3,
  retryDelay = 100
): Promise<{ data: T | null; error: any }> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await queryFn();
      
      // If we got data or a real error (not a connection issue), return immediately
      if (result.data || (result.error && result.error.code)) {
        return result;
      }
      
      // If no data and no error, might be a connection issue - retry
      if (attempt < maxRetries) {
        console.log(`⚠️ [Supabase] Empty result on attempt ${attempt}/${maxRetries}, retrying...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
        continue;
      }
      
      return result;
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        console.log(`⚠️ [Supabase] Query failed on attempt ${attempt}/${maxRetries}:`, error);
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
      }
    }
  }
  
  return { data: null, error: lastError };
}

// Database types
export interface Store {
  id: string;
  shop_domain: string;
  shop_name?: string;
  email?: string;
  api_token?: string;
  stripe_customer_id?: string;
  subscription_status: 'active' | 'past_due' | 'canceled';
  user_id?: string;
  access_token?: string;
  created_at: string;
  updated_at: string;
}

export interface Settings {
  id: string;
  store_id: string;
  protection_product_id?: string;
  price: number;
  toggle_color: string;
  toggle_text: string;
  description: string;
  enabled: boolean;
  cart_active?: boolean;
  created_at: string;
  updated_at: string;
  
  // Design settings
  background_color?: string;
  cart_accent_color?: string;
  cart_text_color?: string;
  savings_text_color?: string;
  corner_radius?: number;
  button_text?: string;
  button_color?: string;
  button_text_color?: string;
  button_text_hover_color?: string;
  show_savings?: boolean;
  show_continue_shopping?: boolean;
  show_total_on_button?: boolean;
  cart_title?: string;
  cart_title_alignment?: string;
  empty_cart_text?: string;
  savings_text?: string;
  display_compare_at_price?: boolean;
  
  // Close button customization
  close_button_size?: string;
  close_button_color?: string;
  close_button_border?: string;
  close_button_border_color?: string;
  
  // Cart image settings
  use_cart_image?: boolean;
  cart_image_url?: string;
  cart_image_mobile_size?: number;
  cart_image_desktop_size?: number;
  cart_image_position?: string;
  
  // Payment icons settings
  show_payment_icons?: boolean;
  payment_icon_amex?: boolean;
  payment_icon_applepay?: boolean;
  payment_icon_googlepay?: boolean;
  payment_icon_mastercard?: boolean;
  payment_icon_paypal?: boolean;
  payment_icon_shoppay?: boolean;
  payment_icon_visa?: boolean;
  
  // Total savings and estimated total
  show_total_savings?: boolean;
  total_savings_text?: string;
  show_estimated_total?: boolean;
  estimated_total_text?: string;
  
  // Announcement settings
  announcement_enabled?: boolean;
  announcement_text?: string;
  announcement_text_color?: string;
  announcement_background_color?: string;
  announcement_position?: string;
  announcement_countdown_enabled?: boolean;
  announcement_countdown_type?: string;
  announcement_countdown_end?: string;
  announcement_countdown_duration?: number;
  announcement_font_size?: number;
  announcement_show_border?: boolean;
  announcement_text_bold?: boolean;
  announcement_text_italic?: boolean;
  announcement_text_underline?: boolean;
  announcement_countdown_bold?: boolean;
  announcement_countdown_italic?: boolean;
  announcement_countdown_underline?: boolean;
  announcement_countdown_time_format?: string;
  
  // Add-ons settings
  addons_enabled?: boolean;
  addon_title?: string;
  addon_description?: string;
  addon_price?: number;
  addon_product_id?: string;
  addon_accept_by_default?: boolean;
  addon_adjust_total_price?: boolean;
  addon_use_custom_image?: boolean;
  addon_custom_image_url?: string;
  addon_custom_image_size?: number;
  
  // Free gifts settings
  free_gifts_enabled?: boolean;
  free_gifts_condition_type?: string;
  free_gifts_headline?: string;
  free_gifts_progress_color?: string;
  free_gifts_position?: string;
  
  // Tier 1
  free_gifts_tier1_enabled?: boolean;
  free_gifts_tier1_threshold?: number;
  free_gifts_tier1_product_handle?: string;
  free_gifts_tier1_variant_id?: string;
  free_gifts_tier1_reward_text?: string;
  free_gifts_tier1_unlocked_message?: string;
  free_gifts_tier1_show_unlocked_message?: boolean;
  free_gifts_tier1_icon?: string;
  
  // Tier 2
  free_gifts_tier2_enabled?: boolean;
  free_gifts_tier2_threshold?: number;
  free_gifts_tier2_product_handle?: string;
  free_gifts_tier2_variant_id?: string;
  free_gifts_tier2_reward_text?: string;
  free_gifts_tier2_unlocked_message?: string;
  free_gifts_tier2_show_unlocked_message?: boolean;
  free_gifts_tier2_icon?: string;
  
  // Tier 3
  free_gifts_tier3_enabled?: boolean;
  free_gifts_tier3_threshold?: number;
  free_gifts_tier3_product_handle?: string;
  free_gifts_tier3_variant_id?: string;
  free_gifts_tier3_reward_text?: string;
  free_gifts_tier3_unlocked_message?: string;
  free_gifts_tier3_show_unlocked_message?: boolean;
  free_gifts_tier3_icon?: string;
  
  // Free gifts additional settings
  free_gifts_show_border?: boolean;
  free_gifts_headline_color?: string;
  free_gifts_headline_bold?: boolean;
  
  // Upsell settings
  upsell_enabled?: boolean;
  upsell_headline_enabled?: boolean;
  upsell_headline_text?: string;
  upsell_button_color?: string;
  upsell_button_corner_radius?: number;
  upsell_item1_enabled?: boolean;
  upsell_item1_product_handle?: string;
  upsell_item1_variant_id?: string;
  upsell_item2_enabled?: boolean;
  upsell_item2_product_handle?: string;
  upsell_item2_variant_id?: string;
  upsell_item3_enabled?: boolean;
  upsell_item3_product_handle?: string;
  upsell_item3_variant_id?: string;
}

export interface Sale {
  id: string;
  store_id: string;
  order_id: string;
  order_number?: string;
  protection_price: number;
  commission: number;
  month: string;
  created_at: string;
}

export interface Invoice {
  id: string;
  store_id: string;
  month: string;
  subscription_fee: number;
  commission_total: number;
  total_amount: number;
  sales_count: number;
  status: 'pending' | 'paid' | 'failed';
  stripe_invoice_id?: string;
  paid_at?: string;
  created_at: string;
}

