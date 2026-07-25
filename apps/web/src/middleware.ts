import { NextRequest, NextResponse } from "next/server";

const PROTECTED_CUSTOMER = [
  "/dashboard",
  "/apply",
  "/applications",
  "/policies",
  "/claims",
  "/notifications",
  "/account",
  "/quotes",
];

const PROTECTED_ADMIN = ["/admin"];

const AUTH_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

export function middleware(request: NextRequest) {
  const token = request.cookies.get("africover_token")?.value;
  const role = request.cookies.get("africover_role")?.value;
  const { pathname } = request.nextUrl;

  const isProtected =
    PROTECTED_CUSTOMER.some((p) => pathname.startsWith(p)) ||
    PROTECTED_ADMIN.some((p) => pathname.startsWith(p));

  if (isProtected && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (
    PROTECTED_ADMIN.some((p) => pathname.startsWith(p)) &&
    token &&
    role !== "admin"
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const isAuth = AUTH_ROUTES.some((p) => pathname.startsWith(p));
  if (isAuth && token) {
    const redirect = request.nextUrl.searchParams.get("redirect");
    const action = request.nextUrl.searchParams.get("action");

    if (redirect) {
      const destination = action
        ? `${redirect}?action=${encodeURIComponent(action)}`
        : redirect;
      return NextResponse.redirect(new URL(destination, request.url));
    }

    return NextResponse.redirect(
      new URL(role === "admin" ? "/admin" : "/dashboard", request.url),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/products/:path*",
    "/apply/:path*",
    "/applications/:path*",
    "/policies/:path*",
    "/claims/:path*",
    "/notifications/:path*",
    "/account/:path*",
    "/quotes/:path*",
    "/admin/:path*",
    "/login",
    "/register/:path*",
    "/forgot-password/:path*",
    "/reset-password",
  ],
};
