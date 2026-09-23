import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTenantSession } from '@/lib/supabase/tenant-client';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const session = await getTenantSession(supabase);

    if (!session || !session.perfil?.empresa_id) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED: No active tenant session' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { phone, text } = body;

    if (!phone || !text) {
      return NextResponse.json(
        { error: 'Missing phone or text parameter' },
        { status: 400 }
      );
    }

    const webhookUrl = process.env.CEIBO_HUMAN_MSG_WEBHOOK_URL;
    const webhookSecret = process.env.CEIBO_HUMAN_MSG_WEBHOOK_SECRET;

    if (!webhookUrl || !webhookSecret) {
      console.error('Missing WhatsApp Webhook environment variables');
      return NextResponse.json(
        { error: 'WhatsApp service is not configured' },
        { status: 503 }
      );
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-ceibo-secret': webhookSecret,
      },
      body: JSON.stringify({ phone, text }),
    });

    if (!response.ok) {
      console.error(`WhatsApp Webhook failed with status ${response.status}`);
      return NextResponse.json(
        { error: 'Failed to send message via WhatsApp' },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error in /api/send-whatsapp:', err);
    return NextResponse.json(
      { error: err?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
