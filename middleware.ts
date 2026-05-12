import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const { pathname } = request.nextUrl;

  // Define public routes
  const isPublicRoute = 
    pathname === '/login' || 
    pathname === '/signup' || 
    pathname === '/verify-otp' || 
    pathname === '/forgot-password' || 
    pathname === '/reset-password' ||
    pathname === '/';

  // Define auth API routes that should be public
  const isPublicApiRoute = pathname.startsWith('/api/auth');

  // If there's no token and it's not a public route, redirect to login
  if (!token && !isPublicRoute && !isPublicApiRoute && (pathname.startsWith('/dashboard') || pathname.startsWith('/api/'))) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If there's a token and it's a public auth route, redirect to dashboard
  if (token && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/:path*',
    '/login',
    '/signup',
    '/verify-otp',
    '/forgot-password',
    '/reset-password',
  ],
};
