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

// Public routes that don't require authentication
const publicPaths = [
  '/book/',
  '/read/',
  '/author/',
  '/category/',
  '/book-list/',
  '/audiobooks',
  '/me',
  '/login',
  '/register',
  '/forgot-password',
  '/terms',
  '/privacy',
  '/api/auth/',
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

function isPublicPath(pathname: string): boolean {
  // Root path is public
  if (pathname === '/') return true;

  return publicPaths.some((path) => pathname.startsWith(path));
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

  // Allow public paths without authentication
  if (isPublicPath(pathname)) {
    const response = NextResponse.next();
    if (!hasRegionCookie) {
      response.cookies.set(REGION_COOKIE, region, { path: '/', maxAge: 365 * 24 * 60 * 60, sameSite: 'lax' });
    }
    return response;
  }

  // For protected routes, check for a valid session
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });

  if (!token) {
    // Redirect to login with callback URL
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
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
