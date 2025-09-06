import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_FILE = /\.(.*)$/;
const SUPPORTED_LANGS = [
  'en', 'th', 'jp', 'es', 'fr', 'de', 'pt', 'it', 'ru', 'ar', 'zh', 'zh-tw', 'ko'
];

function getLangFromCookie(req: NextRequest): string {
  const cookie = req.cookies.get('lang');
  if (cookie && SUPPORTED_LANGS.includes(cookie.value)) return cookie.value;
  return 'en';
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }
  const segments = pathname.split('/').filter(Boolean);
  const first = segments[0];
  if (!SUPPORTED_LANGS.includes(first)) {
    const lang = getLangFromCookie(req);
    const url = req.nextUrl.clone();
    url.pathname = `/${lang}${pathname.startsWith('/') ? '' : '/'}${pathname}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|api|favicon.ico|public).*)'],
};
