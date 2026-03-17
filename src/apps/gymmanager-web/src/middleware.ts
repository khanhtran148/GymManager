import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/register"];

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  const isPublic = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );

  const token = request.cookies.get("access_token")?.value;
  const authStorage = request.cookies.get("auth-storage")?.value;

  let isAuthenticated = false;
  if (authStorage) {
    try {
      const parsed = JSON.parse(decodeURIComponent(authStorage)) as {
        state?: { isAuthenticated?: boolean };
      };
      isAuthenticated = parsed?.state?.isAuthenticated === true;
    } catch {
      isAuthenticated = false;
    }
  }

  if (!token && !isAuthenticated && !isPublic) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if ((token || isAuthenticated) && isPublic) {
    const homeUrl = new URL("/", request.url);
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
