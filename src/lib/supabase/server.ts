/**
 * Ceibo AI - Server Supabase Client
 * 
 * Supports Next.js App Router Server Components & Route Handlers with cookie-based
 * session persistence and fallback mock engine.
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createMockSupabaseEngine } from './mock-client';
import { MOCK_USERS } from './mock-data';

export function resolveServerUser(cookieValue?: string | null) {
  if (!cookieValue) return null;
  return MOCK_USERS.find((u) => u.id === cookieValue) || null;
}

export function createClient() {
  const cookieStore = cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const isLiveConfigured =
    supabaseUrl &&
    supabaseKey &&
    !supabaseUrl.includes('placeholder') &&
    !supabaseUrl.includes('example.supabase.co');

  if (isLiveConfigured) {
    return createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Can happen in Server Components
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch {
            // Can happen in Server Components
          }
        },
      },
    });
  }

  // Fallback: in-memory mock engine populated strictly from valid session cookie (fail-closed)
  const userIdCookie = cookieStore.get('ceibo_mock_user_id')?.value;
  const activeUser = resolveServerUser(userIdCookie);

  return createMockSupabaseEngine(activeUser);
}
