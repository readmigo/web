import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { rateLimit } from '@/lib/rate-limit';
import { validateProxyPath } from '@/lib/validation';

const API_BASE_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

// Rate limiter configurations (module-level, shared across requests)
const GENERAL_LIMIT = 100;
const GENERAL_WINDOW_MS = 60_000;
const AUTH_LIMIT = 10;
const AUTH_WINDOW_MS = 60_000;

/**
 * Server-side API proxy that forwards requests to the backend.
 * Reads the accessToken from the NextAuth JWT (httpOnly cookie)
 * and attaches it as a Bearer token — the client never sees the token.
 */
async function proxyRequest(req: NextRequest) {
  // Extract the path segments after /api/proxy/
  const url = new URL(req.url);
  const proxyPath = url.pathname.replace(/^\/api\/proxy/, '');

  // --- Path validation: block traversal attacks ---
  const safePath = validateProxyPath(proxyPath);
  if (safePath === null) {
    return NextResponse.json(
      { error: 'Invalid proxy path' },
      { status: 400 }
    );
  }

  // --- Rate limiting ---
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || '127.0.0.1';

  const isAuthRoute = safePath.includes('auth/login') || safePath.includes('auth/register');
  const rateLimitKey = isAuthRoute ? `auth:${ip}` : `general:${ip}`;
  const limit = isAuthRoute ? AUTH_LIMIT : GENERAL_LIMIT;
  const windowMs = isAuthRoute ? AUTH_WINDOW_MS : GENERAL_WINDOW_MS;

  const rateLimitResult = rateLimit(rateLimitKey, limit, windowMs);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateLimitResult.retryAfter),
          'X-RateLimit-Limit': String(rateLimitResult.limit),
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }
  const targetUrl = `${API_BASE_URL}${safePath}${url.search}`;

  // Read the JWT from the NextAuth session cookie (server-side only)
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  const accessToken = token?.accessToken as string | undefined;

  // Build headers — forward relevant ones, add auth
  const headers = new Headers();
  headers.set('Content-Type', req.headers.get('Content-Type') || 'application/json');

  // Forward Accept header if present
  const accept = req.headers.get('Accept');
  if (accept) {
    headers.set('Accept', accept);
  }

  // Forward Accept-Language if present
  const acceptLanguage = req.headers.get('Accept-Language');
  if (acceptLanguage) {
    headers.set('Accept-Language', acceptLanguage);
  }

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  try {
    // Stream the body for non-GET/HEAD requests
    const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
    const body = hasBody ? await req.text() : undefined;

    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: body || undefined,
    });

    // Read the response body
    const responseBody = await response.text();

    // Create the proxy response
    const proxyResponse = new NextResponse(responseBody, {
      status: response.status,
      statusText: response.statusText,
    });

    // Forward relevant response headers
    const contentType = response.headers.get('Content-Type');
    if (contentType) {
      proxyResponse.headers.set('Content-Type', contentType);
    }

    // Attach rate limit info headers
    proxyResponse.headers.set('X-RateLimit-Limit', String(rateLimitResult.limit));
    proxyResponse.headers.set('X-RateLimit-Remaining', String(rateLimitResult.remaining));

    return proxyResponse;
  } catch (error) {
    console.error('Proxy request failed:', error);
    return NextResponse.json(
      { error: 'Proxy request failed' },
      { status: 502 }
    );
  }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
