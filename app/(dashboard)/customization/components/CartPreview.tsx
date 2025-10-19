import React from 'react';

interface CartPreviewProps {
  design: {
    backgroundColor: string;
    cartAccentColor: string;
    cartTextColor: string;
    savingsTextColor: string;
    cornerRadius: string;
    buttonText: string;
    buttonColor: string;
    buttonTextColor: string;
    showSavings: boolean;
    showContinueShopping: boolean;
    showTotalOnButton: boolean;
    cartTitle: string;
    cartTitleAlignment: string;
    emptyCartText: string;
    savingsText: string;
    displayCompareAtPrice: boolean;
    closeButtonSize: string;
    closeButtonColor: string;
    closeButtonBorder: string;
    closeButtonBorderColor: string;
    useCartImage: boolean;
    cartImageUrl: string;
    cartImageMobileSize: string;
    cartImageDesktopSize: string;
    cartImagePosition: string;
    showPaymentIcons?: boolean;
    paymentIconAmex?: boolean;
    paymentIconApplePay?: boolean;
    paymentIconGooglePay?: boolean;
    paymentIconMastercard?: boolean;
    paymentIconPaypal?: boolean;
    paymentIconShopPay?: boolean;
    paymentIconVisa?: boolean;
  };
  addons: {
    enabled: boolean;
    title: string;
    description: string;
    price: string;
    acceptByDefault: boolean;
    adjustTotalPrice?: boolean;
    useCustomImage?: boolean;
    customImageUrl?: string;
    customImageSize?: number;
  };
  announcement?: {
    enabled: boolean;
    text: string;
    textColor: string;
    backgroundColor: string;
    position: string;
    countdownEnabled?: boolean;
    countdownType?: string;
    countdownEnd?: string;
    countdownDuration?: number;
    fontSize?: number;
    showBorder?: boolean;
    textBold?: boolean;
    textItalic?: boolean;
    textUnderline?: boolean;
    countdownBold?: boolean;
    countdownItalic?: boolean;
    countdownUnderline?: boolean;
    countdownTimeFormat?: string;
  };
  freeGifts?: {
    enabled: boolean;
    conditionType: string;
    headline: string;
    headlineColor?: string;
    progressColor: string;
    position: string;
    showBorder?: boolean;
    tier1: {
      enabled: boolean;
      threshold: number;
      productHandle: string;
      variantId: string;
      rewardText: string;
      unlockedMessage: string;
      showUnlockedMessage: boolean;
      icon: string;
    };
    tier2: {
      enabled: boolean;
      threshold: number;
      productHandle: string;
      variantId: string;
      rewardText: string;
      unlockedMessage: string;
      showUnlockedMessage: boolean;
      icon: string;
    };
    tier3: {
      enabled: boolean;
      threshold: number;
      productHandle: string;
      variantId: string;
      rewardText: string;
      unlockedMessage: string;
      showUnlockedMessage: boolean;
      icon: string;
    };
  };
}

