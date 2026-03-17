import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const WEBHOOK_INTERNAL_SECRET = process.env.WEBHOOK_INTERNAL_SECRET;
const API_BASE_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

/**
 * Verifies a Stripe webhook signature without the Stripe SDK.
 *
 * Stripe signs webhooks using HMAC-SHA256 over the raw request body.
 * The Stripe-Signature header format is:
 *   t=<unix_timestamp>,v1=<hex_signature>[,v1=<another_signature>]
 *
 * @see https://stripe.com/docs/webhooks/signatures
 */
function verifyStripeSignature(rawBody: string, signatureHeader: string, secret: string): boolean {
  const parts = signatureHeader.split(',');
  let timestamp = '';
  const signatures: string[] = [];

  for (const part of parts) {
    const [key, value] = part.split('=');
    if (key === 't') {
      timestamp = value;
    } else if (key === 'v1') {
      signatures.push(value);
    }
  }

  if (!timestamp || signatures.length === 0) {
    return false;
  }

  // Reject webhooks older than 5 minutes to prevent replay attacks
  const webhookAge = Math.floor(Date.now() / 1000) - parseInt(timestamp, 10);
  if (webhookAge > 300) {
    return false;
  }

  const signedPayload = `${timestamp}.${rawBody}`;
  const expectedSignature = createHmac('sha256', secret)
    .update(signedPayload, 'utf8')
    .digest('hex');

  // Compare against all v1 signatures using timing-safe equality
  const expectedBuffer = Buffer.from(expectedSignature, 'hex');
  return signatures.some((sig) => {
    try {
      const sigBuffer = Buffer.from(sig, 'hex');
      if (sigBuffer.length !== expectedBuffer.length) return false;
      return timingSafeEqual(sigBuffer, expectedBuffer);
    } catch {
      return false;
    }
  });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!STRIPE_WEBHOOK_SECRET) {
    console.error('[stripe-webhook] STRIPE_WEBHOOK_SECRET is not configured');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  const signatureHeader = req.headers.get('stripe-signature');
  if (!signatureHeader) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  const rawBody = await req.text();

  const isValid = verifyStripeSignature(rawBody, signatureHeader, STRIPE_WEBHOOK_SECRET);
  if (!isValid) {
    console.warn('[stripe-webhook] Invalid signature — possible spoofed request');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  let event: { type: string; data: unknown };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Only forward events we care about
  const HANDLED_EVENTS = new Set([
    'checkout.session.completed',
    'customer.subscription.updated',
    'customer.subscription.deleted',
    'invoice.payment_failed',
  ]);

  if (!HANDLED_EVENTS.has(event.type)) {
    return NextResponse.json({ received: true });
  }

  // Forward to backend with an internal secret so the backend can trust this proxy
  const forwardHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (WEBHOOK_INTERNAL_SECRET) {
    forwardHeaders['x-webhook-secret'] = WEBHOOK_INTERNAL_SECRET;
  }

  try {
    const backendRes = await fetch(`${API_BASE_URL}/subscriptions/webhook`, {
      method: 'POST',
      headers: forwardHeaders,
      body: rawBody,
    });

    if (!backendRes.ok) {
      const errorText = await backendRes.text().catch(() => '');
      console.error('[stripe-webhook] Backend forwarding failed:', backendRes.status, errorText);
      // Return 200 to Stripe so it does not retry — the backend error is logged separately
      return NextResponse.json({ received: true, forwarded: false });
    }
  } catch (err) {
    console.error('[stripe-webhook] Failed to forward event to backend:', err);
    return NextResponse.json({ received: true, forwarded: false });
  }

  return NextResponse.json({ received: true, forwarded: true });
}
