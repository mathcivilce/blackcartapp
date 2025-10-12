import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Create Supabase client with service role key (for server-side only)
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Database types
export interface Store {
  id: string;
  shop_domain: string;
  shop_name?: string;
  email?: string;
  api_token?: string;
  stripe_customer_id?: string;
  subscription_status: 'active' | 'past_due' | 'canceled';
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
  created_at: string;
  updated_at: string;
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

