-- Add free gifts settings to the settings table
ALTER TABLE settings
ADD COLUMN free_gifts_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN free_gifts_condition_type TEXT DEFAULT 'quantity', -- 'quantity' or 'amount'
ADD COLUMN free_gifts_headline TEXT DEFAULT 'Unlock Your Free Gifts!',
ADD COLUMN free_gifts_progress_color TEXT DEFAULT '#4CAF50',

-- Tier 1
ADD COLUMN free_gifts_tier1_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN free_gifts_tier1_threshold INTEGER DEFAULT 1,
ADD COLUMN free_gifts_tier1_product_handle TEXT,
ADD COLUMN free_gifts_tier1_variant_id TEXT,
ADD COLUMN free_gifts_tier1_reward_text TEXT DEFAULT 'Free Gift',

-- Tier 2
ADD COLUMN free_gifts_tier2_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN free_gifts_tier2_threshold INTEGER DEFAULT 2,
ADD COLUMN free_gifts_tier2_product_handle TEXT,
ADD COLUMN free_gifts_tier2_variant_id TEXT,
ADD COLUMN free_gifts_tier2_reward_text TEXT DEFAULT 'Free Gift',

-- Tier 3
ADD COLUMN free_gifts_tier3_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN free_gifts_tier3_threshold INTEGER DEFAULT 3,
ADD COLUMN free_gifts_tier3_product_handle TEXT,
ADD COLUMN free_gifts_tier3_variant_id TEXT,
ADD COLUMN free_gifts_tier3_reward_text TEXT DEFAULT 'Free Gift';

