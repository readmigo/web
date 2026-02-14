import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const API_BASE_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

/**
 * Server-side API proxy that forwards requests to the backend.
 * Reads the accessToken from the NextAuth JWT (httpOnly cookie)
 * and attaches it as a Bearer token — the client never sees the token.
 */
async function proxyRequest(req: NextRequest) {
  // Extract the path segments after /api/proxy/
  const url = new URL(req.url);
  const proxyPath = url.pathname.replace(/^\/api\/proxy/, '');
  const targetUrl = `${API_BASE_URL}${proxyPath}${url.search}`;

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
