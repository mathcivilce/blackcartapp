import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.11.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('💰 Starting weekly invoice generation...')
    const startTime = Date.now()

    // Parse request body to check for test mode and specific store
    const { test_mode, store_id } = await req.json().catch(() => ({ test_mode: false, store_id: null }))
    
    // Calculate week identifier and date range
    const now = new Date()
    let weekStart: Date
    let weekEnd: Date
    let weekIdentifier: string

    if (test_mode) {
      console.log('🧪 TEST MODE: Generating invoices for current week')
      // Current week (for testing)
      const dayOfWeek = now.getUTCDay()
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
      weekStart = new Date(now)
      weekStart.setUTCDate(now.getUTCDate() - daysToMonday)
      weekStart.setUTCHours(0, 0, 0, 0)
      
      weekEnd = new Date(weekStart)
      weekEnd.setUTCDate(weekStart.getUTCDate() + 6)
      weekEnd.setUTCHours(23, 59, 59, 999)
      
      const year = weekStart.getUTCFullYear()
      const weekNumber = getWeekNumber(weekStart)
      weekIdentifier = `${year}-W${String(weekNumber).padStart(2, '0')}`
    } else {
      // Previous week (for production)
      const dayOfWeek = now.getUTCDay()
      const daysToLastMonday = dayOfWeek === 0 ? 13 : dayOfWeek + 6
      weekStart = new Date(now)
      weekStart.setUTCDate(now.getUTCDate() - daysToLastMonday)
      weekStart.setUTCHours(0, 0, 0, 0)
      
      weekEnd = new Date(weekStart)
      weekEnd.setUTCDate(weekStart.getUTCDate() + 6)
      weekEnd.setUTCHours(23, 59, 59, 999)
      
      const year = weekStart.getUTCFullYear()
      const weekNumber = getWeekNumber(weekStart)
      weekIdentifier = `${year}-W${String(weekNumber).padStart(2, '0')}`
    }

    console.log(`📅 Generating invoices for week: ${weekIdentifier}`)
    console.log(`Period: ${weekStart.toISOString()} to ${weekEnd.toISOString()}`)

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Initialize Stripe
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')!
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2025-09-30.clover',
      httpClient: Stripe.createFetchHttpClient(),
    })

    // Get all stores with Stripe customers (or specific store if store_id provided)
    let storesQuery = supabase
      .from('stores')
      .select('id, shop_domain, stripe_customer_id, platform_fee')
      .not('stripe_customer_id', 'is', null)
    
    // If specific store_id provided, filter to that store only
    if (store_id) {
      console.log(`🎯 Generating invoice for specific store: ${store_id}`)
      storesQuery = storesQuery.eq('id', store_id)
    }

    const { data: stores, error: storesError } = await storesQuery

    if (storesError) throw storesError

    console.log(`Found ${stores?.length || 0} stores with Stripe customers`)

    let created = 0
    let failed = 0

    for (const store of stores || []) {
      try {
        console.log(`Processing ${store.shop_domain}...`)

        // Calculate total commission for this store in the week
        const { data: sales, error: salesError } = await supabase
          .from('sales')
          .select('commission')
          .eq('store_id', store.id)
          .eq('week', weekIdentifier)

        if (salesError) throw salesError

        // Commission is stored as INTEGER (cents), so divide by 100 to get dollars
        const totalCommission = sales?.reduce((sum, sale) => sum + (parseFloat(sale.commission) / 100), 0) || 0

        console.log(`${sales?.length || 0} sales, commission: $${totalCommission.toFixed(2)}`)

        if (totalCommission === 0) {
          console.log(`⏭️ No sales for ${store.shop_domain}, skipping invoice`)
          continue
        }

        // Get the customer's payment method from their active subscription
        console.log('Fetching customer payment method...')
        const subscriptions = await stripe.subscriptions.list({
          customer: store.stripe_customer_id,
          status: 'active',
          limit: 1,
        })
        
        let defaultPaymentMethod = null
        if (subscriptions.data.length > 0) {
          const subscription = subscriptions.data[0]
          defaultPaymentMethod = subscription.default_payment_method as string
          console.log(`✅ Found payment method from subscription: ${defaultPaymentMethod}`)
        } else {
          console.log('⚠️ No active subscription found')
        }

        // Step 1: Create DRAFT invoice FIRST
        console.log('Creating draft invoice...')
        const invoiceParams: any = {
          customer: store.stripe_customer_id,
          auto_advance: false, // Create as draft
          collection_method: 'charge_automatically',
          metadata: {
            store_id: store.id,
            shop_domain: store.shop_domain,
            week: weekIdentifier,
            week_start: weekStart.toISOString(),
            week_end: weekEnd.toISOString(),
          },
          description: `Weekly commission for ${weekIdentifier}`,
        }
        
        // Add payment method if available
        if (defaultPaymentMethod) {
          invoiceParams.default_payment_method = defaultPaymentMethod
        }
        
        const invoice = await stripe.invoices.create(invoiceParams)
        console.log(`✅ Draft invoice created: ${invoice.id}`)

        // Step 2: Add invoice item TO this specific invoice
        console.log('Adding invoice item to invoice...')
        const invoiceItem = await stripe.invoiceItems.create({
          customer: store.stripe_customer_id,
          invoice: invoice.id, // 👈 Attach to this specific invoice
          amount: Math.round(totalCommission * 100), // Convert to cents
          currency: 'usd',
          description: `Weekly commission for ${weekIdentifier}`,
        })
        console.log(`✅ Invoice item added: ${invoiceItem.id}`)

        // Retrieve the invoice to verify amount
        console.log('Retrieving updated invoice...')
        const updatedInvoice = await stripe.invoices.retrieve(invoice.id)
        console.log(`Amount due: $${(updatedInvoice.amount_due / 100).toFixed(2)}`)

        // Verify the amount is correct
        if (updatedInvoice.amount_due === 0) {
          console.error('❌ ERROR: Invoice has $0.00 amount due!')
          console.error(`Expected: $${totalCommission.toFixed(2)}`)
          console.error(`Invoice items:`, updatedInvoice.lines.data)
          throw new Error('Invoice amount is $0.00 - invoice item not attached properly')
        }

        // Finalize the invoice
        console.log('Finalizing invoice...')
        const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id)
        console.log(`✅ Stripe invoice finalized: ${finalizedInvoice.id}`)
        console.log(`Status: ${finalizedInvoice.status}`)
        console.log(`Amount: $${(finalizedInvoice.amount_due / 100).toFixed(2)}`)

        // Pay the invoice immediately with the payment method
        if (defaultPaymentMethod) {
          console.log('Paying invoice with payment method...')
          const paidInvoice = await stripe.invoices.pay(finalizedInvoice.id, {
            payment_method: defaultPaymentMethod,
          })
          console.log(`✅ Invoice paid: ${paidInvoice.id}`)
          console.log(`Status: ${paidInvoice.status}`)
          console.log(`Paid: ${paidInvoice.paid}`)
          console.log(`URL: ${paidInvoice.hosted_invoice_url}`)
          
          // Use the paid invoice for database save
          finalizedInvoice.status = paidInvoice.status
          finalizedInvoice.paid = paidInvoice.paid
        } else {
          console.log('⚠️ No payment method available, invoice left as open')
          console.log(`URL: ${finalizedInvoice.hosted_invoice_url}`)
        }

        // Save to database
        const { error: insertError } = await supabase
          .from('invoices')
          .insert({
            store_id: store.id,
            week: weekIdentifier,
            week_start_date: weekStart.toISOString().split('T')[0], // Convert to date
            week_end_date: weekEnd.toISOString().split('T')[0], // Convert to date
            sales_count: sales?.length || 0,
            commission_total: Math.round(totalCommission * 100), // Store as cents
            subscription_fee: 0, // No subscription fee for weekly commission
            total_amount: Math.round(totalCommission * 100), // Store as cents
            stripe_invoice_id: finalizedInvoice.id,
            status: finalizedInvoice.status,
            paid_at: finalizedInvoice.paid ? new Date().toISOString() : null,
          })

        if (insertError) throw insertError

        console.log(`✅ Invoice saved for ${store.shop_domain}`)
        created++

      } catch (error) {
        console.error(`❌ Failed to create invoice for ${store.shop_domain}:`, error)
        failed++
      }
    }

    const duration = Date.now() - startTime
    console.log(`✅ Invoice generation completed in ${duration}ms`)
    console.log(`Created: ${created}, Failed: ${failed}`)

    // Calculate total commission for all created invoices
    const { data: createdInvoices } = await supabase
      .from('invoices')
      .select('commission_total')
      .eq('week', weekIdentifier)
    
    const totalCommissionCents = createdInvoices?.reduce((sum, inv) => sum + (inv.commission_total || 0), 0) || 0

    return new Response(
      JSON.stringify({ 
        success: true,
        results: {
          invoices_created: created,
          invoices_failed: failed,
          total_commission: totalCommissionCents,
          week: weekIdentifier,
          test_mode
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Invoice generation error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return weekNo
}

