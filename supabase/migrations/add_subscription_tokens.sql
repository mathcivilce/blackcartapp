-- Subscription Tokens Table
-- Stores tokens for users who have paid for subscription via Stripe
CREATE TABLE IF NOT EXISTS subscription_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,
  stripe_session_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  email TEXT NOT NULL,
  used BOOLEAN DEFAULT false,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_subscription_tokens_token ON subscription_tokens(token);
CREATE INDEX IF NOT EXISTS idx_subscription_tokens_session ON subscription_tokens(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_subscription_tokens_email ON subscription_tokens(email);

-- Enable Row Level Security
ALTER TABLE subscription_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policy (Service role only)
CREATE POLICY "Service role has full access to subscription_tokens" ON subscription_tokens
  FOR ALL USING (auth.role() = 'service_role');

