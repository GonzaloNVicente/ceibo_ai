import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { getTenantSession } from '@/lib/supabase/tenant-client';

export const dynamic = 'force-dynamic';

interface HumanMsgWebhook {
  url: string;
  secret: string;
}

/**
 * Cada empresa tiene su propio workflow de n8n, por lo tanto su propio webhook de envio.
 * La config vive en empresa_integrations (solo legible con service_role, nunca desde el navegador).
 *
 * Compatibilidad: mientras el tenant original no tenga fila en la tabla, se usan las variables de
 * entorno CEIBO_HUMAN_MSG_WEBHOOK_* -- pero SOLO para ese tenant (CEIBO_LEGACY_EMPRESA_ID). Para
 * cualquier otra empresa sin configuracion se rechaza el envio: nunca se manda por el WhatsApp
 * de otro cliente.
 */
async function resolveWebhook(empresaId: string): Promise<HumanMsgWebhook | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (supabaseUrl && serviceKey) {
    const admin = createAdminClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await admin
      .from('empresa_integrations')
      .select('human_msg_webhook_url, human_msg_webhook_secret')
      .eq('empresa_id', empresaId)
      .maybeSingle();

    if (error) {
      console.error('Error leyendo empresa_integrations:', error.message);
    } else if (data?.human_msg_webhook_url && data?.human_msg_webhook_secret) {
      return { url: data.human_msg_webhook_url, secret: data.human_msg_webhook_secret };
    }
  }

  const legacyEmpresaId = process.env.CEIBO_LEGACY_EMPRESA_ID;
  const envUrl = process.env.CEIBO_HUMAN_MSG_WEBHOOK_URL;
  const envSecret = process.env.CEIBO_HUMAN_MSG_WEBHOOK_SECRET;
  if (legacyEmpresaId && legacyEmpresaId === empresaId && envUrl && envSecret) {
    return { url: envUrl, secret: envSecret };
  }

  return null;
}

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
    const empresaId = session.perfil.empresa_id;

    const body = await req.json();
    const { phone, text } = body;

    if (!phone || !text) {
      return NextResponse.json(
        { error: 'Missing phone or text parameter' },
        { status: 400 }
      );
    }

    // El telefono debe pertenecer a una conversacion de la empresa del usuario (RLS filtra por tenant).
    // Evita usar el numero de WhatsApp de la empresa para escribirle a cualquier numero arbitrario.
    if (typeof (supabase as any)._getCurrentUser !== 'function') {
      const { data: chat, error: chatError } = await (supabase as any)
        .from('chat_sessions')
        .select('id')
        .eq('customer_phone', String(phone))
        .maybeSingle();

      if (chatError || !chat) {
        return NextResponse.json(
          { error: 'El teléfono no pertenece a una conversación de tu empresa' },
          { status: 403 }
        );
      }
    }

    const webhook = await resolveWebhook(empresaId);

    if (!webhook) {
      console.error(`Sin webhook de WhatsApp configurado para la empresa ${empresaId}`);
      return NextResponse.json(
        { error: 'WhatsApp service is not configured' },
        { status: 503 }
      );
    }

    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-ceibo-secret': webhook.secret,
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
