import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth/session';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Routes publiques
  if (pathname.startsWith('/sign-in') || pathname.startsWith('/signup')) {
    return NextResponse.next();
  }

  // Protéger /admin/*
  if (pathname.startsWith('/admin')) {
    const sessionCookie = request.cookies.get('session');

    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }

    try {
      const session = await verifyToken(sessionCookie.value);

      if (!session || new Date(session.expires) < new Date()) {
        const response = NextResponse.redirect(new URL('/sign-in', request.url));
        response.cookies.delete('session');
        return response;
      }
    } catch {
      const response = NextResponse.redirect(new URL('/sign-in', request.url));
      response.cookies.delete('session');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
