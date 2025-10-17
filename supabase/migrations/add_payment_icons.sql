-- Add payment icons settings to design settings
ALTER TABLE settings
ADD COLUMN IF NOT EXISTS show_payment_icons BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS payment_icon_amex BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS payment_icon_applepay BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS payment_icon_googlepay BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS payment_icon_mastercard BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS payment_icon_paypal BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS payment_icon_shoppay BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS payment_icon_visa BOOLEAN DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN settings.show_payment_icons IS 'Display payment method icons below checkout button';
COMMENT ON COLUMN settings.payment_icon_amex IS 'Show American Express icon';
COMMENT ON COLUMN settings.payment_icon_applepay IS 'Show Apple Pay icon';
COMMENT ON COLUMN settings.payment_icon_googlepay IS 'Show Google Pay icon';
COMMENT ON COLUMN settings.payment_icon_mastercard IS 'Show Mastercard icon';
COMMENT ON COLUMN settings.payment_icon_paypal IS 'Show PayPal icon';
COMMENT ON COLUMN settings.payment_icon_shoppay IS 'Show Shop Pay icon';
COMMENT ON COLUMN settings.payment_icon_visa IS 'Show Visa icon';

