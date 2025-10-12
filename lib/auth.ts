import { supabase } from './supabase';
import { cookies } from 'next/headers';

export async function getSession() {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('sb-access-token')?.value;

    if (!accessToken) {
      return { user: null, session: null };
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return { user: null, session: null };
    }

    return { user, session: { access_token: accessToken } };
  } catch (error) {
    console.error('Get session error:', error);
    return { user: null, session: null };
  }
}

export async function requireAuth() {
  const { user } = await getSession();
  
  if (!user) {
    throw new Error('Unauthorized');
  }

  return user;
}

