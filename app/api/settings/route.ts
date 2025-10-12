import { NextRequest, NextResponse } from 'next/server';

// Simple settings endpoint
// TODO: Fetch from database in production
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const shop = searchParams.get('shop');

  if (!shop) {
    return NextResponse.json({ error: 'Shop parameter required' }, { status: 400 });
  }

  // For testing: return mock settings with protection enabled
  // In production: fetch from database based on shop domain
  
  const settings = {
    enabled: true,
    protectionProductId: 99999999, // Mock variant ID for testing
    price: 490, // $4.90 in cents
    toggleColor: '#2196F3',
    toggleText: 'Shipping Protection',
    description: 'Protect your order from damage, loss, or theft during shipping.',
  };

  return NextResponse.json(settings);
}

// Update settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shop, protectionProductId, price, toggleColor, toggleText, description } = body;

    if (!shop) {
      return NextResponse.json({ error: 'Shop parameter required' }, { status: 400 });
    }

    // TODO: Save to database in production
    // For now, just return success
    
    const updatedSettings = {
      enabled: true,
      protectionProductId,
      price,
      toggleColor,
      toggleText,
      description,
    };

    return NextResponse.json({ 
      success: true, 
      settings: updatedSettings 
    });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

