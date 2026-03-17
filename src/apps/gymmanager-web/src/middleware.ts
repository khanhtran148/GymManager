import { NextRequest, NextResponse } from "next/server";
import { canAccessRoute } from "@/lib/route-access";

const PUBLIC_PATHS = ["/login", "/register", "/403"];

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  const isPublic = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );

  const isAuthenticated = request.cookies.get("is_authenticated")?.value === "1";

  if (!isAuthenticated && !isPublic) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthenticated && isPublic && pathname !== "/403") {
    const homeUrl = new URL("/", request.url);
    return NextResponse.redirect(homeUrl);
  }

  // Role-based route guard (UX-only; backend enforces security)
  if (isAuthenticated && !isPublic) {
    const userRole = request.cookies.get("user_role")?.value;
    if (userRole && !canAccessRoute(pathname, userRole)) {
      const forbiddenUrl = new URL("/403", request.url);
      return NextResponse.redirect(forbiddenUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
