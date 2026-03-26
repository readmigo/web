import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const REGION_COOKIE = 'readmigo-region';

function detectRegion(req: NextRequest): 'cn' | 'global' {
  const cookieRegion = req.cookies.get(REGION_COOKIE)?.value;
  if (cookieRegion === 'cn' || cookieRegion === 'global') return cookieRegion;

  const cfCountry = req.headers.get('cf-ipcountry');
  if (cfCountry === 'CN') return 'cn';

  const vercelCountry = req.headers.get('x-vercel-ip-country');
  if (vercelCountry === 'CN') return 'cn';

  return 'global';
}

// Only these routes truly require a logged-in user (blacklist strategy)
const protectedPaths = [
  '/settings',
  '/notifications',
  '/messaging',
];

// Static/system paths that should never be intercepted
const systemPaths = [
  '/_next/',
  '/favicon',
  '/manifest',
  '/sw.js',
  '/workbox-',
  '/icons/',
];

function isProtectedPath(pathname: string): boolean {
  return protectedPaths.some((path) => pathname.startsWith(path));
}

function isSystemPath(pathname: string): boolean {
  return systemPaths.some((path) => pathname.startsWith(path));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip system/static paths
  if (isSystemPath(pathname)) {
    return NextResponse.next();
  }

  // Skip API proxy routes (they handle auth themselves)
  if (pathname.startsWith('/api/proxy')) {
    return NextResponse.next();
  }

  // Skip PostHog proxy routes
  if (pathname.startsWith('/ingest')) {
    return NextResponse.next();
  }

  // Detect region and set cookie if not already set
  const region = detectRegion(req);
  const hasRegionCookie = req.cookies.has(REGION_COOKIE);

  // Only check auth for protected routes
  if (isProtectedPath(pathname)) {
    let token = null;
    try {
      token = await getToken({ req, secret: process.env.AUTH_SECRET });
    } catch {
      // Stale/corrupt cookie — treat as unauthenticated
      console.warn('[middleware] getToken failed (stale cookie?)', { pathname });
    }

    if (!token) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  const response = NextResponse.next();
  if (!hasRegionCookie) {
    response.cookies.set(REGION_COOKIE, region, { path: '/', maxAge: 365 * 24 * 60 * 60, sameSite: 'lax' });
  }
  return response;
}

export const config = {
  matcher: [
    // Match all paths except static files
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|otf|eot|mp3|wav|ogg|m4a|epub|json)).*)',
  ],
};
