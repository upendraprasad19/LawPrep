import { NextResponse, type NextRequest } from 'next/server';
export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === '/study') return NextResponse.redirect(new URL('/study/', request.url), 307);
  return NextResponse.next();
}
export const config = { matcher: ['/study/:path*'] };
