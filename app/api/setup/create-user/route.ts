import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// ONE-TIME SETUP ROUTE - Create admin user
// Visit: /api/setup/create-user?secret=setup123
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const secret = searchParams.get('secret');

  // Simple secret protection for setup route
  if (secret !== 'setup123') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Create user in Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'mathcivilce@gmail.com',
      password: 'Df45gh67!',
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        role: 'admin',
        name: 'Math Civilce'
      }
    });

    if (error) {
      // Check if user already exists
      if (error.message.includes('already registered')) {
        return NextResponse.json({ 
          message: 'User already exists',
          email: 'mathcivilce@gmail.com'
        });
      }

      return NextResponse.json({ 
        error: error.message 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'User created successfully',
      user: {
        id: data.user?.id,
        email: data.user?.email,
      }
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message || 'Failed to create user' 
    }, { status: 500 });
  }
}

