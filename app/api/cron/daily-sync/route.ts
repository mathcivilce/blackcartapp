import { NextRequest, NextResponse } from 'next/server';

/**
 * Cron job endpoint for daily order synchronization
 * 
 * This should be called by an external cron service (e.g., Vercel Cron, GitHub Actions, or cron-job.org)
 * Recommended schedule: Daily at 2 AM UTC
 * 
 * Setup Examples:
 * 
 * 1. Vercel Cron (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/daily-sync",
 *     "schedule": "0 2 * * *"
 *   }]
 * }
 * 
 * 2. GitHub Actions (.github/workflows/daily-sync.yml):
 * on:
 *   schedule:
 *     - cron: '0 2 * * *'
 * 
 * 3. External service (cron-job.org):
 * URL: https://your-domain.com/api/cron/daily-sync?key=YOUR_SECRET_KEY
 * Schedule: Daily at 2:00 AM
 */
export async function GET(request: NextRequest) {
  try {
    // SECURITY: Verify cron secret key
    const authHeader = request.headers.get('authorization');
    const urlKey = request.nextUrl.searchParams.get('key');
    const expectedKey = process.env.CRON_SECRET_KEY;

    // Check authorization
    if (expectedKey) {
      const providedKey = authHeader?.replace('Bearer ', '') || urlKey;
      
      if (providedKey !== expectedKey) {
        console.error('❌ Unauthorized cron attempt');
        return NextResponse.json({ 
          success: false, 
          error: 'Unauthorized' 
        }, { status: 401 });
      }
    } else {
      console.warn('⚠️  CRON_SECRET_KEY not set! Cron endpoint is unprotected!');
    }

    console.log('🕐 Daily order sync cron job started');
    const startTime = Date.now();

    // Call the sync-orders endpoint internally
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const syncResponse = await fetch(`${baseUrl}/api/shopify/sync-orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        days_back: 2 // Overlap to ensure no orders are missed
      })
    });

    if (!syncResponse.ok) {
      const errorData = await syncResponse.json();
      console.error('❌ Sync failed:', errorData);
      return NextResponse.json({
        success: false,
        error: 'Order sync failed',
        details: errorData
      }, { status: 500 });
    }

    const syncResults = await syncResponse.json();
    const duration = Date.now() - startTime;

    console.log(`✅ Daily sync completed in ${duration}ms`);
    console.log(`📊 Results:`, JSON.stringify(syncResults.results, null, 2));

    return NextResponse.json({
      success: true,
      message: 'Daily order sync completed successfully',
      duration_ms: duration,
      timestamp: new Date().toISOString(),
      results: syncResults.results
    });

  } catch (error) {
    console.error('❌ Cron job error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Cron job failed'
    }, { status: 500 });
  }
}

/**
 * POST endpoint (alternative for some cron services)
 */
export async function POST(request: NextRequest) {
  return GET(request);
}

