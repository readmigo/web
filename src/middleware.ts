import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Public routes that don't require authentication
const publicPaths = [
  '/explore',
  '/book/',
  '/author/',
  '/category/',
  '/book-list/',
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

  // Allow public paths without authentication
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // For protected routes, check for a valid session
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });

  if (!token) {
    // Redirect to login with callback URL
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except static files
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|otf|eot|mp3|wav|ogg|m4a|epub|json)).*)',
  ],
};
