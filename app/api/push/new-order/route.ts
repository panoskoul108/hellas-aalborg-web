import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  return createClient(url, serviceKey);
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('x-webhook-secret');
    if (!process.env.PUSH_WEBHOOK_SECRET || authHeader !== process.env.PUSH_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const vapidPrivate = process.env.VAPID_PRIVATE_KEY;

    if (!vapidPublic || !vapidPrivate) {
      return NextResponse.json({ error: 'Missing VAPID keys' }, { status: 500 });
    }

    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || 'mailto:info@hellasaalborg.dk',
      vapidPublic,
      vapidPrivate
    );

    const supabaseAdmin = getSupabaseAdmin();

    const body = await req.json();
    const order = body.record;
    if (!order || order.status !== 'pending') {
      return NextResponse.json({ skipped: true });
    }

    const { data: subs, error: subsError } = await supabaseAdmin
      .from('admin_push_subscriptions')
      .select('*');

    if (subsError) throw subsError;
    if (!subs || subs.length === 0) {
      return NextResponse.json({ sent: 0 });
    }

    const orderNum = order.order_number || order.id?.toString().slice(-4);
    const payload = JSON.stringify({
      title: `🔔 ΝΕΑ ΠΑΡΑΓΓΕΛΙΑ #${orderNum}`,
      body: `${order.customer_name || 'Πελάτης'} • ${order.total_price} kr. (${order.requested_time || 'ASAP'})`,
      url: '/admin',
    });

    await Promise.all(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            payload
          );
        } catch (err: any) {
          if (err.statusCode === 410 || err.statusCode === 404) {
            await supabaseAdmin
              .from('admin_push_subscriptions')
              .delete()
              .eq('id', sub.id);
          }
        }
      })
    );

    return NextResponse.json({ sent: subs.length });
  } catch (error: any) {
    console.error('Push route error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