// Countdown formatter
function formatCountdown(endTime: string, timeFormat: string = 'text'): string {
  if (!endTime) return timeFormat === 'numeric' ? '00:00' : '0m 0s';
  
  const end = new Date(endTime).getTime();
  const now = new Date().getTime();
  const distance = end - now;

  if (distance < 0) return 'EXPIRED';

  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((distance % (1000 * 60)) / 1000);

  if (timeFormat === 'numeric') {
    // Numeric format: HH:MM:SS or MM:SS
    if (days > 0 || hours > 0) {
      const totalHours = days * 24 + hours;
      return `${String(totalHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    } else {
      return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
  } else {
    // Text format: 13m 9s
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else {
      return `${minutes}m ${seconds}s`;
    }
  }
}

export default function CartPreview({ design, addons, announcement, freeGifts }: CartPreviewProps) {
  const [countdown, setCountdown] = React.useState('');

  const calculateTotal = () => {
    let total = 129.99;
    if (addons.enabled && addons.acceptByDefault && (addons.adjustTotalPrice !== false)) {
      total += parseFloat(addons.price || '0');
    }
    return total.toFixed(2);
  };

  // Update countdown every second if countdown is enabled
  React.useEffect(() => {
    if (announcement?.countdownEnabled) {
      const timeFormat = announcement.countdownTimeFormat || 'text';
      
      if (announcement.countdownType === 'fixed' && announcement.countdownEnd) {
        // Fixed countdown: show time until specific date
        const updateCountdown = () => {
          setCountdown(formatCountdown(announcement.countdownEnd!, timeFormat));
        };
        
        updateCountdown(); // Initial update
        const interval = setInterval(updateCountdown, 1000);
        
        return () => clearInterval(interval);
      } else if (announcement.countdownType === 'fresh' && announcement.countdownDuration) {
        // Fresh countdown: show duration counting down from start
        const startTime = Date.now();
        const endTime = startTime + (announcement.countdownDuration * 1000);
        
        const updateCountdown = () => {
          const now = Date.now();
          const remaining = Math.max(0, endTime - now);
          const seconds = Math.floor(remaining / 1000);
          
          const mins = Math.floor(seconds / 60);
          const secs = seconds % 60;
          
          if (remaining > 0) {
            if (timeFormat === 'numeric') {
              setCountdown(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
            } else {
              setCountdown(`${mins}m ${secs}s`);
            }
          } else {
            setCountdown('EXPIRED');
          }
        };
        
        updateCountdown(); // Initial update
        const interval = setInterval(updateCountdown, 1000);
        
        return () => clearInterval(interval);
      }
    }
  }, [announcement?.countdownEnabled, announcement?.countdownType, announcement?.countdownEnd, announcement?.countdownDuration, announcement?.countdownTimeFormat]);

  const renderAnnouncementText = () => {
    if (!announcement?.text) return announcement?.text || '';
    
    if (announcement.countdownEnabled && announcement.text.includes('{{ countdown }}')) {
      const parts = announcement.text.split('{{ countdown }}');
      const countdownStyle: React.CSSProperties = {
        fontWeight: announcement.countdownBold ? 'bold' : 'normal',
        fontStyle: announcement.countdownItalic ? 'italic' : 'normal',
        textDecoration: announcement.countdownUnderline ? 'underline' : 'none',
      };
      
      return (
        <>
          {parts[0]}
          <span style={countdownStyle}>{countdown || '00:00'}</span>
          {parts[1]}
        </>
      );
    }
    
    return announcement.text;
  };

  return (
    <div style={styles.container}>
      <div style={styles.previewLabel}>Preview</div>
      <div style={{
        ...styles.cartPreview,
        background: design.backgroundColor
      }}>
        {/* Cart Header */}
        <div style={{
          ...styles.cartHeader,
          justifyContent: design.useCartImage 
            ? (design.cartImagePosition === 'center' ? 'center' : 'space-between')
            : (design.cartTitleAlignment === 'center' ? 'center' : 'space-between'),
          position: 'relative' as const,
        }}>
          {design.useCartImage && design.cartImageUrl ? (
            <img 
              src={design.cartImageUrl} 
              alt="Cart"
              style={{
                height: `${design.cartImageDesktopSize}px`,
                maxWidth: '100%',
                objectFit: 'contain',
              }}
            />
          ) : (
            <h2 style={{ ...styles.cartTitle, color: design.cartTextColor }}>{design.cartTitle}</h2>
          )}
          <button style={{ 
            ...styles.closeButton, 
            color: design.closeButtonColor,
            fontSize: design.closeButtonSize === 'small' ? '20px' : design.closeButtonSize === 'large' ? '32px' : '24px',
            border: design.closeButtonBorder === 'none' ? 'none' : 
                    design.closeButtonBorder === 'thin' ? `1px solid ${design.closeButtonBorderColor}` :
                    design.closeButtonBorder === 'normal' ? `2px solid ${design.closeButtonBorderColor}` :
                    `3px solid ${design.closeButtonBorderColor}`,
            borderRadius: design.closeButtonBorder !== 'none' ? '4px' : '0',
            padding: design.closeButtonBorder !== 'none' ? '4px 8px' : '0',
            ...(design.useCartImage 
              ? (design.cartImagePosition === 'center' ? { position: 'absolute' as const, right: '20px' } : {})
              : (design.cartTitleAlignment === 'center' ? { position: 'absolute' as const, right: '20px' } : {})
            )
          }}>✕</button>
        </div>

        {/* Free Gifts Progress Bar - Top Position */}
        {freeGifts?.enabled && freeGifts.position === 'top' && (() => {
          // Mock current cart value for preview (1 item, $129.99)
          const currentValue = freeGifts.conditionType === 'quantity' ? 1 : 129.99;
          
          // Get all enabled tiers sorted by threshold
          const enabledTiers = [
            freeGifts.tier1.enabled ? { ...freeGifts.tier1, number: 1 } : null,
            freeGifts.tier2.enabled ? { ...freeGifts.tier2, number: 2 } : null,
            freeGifts.tier3.enabled ? { ...freeGifts.tier3, number: 3 } : null,
          ].filter(Boolean).sort((a, b) => (a?.threshold || 0) - (b?.threshold || 0));
          
          if (enabledTiers.length === 0) return null;
          
          const maxThreshold = Math.max(...enabledTiers.map(t => t?.threshold || 0));
          const progressPercentage = (currentValue / maxThreshold) * 100;
          
          // Find unlocked tiers with messages enabled
          const unlockedMessages = enabledTiers
            .filter(tier => currentValue >= (tier?.threshold || 0) && tier?.showUnlockedMessage)
            .map(tier => tier?.unlockedMessage);
          
          // Determine headline text: show unlocked message if available, otherwise default headline
          const headlineText = unlockedMessages.length > 0 
            ? unlockedMessages[unlockedMessages.length - 1] 
            : freeGifts.headline;
          
          return (
            <div style={{
              padding: '12px 20px 0 20px',
              borderTop: freeGifts.showBorder !== false ? '1px solid rgba(0,0,0,0.1)' : 'none',
              borderBottom: freeGifts.showBorder !== false ? '1px solid rgba(0,0,0,0.1)' : 'none',
            }}>
              {/* Headline (replaced by unlocked message when available) */}
              {headlineText && (
                <p style={{
                  margin: '0 0 6px 0',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: freeGifts.headlineColor || '#000000',
                  textAlign: 'center' as const,
                }}>
                  {headlineText}
                </p>
              )}
              
              {/* Progress Bar with Embedded Rewards */}
              <div style={{
                position: 'relative' as const,
                height: '65px',
                marginBottom: '0px',
              }}>
                {/* Bar segments container */}
                <div style={{
                  position: 'relative' as const,
                  height: '10px',
                  display: 'flex',
                  margin: '0 auto',
                  maxWidth: '90%',
                }}>
                  {enabledTiers.map((tier, index) => {
                    const segmentWidth = 100 / enabledTiers.length;
                    const isUnlocked = currentValue >= (tier?.threshold || 0);
                    const isLast = index === enabledTiers.length - 1;
                    
                    return (
                      <div key={tier?.number} style={{
                        width: `${segmentWidth}%`,
                        position: 'relative' as const,
                      }}>
                        {/* Segment bar */}
                        <div style={{
                          height: '10px',
                          background: isUnlocked ? freeGifts.progressColor : '#E5E7EB',
                          borderRadius: index === 0 ? '10px 0 0 10px' : isLast ? '0 10px 10px 0' : '0',
                          transition: 'all 0.3s ease',
                        }} />
                        
                        {/* Milestone dot and icon */}
                        <div style={{
                          position: 'absolute' as const,
                          right: isLast ? '0' : '-16px',
                          top: '-8px',
                          display: 'flex',
                          flexDirection: 'column' as const,
                          alignItems: 'center',
                          zIndex: 2,
                          transform: isLast ? 'translateX(50%)' : 'none',
                        }}>
                          {/* Icon circle */}
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: isUnlocked ? freeGifts.progressColor : '#E5E7EB',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '18px',
                            transition: 'all 0.3s ease',
                            border: '3px solid #fff',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                          }}>
                            {isUnlocked ? '✓' : (tier?.icon || '🎁')}
                          </div>
                          
                          {/* Reward text below bar */}
                          <div style={{
                            marginTop: '4px',
                            fontSize: '10px',
                            fontWeight: '400',
                            color: '#000000',
                            textAlign: 'center' as const,
                            maxWidth: '80px',
                            lineHeight: '1.2',
                            wordBreak: 'break-word' as const,
                            overflowWrap: 'break-word' as const,
                          }}>
                            {tier?.rewardText}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Announcement Banner - Top Position */}
        {announcement?.enabled && announcement.position === 'top' && (
          <div style={{
            padding: '12px 20px',
            background: announcement.backgroundColor,
            color: announcement.textColor,
            textAlign: 'center' as const,
            fontSize: `${announcement.fontSize || 14}px`,
            fontWeight: announcement.textBold ? 'bold' : 'normal',
            fontStyle: announcement.textItalic ? 'italic' : 'normal',
            textDecoration: announcement.textUnderline ? 'underline' : 'none',
            borderBottom: announcement.showBorder !== false ? '1px solid rgba(0,0,0,0.1)' : 'none',
            whiteSpace: 'pre-wrap' as const,
          }}>
            {renderAnnouncementText()}
          </div>
        )}

        {/* Cart Items */}
        <div style={styles.cartItems}>
          <div style={{ ...styles.cartItem, background: design.cartAccentColor }}>
            <img 
              src="https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop" 
              alt="Leather Sneakers" 
              style={styles.itemImage}
            />
            <div style={styles.itemDetails}>
              <div style={styles.itemHeader}>
                <p style={{ ...styles.itemTitle, color: design.cartTextColor }}>Leather Sneakers</p>
                <button style={styles.removeBtn} title="Remove item">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}>
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                </button>
              </div>
              <p style={styles.itemVariant}>Size 10</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                {design.displayCompareAtPrice && (
                  <span style={{ 
                    fontSize: '13px', 
                    color: '#999', 
                    textDecoration: 'line-through',
                  }}>$139.99</span>
                )}
                <span style={{ ...styles.itemPriceInline, color: design.cartTextColor }}>$129.99</span>
              </div>
              {design.showSavings && (
                <p style={{ ...styles.itemSavings, color: design.savingsTextColor }}>{design.savingsText} $10.00</p>
              )}
              <div style={styles.itemControls}>
                <div style={styles.itemQuantity}>
                  <button style={{ ...styles.qtyButton, color: design.cartTextColor }}>-</button>
                  <span style={{ color: design.cartTextColor, fontSize: '13px' }}>1</span>
                  <button style={{ ...styles.qtyButton, color: design.cartTextColor }}>+</button>
                </div>
                <span style={{ ...styles.itemPrice, color: design.cartTextColor }}>$129.99</span>
              </div>
            </div>
          </div>
        </div>

        {/* Announcement Banner - Bottom Position */}
        {announcement?.enabled && announcement.position === 'bottom' && (
          <div style={{
            padding: '12px 20px',
            background: announcement.backgroundColor,
            color: announcement.textColor,
            textAlign: 'center' as const,
            fontSize: `${announcement.fontSize || 14}px`,
            fontWeight: announcement.textBold ? 'bold' : 'normal',
            fontStyle: announcement.textItalic ? 'italic' : 'normal',
            textDecoration: announcement.textUnderline ? 'underline' : 'none',
            borderTop: announcement.showBorder !== false ? '1px solid rgba(0,0,0,0.1)' : 'none',
            whiteSpace: 'pre-wrap' as const,
          }}>
            {renderAnnouncementText()}
          </div>
        )}

        {/* Free Gifts Progress Bar - Bottom Position */}
        {freeGifts?.enabled && freeGifts.position === 'bottom' && (() => {
          // Mock current cart value for preview (1 item, $129.99)
          const currentValue = freeGifts.conditionType === 'quantity' ? 1 : 129.99;
          
          // Get all enabled tiers sorted by threshold
          const enabledTiers = [
            freeGifts.tier1.enabled ? { ...freeGifts.tier1, number: 1 } : null,
            freeGifts.tier2.enabled ? { ...freeGifts.tier2, number: 2 } : null,
            freeGifts.tier3.enabled ? { ...freeGifts.tier3, number: 3 } : null,
          ].filter(Boolean).sort((a, b) => (a?.threshold || 0) - (b?.threshold || 0));
          
          if (enabledTiers.length === 0) return null;
          
          const maxThreshold = Math.max(...enabledTiers.map(t => t?.threshold || 0));
          const progressPercentage = (currentValue / maxThreshold) * 100;
          
          // Find unlocked tiers with messages enabled
          const unlockedMessages = enabledTiers
            .filter(tier => currentValue >= (tier?.threshold || 0) && tier?.showUnlockedMessage)
            .map(tier => tier?.unlockedMessage);
          
          // Determine headline text: show unlocked message if available, otherwise default headline
          const headlineText = unlockedMessages.length > 0 
            ? unlockedMessages[unlockedMessages.length - 1] 
            : freeGifts.headline;
          
          return (
            <div style={{
              padding: '12px 20px 0 20px',
              borderTop: freeGifts.showBorder !== false ? '1px solid rgba(0,0,0,0.1)' : 'none',
              borderBottom: freeGifts.showBorder !== false ? '1px solid rgba(0,0,0,0.1)' : 'none',
            }}>
              {/* Headline (replaced by unlocked message when available) */}
              {headlineText && (
                <p style={{
                  margin: '0 0 6px 0',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: freeGifts.headlineColor || '#000000',
                  textAlign: 'center' as const,
                }}>
                  {headlineText}
                </p>
              )}
              
              {/* Progress Bar with Embedded Rewards */}
              <div style={{
                position: 'relative' as const,
                height: '65px',
                marginBottom: '0px',
              }}>
                {/* Bar segments container */}
                <div style={{
                  position: 'relative' as const,
                  height: '10px',
                  display: 'flex',
                  margin: '0 auto',
                  maxWidth: '90%',
                }}>
                  {enabledTiers.map((tier, index) => {
                    const segmentWidth = 100 / enabledTiers.length;
                    const isUnlocked = currentValue >= (tier?.threshold || 0);
                    const isLast = index === enabledTiers.length - 1;
                    
                    return (
                      <div key={tier?.number} style={{
                        width: `${segmentWidth}%`,
                        position: 'relative' as const,
                      }}>
                        {/* Segment bar */}
                        <div style={{
                          height: '10px',
                          background: isUnlocked ? freeGifts.progressColor : '#E5E7EB',
                          borderRadius: index === 0 ? '10px 0 0 10px' : isLast ? '0 10px 10px 0' : '0',
                          transition: 'all 0.3s ease',
                        }} />
                        
                        {/* Milestone dot and icon */}
                        <div style={{
                          position: 'absolute' as const,
                          right: isLast ? '0' : '-16px',
                          top: '-8px',
                          display: 'flex',
                          flexDirection: 'column' as const,
                          alignItems: 'center',
                          zIndex: 2,
                          transform: isLast ? 'translateX(50%)' : 'none',
                        }}>
                          {/* Icon circle */}
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: isUnlocked ? freeGifts.progressColor : '#E5E7EB',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '18px',
                            transition: 'all 0.3s ease',
                            border: '3px solid #fff',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                          }}>
                            {isUnlocked ? '✓' : (tier?.icon || '🎁')}
                          </div>
                          
                          {/* Reward text below bar */}
                          <div style={{
                            marginTop: '4px',
                            fontSize: '10px',
                            fontWeight: '400',
                            color: '#000000',
                            textAlign: 'center' as const,
                            maxWidth: '80px',
                            lineHeight: '1.2',
                            wordBreak: 'break-word' as const,
                            overflowWrap: 'break-word' as const,
                          }}>
                            {tier?.rewardText}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Cart Footer */}
        <div style={styles.cartFooter}>
          {/* Shipping Protection */}
          {addons.enabled && (
            <div style={styles.protectionContainer}>
              <div style={styles.protectionToggle}>
                <div style={styles.protectionIcon}>
                  <img 
                    src={addons.useCustomImage && addons.customImageUrl ? addons.customImageUrl : "/add-on.png"} 
                    alt="Add-on icon" 
                    width={addons.useCustomImage && addons.customImageSize ? addons.customImageSize : 48} 
                    height={addons.useCustomImage && addons.customImageSize ? addons.customImageSize : 48} 
                    style={{ display: 'block', objectFit: 'contain' }}
                  />
                </div>
                <div style={styles.protectionInfo}>
                  <h3 style={styles.protectionTitle}>{addons.title}</h3>
                  <p style={styles.protectionDescription}>
                    {addons.description}
                  </p>
                </div>
                <div style={styles.protectionRight}>
                  <span style={styles.protectionPrice}>${addons.price}</span>
                  <label style={styles.toggleSwitch}>
                    <input 
                      type="checkbox" 
                      checked={addons.acceptByDefault}
                      readOnly
                      style={{ opacity: 0, width: 0, height: 0 }} 
                    />
                    <span style={{
                      ...styles.toggleSlider,
                      backgroundColor: addons.acceptByDefault ? '#2196F3' : '#ccc'
                    }}>
                      <span style={{
                        ...styles.toggleKnob,
                        transform: addons.acceptByDefault ? 'translateX(18px)' : 'translateX(0)'
                      }}></span>
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          <button 
            style={{
              ...styles.checkoutButton,
              background: design.buttonColor,
              color: design.buttonTextColor,
              borderRadius: `${design.cornerRadius}px`
            }}
          >
            {design.buttonText}
            {design.showTotalOnButton && ` • $${calculateTotal()}`}
          </button>
          {design.showContinueShopping && (
            <button style={{ ...styles.continueButton, color: design.cartTextColor }}>
              Or continue shopping
            </button>
          )}
          
          {/* Payment Icons */}
          {design.showPaymentIcons && (
            <div style={styles.paymentIcons}>
              {design.paymentIconVisa && (
                <img src="/visa.svg" alt="Visa" style={styles.paymentIcon} />
              )}
              {design.paymentIconMastercard && (
                <img src="/mastercard.svg" alt="Mastercard" style={styles.paymentIcon} />
              )}
              {design.paymentIconAmex && (
                <img src="/amex.svg" alt="American Express" style={styles.paymentIcon} />
              )}
              {design.paymentIconPaypal && (
                <img src="/paypal.svg" alt="PayPal" style={styles.paymentIcon} />
              )}
              {design.paymentIconApplePay && (
                <img src="/applepay.svg" alt="Apple Pay" style={styles.paymentIcon} />
              )}
              {design.paymentIconGooglePay && (
                <img src="/googlepay.svg" alt="Google Pay" style={styles.paymentIcon} />
              )}
              {design.paymentIconShopPay && (
                <img src="/shoppay.svg" alt="Shop Pay" style={styles.paymentIcon} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: '100%',
    position: 'sticky' as const,
    top: '0',
  },
  previewLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#888',
    marginBottom: '12px',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
  },
  cartPreview: {
    border: '1px solid #333',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
    height: 'calc(100% - 50px)',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  cartHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    borderBottom: '1px solid #e5e5e5',
  },
  cartTitle: {
    fontSize: '20px',
    fontWeight: '600',
    margin: 0,
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    padding: '0',
  },
  cartItems: {
    padding: '20px',
    flex: 1,
    overflowY: 'auto' as const,
  },
  cartItem: {
    display: 'flex',
    gap: '12px',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '12px',
  },
  itemImage: {
    width: '60px',
    height: '60px',
    background: '#ccc',
    borderRadius: '6px',
    objectFit: 'cover' as const,
  },
  itemDetails: {
    flex: 1,
  },
  itemHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    marginBottom: '2px',
  },
  itemTitle: {
    fontSize: '13px',
    fontWeight: '600',
    margin: 0,
    flex: 1,
  },
  removeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#999',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '20px',
    height: '20px',
  },
  itemVariant: {
    fontSize: '12px',
    color: '#999999',
    margin: 0,
  },
  itemPriceInline: {
    fontSize: '14px',
    fontWeight: '400',
  },
  itemPrice: {
    fontSize: '14px',
    fontWeight: '400',
    margin: 0,
  },
  itemSavings: {
    fontSize: '12px',
    fontWeight: '500',
    margin: '4px 0 0 0',
  },
  itemControls: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    marginTop: '8px',
  },
  itemQuantity: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    border: '1px solid #e5e5e5',
    borderRadius: '4px',
    padding: '2px',
  },
  qtyButton: {
    background: 'none',
    border: 'none',
    fontSize: '14px',
    cursor: 'pointer',
    padding: 0,
    width: '22px',
    height: '22px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartFooter: {
    padding: '20px',
    borderTop: '1px solid #e5e5e5',
  },
  protectionContainer: {
    background: '#f8f9fa',
    padding: '0',
    marginBottom: '20px',
    borderRadius: '8px',
  },
  protectionToggle: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  protectionIcon: {
    flexShrink: 0,
  },
  protectionInfo: {
    flex: 1,
  },
  protectionTitle: {
    fontSize: '16px',
    fontWeight: '400',
    color: '#000',
    margin: '0 0 4px 0',
  },
  protectionDescription: {
    fontSize: '13px',
    color: '#666',
    margin: 0,
  },
  protectionRight: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'flex-end',
    gap: '8px',
    flexShrink: 0,
  },
  protectionPrice: {
    fontSize: '16px',
    fontWeight: '400',
    color: '#000',
    margin: 0,
  },
  toggleSwitch: {
    position: 'relative' as const,
    display: 'inline-block',
    width: '42px',
    height: '24px',
  },
  toggleSlider: {
    position: 'absolute' as const,
    cursor: 'pointer',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    transition: '0.3s',
    borderRadius: '31px',
    display: 'block',
  },
  toggleKnob: {
    position: 'absolute' as const,
    content: '""',
    height: '18px',
    width: '18px',
    left: '3px',
    bottom: '3px',
    backgroundColor: 'white',
    transition: '0.3s',
    borderRadius: '50%',
    display: 'block',
  },
  checkoutButton: {
    width: '100%',
    padding: '16px',
    fontSize: '16px',
    fontWeight: '600',
    border: 'none',
    cursor: 'pointer',
    marginBottom: '12px',
  },
  continueButton: {
    width: '100%',
    padding: '0',
    fontSize: '14px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'center' as const,
  },
  paymentIcons: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '8px',
    marginTop: '16px',
    flexWrap: 'wrap' as const,
  },
  paymentIcon: {
    height: '24px',
    width: 'auto',
    objectFit: 'contain' as const,
  },
};

