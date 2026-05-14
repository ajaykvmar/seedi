// src/proxy.ts
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

const API_PATTERN = /^\/api\//;

export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  if (!API_PATTERN.test(pathname)) {
    return NextResponse.next();
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "127.0.0.1";

  const result = checkRateLimit(`api:${ip}`, 50, 3_600_000);

  if (!result.allowed) {
    return NextResponse.json(
      {
        error: "Rate limit exceeded. Try again later.",
        retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((result.resetAt - Date.now()) / 1000)),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  const response = NextResponse.next();
  response.headers.set("X-RateLimit-Remaining", String(result.remaining));
  return response;
}

export const config = {
  matcher: "/api/:path*",
};
