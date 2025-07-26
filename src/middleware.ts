// middleware.ts
import { NextResponse, type NextRequest } from "next/server";
import { and, eq, gt } from "drizzle-orm";

import { db } from "~/server/db";
import { userSessions } from "~/server/db/schema";

export async function middleware(request: NextRequest) {
  // Only apply to protected routes
  if (!request.nextUrl.pathname.startsWith("/api/protected")) {
    return NextResponse.next();
  }

  try {
    // Get session ID from header or cookie
    const sessionId =
      request.headers.get("x-session-id") ??
      request.cookies.get("session-id")?.value;

    if (!sessionId) {
      return NextResponse.json({ error: "Session required" }, { status: 401 });
    }

    // Verify session exists and is active
    const [session] = await db
      .select()
      .from(userSessions)
      .where(
        and(
          eq(userSessions.sessionId, sessionId),
          eq(userSessions.isActive, true),
          gt(userSessions.expiresAt, new Date()),
        ),
      )
      .limit(1);

    if (!session) {
      return NextResponse.json(
        { error: "Invalid or expired session" },
        { status: 401 },
      );
    }

    // Add user info to request headers
    const response = NextResponse.next();
    response.headers.set("x-user-id", session.userId.toString());
    response.headers.set("x-session-id", sessionId);

    return response;
  } catch (error) {
    console.error("Middleware error:", error);
    return NextResponse.json(
      { error: "Authentication error" },
      { status: 500 },
    );
  }
}

export const config = {
  matcher: ["/api/protected/:path*"],
};
