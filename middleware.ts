import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const { pathname } = url;
  
  console.log('Middleware TypeScript exécuté pour le chemin:', pathname);
  
  // Si le chemin commence par /@
  if (pathname.startsWith('/@')) {
    // Extraire l'identifiant après @
    const recipientId = pathname.substring(2);
    
    // Rediriger vers la page d'envoi avec l'identifiant comme paramètre
    return NextResponse.redirect(new URL(`/send?to=${recipientId}`, request.url));
  }
  
  // Si l'URL contient "mystik.app@" ou "localhost@" (format incorrect sans slash)
  if (pathname.includes('mystik.app@') || pathname.includes('localhost@')) {
    const segments = pathname.split('@');
    if (segments.length > 1) {
      // Extraire l'identifiant après @
      const recipientId = segments[segments.length - 1];
      
      // Rediriger vers la page d'envoi avec l'identifiant comme paramètre
      return NextResponse.redirect(new URL(`/send?to=${recipientId}`, request.url));
    }
  }
  
  return NextResponse.next();
}

// Configurer sur quelles routes le middleware doit s'exécuter
export const config = {
  matcher: ['/:path*'],
}; 