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
  
  // Add-ons settings
  addons_enabled?: boolean;
  addon_title?: string;
  addon_description?: string;
  addon_price?: number;
  addon_product_id?: string;
  addon_accept_by_default?: boolean;
  addon_adjust_total_price?: boolean;
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

