import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { authService } from '@/core/auth';
import { ApiError } from '@/core/errors';

// Routes that don't require authentication
const publicRoutes = [
  '/api/health',
  '/api/auth/login',
  '/api/auth/admin-login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/api/products',
  '/menu',
  '/',
];

// Routes that require admin role
const adminRoutes = ['/admin', '/api/admin'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if route is public
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Get tokens from cookies
  const accessToken = request.cookies.get('accessToken')?.value;

  // No access token - redirect to login or return 401
  if (!accessToken) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 },
      );
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Try to verify access token
  try {
    const payload = authService.verifyAccessTokenSync(accessToken);

    // Check admin routes
    if (adminRoutes.some((route) => pathname.startsWith(route))) {
      if (payload.role !== 'admin' && payload.role !== 'super_admin') {
        if (pathname.startsWith('/api/')) {
          return NextResponse.json(
            { error: 'FORBIDDEN', message: 'Admin access required' },
            { status: 403 },
          );
        }
        return NextResponse.redirect(new URL('/', request.url));
      }
    }

    return NextResponse.next();
  } catch (error) {
    // Token is invalid or expired
    if (error instanceof ApiError) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: error.code, message: error.message },
          { status: error.statusCode },
        );
      }
    }

    // Redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
