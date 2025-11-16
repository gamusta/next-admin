import {NextRequest, NextResponse} from "next/server";

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};

function extractSubdomains(request: NextRequest): string | null {
  const hostname = request.headers.get("host") || "";
  const domain = hostname.split(":")[0];
  const parts = domain.split(".");

  if (parts.length < 2) {
    return null;
  }
  if (parts.length === 2) {
    return null;
  }

  return parts[0];
}

export default async function proxy(req: NextRequest) {
  const subdomain = extractSubdomains(req);
  const { pathname } = req.nextUrl;

  if (subdomain === "app") {
    const url = req.nextUrl.clone();

    if (pathname.startsWith("/admin")) {
      url.pathname = pathname.replace(/^\/admin/, "");
    }
    url.pathname = "/admin" + url.pathname;

    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}
