import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the request is for the manager area
  // Handle admin routes (except login)
  if (pathname.startsWith("/admin")) {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (session?.user.role === "admin") {
      return NextResponse.next();
    }

    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Handle API admin routes
  if (pathname.startsWith("/api/admin")) {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (session?.user.role === "admin") {
      return NextResponse.next();
    }

    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  runtime: "nodejs",
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
