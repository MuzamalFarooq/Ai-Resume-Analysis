import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  const publicRoutes = ["/", "/login", "/register", "/forgot-password", "/reset-password"];
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith("/api/auth")
  );

  const isApiRoute = pathname.startsWith("/api");
  const isAdminRoute = pathname.startsWith("/admin");

  if (isPublicRoute) return NextResponse.next();

  if (!isLoggedIn) {
    if (isApiRoute) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isAdminRoute && req.auth?.user?.role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
