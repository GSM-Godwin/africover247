import { NextRequest, NextResponse } from "next/server";

const PROTECTED = [
  "/dashboard",
  "/products",
  "/apply",
  "/policies",
  "/claims",
  "/notifications",
  "/account",
];

export function middleware(request: NextRequest) {
  const token = request.cookies.get("africover_token")?.value;
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED.some((path) => pathname.startsWith(path));
  if (isProtected && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const isAuth = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
  ].some((path) => pathname.startsWith(path));
  if (isAuth && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/products/:path*",
    "/apply/:path*",
    "/policies/:path*",
    "/claims/:path*",
    "/notifications/:path*",
    "/account/:path*",
    "/login",
    "/register/:path*",
    "/forgot-password/:path*",
    "/reset-password",
  ],
};
