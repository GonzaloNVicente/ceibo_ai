/**
 * Ceibo AI - Browser Supabase Client
 * 
 * Automatically initializes @supabase/ssr browser client if valid credentials exist,
 * or gracefully falls back to the in-memory mock client for zero-config offline mode.
 */

import { createBrowserClient } from '@supabase/ssr';
import { getBrowserMockClient } from './mock-client';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const isLiveConfigured =
    supabaseUrl &&
    supabaseKey &&
    !supabaseUrl.includes('placeholder') &&
    !supabaseUrl.includes('example.supabase.co');

  if (isLiveConfigured) {
    try {
      return createBrowserClient(supabaseUrl, supabaseKey);
    } catch (err) {
      console.warn('Failed to initialize live Supabase browser client, falling back to mock:', err);
    }
  }

  return getBrowserMockClient();
}
