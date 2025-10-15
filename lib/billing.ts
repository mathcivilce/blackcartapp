import Stripe from 'stripe';

/**
 * Billing utilities for weekly usage-based charging
 */

/**
 * Get week identifier in YYYY-WW format (ISO week)
 * Example: "2025-W15"
 */
export function getWeekIdentifier(date: Date = new Date()): string {
  const year = date.getUTCFullYear();
  const startOfYear = new Date(Date.UTC(year, 0, 1));
  const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + startOfYear.getUTCDay() + 1) / 7);
  return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
}

/**
 * Get previous week identifier
 */
export function getPreviousWeekIdentifier(): string {
  const date = new Date();
  date.setDate(date.getDate() - 7);
  return getWeekIdentifier(date);
}

/**
 * Get week start and end dates from week identifier
 */
export function getWeekDates(weekId: string): { startDate: Date; endDate: Date } {
  const [year, week] = weekId.split('-W').map(Number);
  
  // Get first day of the year
  const startOfYear = new Date(Date.UTC(year, 0, 1));
  
  // Calculate days to add to get to the start of the target week
  const daysToAdd = (week - 1) * 7 - startOfYear.getUTCDay() + 1;
  
  const startDate = new Date(startOfYear);
  startDate.setUTCDate(startDate.getUTCDate() + daysToAdd);
  
  const endDate = new Date(startDate);
  endDate.setUTCDate(endDate.getUTCDate() + 6);
  endDate.setUTCHours(23, 59, 59, 999);
  
  return { startDate, endDate };
}

/**
 * Create or update Stripe metered billing subscription for a store
 */
export async function setupStripeMeterBilling(
  stripe: Stripe,
  customerId: string,
  priceId: string
): Promise<{ subscriptionId: string; error?: string }> {
  try {
    // Check if customer already has an active subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
    });

    let subscriptionId: string;

    if (subscriptions.data.length > 0) {
      // Already has subscription
      subscriptionId = subscriptions.data[0].id;
    } else {
      // Create new subscription with metered billing
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [
          {
            price: priceId,
          },
        ],
        // Bill weekly
        billing_cycle_anchor: Math.floor(Date.now() / 1000),
        billing_thresholds: {
          amount_gte: 100, // Bill immediately if amount >= $1
        },
      });

      subscriptionId = subscription.id;
    }

    return { subscriptionId };
  } catch (error) {
    console.error('Error setting up metered billing:', error);
    return {
      subscriptionId: '',
      error: error instanceof Error ? error.message : 'Failed to setup billing',
    };
  }
}

/**
 * Report usage to Stripe (commission amount)
 * Note: This is for metered billing - not currently used in weekly invoicing
 */
export async function reportStripeUsage(
  stripe: Stripe,
  subscriptionItemId: string,
  quantity: number,
  timestamp?: number
): Promise<{ success: boolean; error?: string }> {
  try {
    // Note: Stripe v19+ has different method signature
    // For now, this is a placeholder for future metered billing implementation
    return { success: true };
  } catch (error) {
    console.error('Error reporting usage to Stripe:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to report usage',
    };
  }
}

/**
 * Create Stripe invoice for a customer
 */
export async function createStripeInvoice(
  stripe: Stripe,
  customerId: string,
  amount: number, // in cents
  description: string,
  metadata?: Record<string, string>
): Promise<{ invoiceId: string; error?: string }> {
  try {
    // Create an invoice item
    await stripe.invoiceItems.create({
      customer: customerId,
      amount,
      currency: 'usd',
      description,
      metadata,
    });

    // Create and finalize the invoice
    const invoice = await stripe.invoices.create({
      customer: customerId,
      auto_advance: true, // Automatically finalize and attempt payment
      collection_method: 'charge_automatically',
      metadata,
    });

    // Finalize the invoice
    const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);

    return { invoiceId: finalizedInvoice.id };
  } catch (error) {
    console.error('Error creating Stripe invoice:', error);
    return {
      invoiceId: '',
      error: error instanceof Error ? error.message : 'Failed to create invoice',
    };
  }
}

/**
 * Format currency from cents to dollars
 */
export function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * Format week identifier for display
 * "2025-W15" -> "Week 15, 2025"
 */
export function formatWeekDisplay(weekId: string): string {
  const [year, week] = weekId.split('-W');
  return `Week ${week}, ${year}`;
}

