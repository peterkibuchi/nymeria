import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "~/server/db";
import { userSessions } from "~/server/db/schema";

const activitySchema = z.object({
  sessionId: z
    .string()
    .min(1)
    .max(128)
    .regex(/^sess_[a-zA-Z0-9_-]+$/, "Invalid session ID format"),
  lastActiveAt: z.string().datetime("Invalid datetime format"),
});

export async function POST(request: NextRequest) {
  const clientIP =
    request.headers.get("x-forwarded-for") ??
    request.headers.get("x-real-ip") ??
    "unknown";

  try {
    // Content-Type validation for CSRF protection
    const contentType = request.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      return NextResponse.json(
        { error: "Invalid content type" },
        { status: 400 },
      );
    }

    const body = (await request.json()) as unknown;
    const data = activitySchema.parse(body);

    // Update session activity
    const [updatedSession] = await db
      .update(userSessions)
      .set({
        lastActiveAt: new Date(data.lastActiveAt),
        updatedAt: new Date(),
      })
      .where(eq(userSessions.sessionId, data.sessionId))
      .returning({ id: userSessions.id });

    if (!updatedSession) {
      // Session might not exist yet if sync is still in progress
      // Return success to avoid breaking the auth flow
      console.warn(`Session ${data.sessionId} not found for activity update`);
      return NextResponse.json({ success: true, warning: "Session not found" });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    // Secure error logging without exposing sensitive data
    if (error instanceof z.ZodError) {
      console.error("Activity validation error:", {
        issues: error.issues.map((issue) => ({
          path: issue.path,
          message: issue.message,
          code: issue.code,
        })),
        clientIP,
      });
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 },
      );
    }

    console.error("Activity update error:", {
      message: error instanceof Error ? error.message : "Unknown error",
      clientIP,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      { error: "Failed to update session activity" },
      { status: 500 },
    );
  }
}
