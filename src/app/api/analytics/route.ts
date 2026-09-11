import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTenantSession, createTenantScopedClient } from '@/lib/supabase/tenant-client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createClient();
    const session = await getTenantSession(supabase);

    if (!session || !session.perfil?.empresa_id) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED: No active tenant session' },
        { status: 401 }
      );
    }

    const tenantClient = createTenantScopedClient(supabase);
    const analytics = await tenantClient.getRecent30Days();
    const metrics = await tenantClient.getSummaryMetrics();

    return NextResponse.json({
      analytics,
      metrics,
      empresa: session.empresa,
      user: session.user,
    });
  } catch (err: any) {
    console.error('Error in /api/analytics:', err);
    return NextResponse.json(
      { error: err?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
