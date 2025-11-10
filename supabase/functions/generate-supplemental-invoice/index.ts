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
    console.log('💰 Starting supplemental invoice generation...')

    // Parse request body
    const { store_id, week, original_invoice_id } = await req.json()

    if (!store_id || !week) {
      return new Response(
        JSON.stringify({ error: 'store_id and week are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`📋 Generating supplemental invoice for store: ${store_id}, week: ${week}`)

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

    // Get store info
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, shop_domain, stripe_customer_id, platform_fee')
      .eq('id', store_id)
      .single()

    if (storeError || !store) {
      throw new Error(`Store not found: ${storeError?.message}`)
    }

    console.log(`✅ Found store: ${store.shop_domain}`)

    // Get the original invoice for this week
    const { data: originalInvoice, error: originalInvoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('store_id', store_id)
      .eq('week', week)
      .single()

    if (originalInvoiceError || !originalInvoice) {
      throw new Error(`Original invoice not found for week ${week}`)
    }

    console.log(`📄 Original invoice: ${originalInvoice.sales_count} sales, $${(originalInvoice.commission_total / 100).toFixed(2)}`)

    // Calculate actual total commission for ALL sales in this week using batching
    let allSales: any[] = []
    let hasMore = true
    let offset = 0
    const batchSize = 1000

    while (hasMore) {
      const { data: salesBatch, error: salesError } = await supabase
        .from('sales')
        .select('commission')
        .eq('store_id', store_id)
        .eq('week', week)
        .range(offset, offset + batchSize - 1)

      if (salesError) throw salesError

      if (salesBatch && salesBatch.length > 0) {
        allSales = allSales.concat(salesBatch)
        offset += batchSize
        hasMore = salesBatch.length === batchSize
      } else {
        hasMore = false
      }
    }

    const actualTotalCommissionCents = allSales.reduce((sum, sale) => sum + (sale.commission || 0), 0)
    const actualSalesCount = allSales.length

    console.log(`📊 Actual totals: ${actualSalesCount} sales, $${(actualTotalCommissionCents / 100).toFixed(2)}`)

    // Calculate the difference (supplemental amount)
    const supplementalCommissionCents = actualTotalCommissionCents - originalInvoice.commission_total
    const supplementalSalesCount = actualSalesCount - originalInvoice.sales_count

    if (supplementalCommissionCents <= 0) {
      return new Response(
        JSON.stringify({ 
          success: false,
          message: 'No supplemental invoice needed - original invoice is complete',
          actualSalesCount,
          originalSalesCount: originalInvoice.sales_count
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`💵 Supplemental amount: ${supplementalSalesCount} sales, $${(supplementalCommissionCents / 100).toFixed(2)}`)

    // Get the customer's payment method
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
      console.log(`✅ Found payment method: ${defaultPaymentMethod}`)
    }

    // Create DRAFT invoice
    console.log('Creating draft supplemental invoice...')
    const invoiceParams: any = {
      customer: store.stripe_customer_id,
      auto_advance: false,
      collection_method: 'charge_automatically',
      metadata: {
        store_id: store.id,
        shop_domain: store.shop_domain,
        week: week,
        invoice_type: 'supplemental',
        original_invoice_id: originalInvoice.id,
        original_stripe_invoice_id: originalInvoice.stripe_invoice_id,
        supplemental_sales_count: supplementalSalesCount.toString(),
      },
      description: `Supplemental commission for ${week} - Additional ${supplementalSalesCount} sales`,
    }
    
    if (defaultPaymentMethod) {
      invoiceParams.default_payment_method = defaultPaymentMethod
    }
    
    const invoice = await stripe.invoices.create(invoiceParams)
    console.log(`✅ Draft invoice created: ${invoice.id}`)

    // Add invoice item
    console.log('Adding invoice item...')
    const invoiceItem = await stripe.invoiceItems.create({
      customer: store.stripe_customer_id,
      invoice: invoice.id,
      amount: supplementalCommissionCents,
      currency: 'usd',
      description: `Supplemental commission for ${week} (${supplementalSalesCount} additional sales not in original invoice)`,
    })
    console.log(`✅ Invoice item added: ${invoiceItem.id}`)

    // Retrieve and verify
    const updatedInvoice = await stripe.invoices.retrieve(invoice.id)
    console.log(`Amount due: $${(updatedInvoice.amount_due / 100).toFixed(2)}`)

    if (updatedInvoice.amount_due === 0) {
      throw new Error('Invoice amount is $0.00')
    }

    // Finalize
    console.log('Finalizing invoice...')
    const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id)
    console.log(`✅ Invoice finalized: ${finalizedInvoice.id}`)

    // Pay immediately if payment method available
    if (defaultPaymentMethod) {
      console.log('Paying invoice...')
      const paidInvoice = await stripe.invoices.pay(finalizedInvoice.id, {
        payment_method: defaultPaymentMethod,
      })
      console.log(`✅ Invoice paid: ${paidInvoice.status}`)
      console.log(`URL: ${paidInvoice.hosted_invoice_url}`)
      
      finalizedInvoice.status = paidInvoice.status
      finalizedInvoice.paid = paidInvoice.paid
    } else {
      console.log('⚠️ No payment method, invoice left as open')
      console.log(`URL: ${finalizedInvoice.hosted_invoice_url}`)
    }

    // Save supplemental invoice to database
    const { error: insertError } = await supabase
      .from('invoices')
      .insert({
        store_id: store.id,
        week: week,
        week_start_date: originalInvoice.week_start_date,
        week_end_date: originalInvoice.week_end_date,
        sales_count: supplementalSalesCount, // Only the supplemental sales
        commission_total: supplementalCommissionCents,
        subscription_fee: 0,
        total_amount: supplementalCommissionCents,
        stripe_invoice_id: finalizedInvoice.id,
        status: finalizedInvoice.status,
        paid_at: finalizedInvoice.paid ? new Date().toISOString() : null,
        invoice_type: 'supplemental', // Mark as supplemental invoice
      })

    if (insertError) throw insertError

    console.log(`✅ Supplemental invoice saved`)

    return new Response(
      JSON.stringify({ 
        success: true,
        result: {
          store_domain: store.shop_domain,
          week: week,
          original_invoice: {
            sales_count: originalInvoice.sales_count,
            commission: originalInvoice.commission_total,
          },
          supplemental_invoice: {
            sales_count: supplementalSalesCount,
            commission: supplementalCommissionCents,
            stripe_invoice_id: finalizedInvoice.id,
            status: finalizedInvoice.status,
            hosted_invoice_url: finalizedInvoice.hosted_invoice_url,
          },
          actual_totals: {
            sales_count: actualSalesCount,
            commission: actualTotalCommissionCents,
          }
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Supplemental invoice generation error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

