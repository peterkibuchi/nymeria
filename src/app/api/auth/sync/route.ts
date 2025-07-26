import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { applyRateLimit, RATE_LIMITS } from "~/lib/security/rate-limit";
import { db } from "~/server/db";
import { users, userSessions } from "~/server/db/schema";

const syncSchema = z.object({
  did: z
    .string()
    .min(1)
    .max(500)
    .regex(/^did:(plc|web):[a-zA-Z0-9._-]+$/, "Invalid DID format"),
  handle: z
    .string()
    .min(1)
    .max(253)
    .regex(/^[a-zA-Z0-9.-]+$/, "Invalid handle format"),
  displayName: z.string().max(64).optional(),
  avatar: z.string().max(2048).url("Invalid avatar URL").optional(),
  description: z.string().max(300).optional(),
  pds: z.string().max(2048).url("Invalid PDS URL").optional(),
  sessionId: z
    .string()
    .min(1)
    .max(128)
    .regex(/^[a-zA-Z0-9_-]+$/, "Invalid session ID format"),
  deviceId: z
    .string()
    .min(1)
    .max(128)
    .regex(/^[a-zA-Z0-9_-]+$/, "Invalid device ID format"),
  metadata: z
    .object({
      deviceInfo: z
        .object({
          userAgent: z.string().max(512).optional(),
          platform: z.string().max(64).optional(),
        })
        .optional(),
    })
    .optional(),
});

export async function POST(request: NextRequest) {
  // Get client IP for rate limiting
  const clientIP =
    request.headers.get("x-forwarded-for") ??
    request.headers.get("x-real-ip") ??
    "unknown";

  // Apply rate limiting
  const rateLimitResult = applyRateLimit(clientIP, RATE_LIMITS.AUTH_SYNC);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      {
        error: "Rate limit exceeded",
        resetTime: rateLimitResult.resetTime,
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": RATE_LIMITS.AUTH_SYNC.limit.toString(),
          "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
          "X-RateLimit-Reset": rateLimitResult.resetTime.toString(),
        },
      },
    );
  }

  try {
    // Content-Type validation for CSRF protection
    const contentType = request.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      return NextResponse.json(
        { error: "Invalid content type" },
        { status: 400 },
      );
    }

    // Parse and validate request body
    const body = (await request.json()) as unknown;
    const data = syncSchema.parse(body);

    // Additional security: Validate session ID format matches our generation pattern
    if (!data.sessionId.startsWith("sess_")) {
      return NextResponse.json(
        { error: "Invalid session format" },
        { status: 400 },
      );
    }

    // Upsert user
    const [user] = await db
      .insert(users)
      .values({
        did: data.did,
        handle: data.handle,
        displayName: data.displayName,
        avatar: data.avatar,
        description: data.description,
        pds: data.pds ?? null,
        lastSeenAt: new Date(),
      })
      .onConflictDoUpdate({
        target: users.did,
        set: {
          handle: data.handle,
          displayName: data.displayName,
          avatar: data.avatar,
          description: data.description,
          pds: data.pds ?? null,
          lastSeenAt: new Date(),
          updatedAt: new Date(),
        },
      })
      .returning();

    if (!user) {
      throw new Error("Failed to create or update user");
    }

    // Create or update session
    await db
      .insert(userSessions)
      .values({
        userId: user.id,
        sessionId: data.sessionId,
        deviceId: data.deviceId,
        lastActiveAt: new Date(),
        metadata: data.metadata ?? {},
      })
      .onConflictDoUpdate({
        target: userSessions.sessionId,
        set: {
          lastActiveAt: new Date(),
          metadata: data.metadata ?? {},
        },
      });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    // Log error without exposing sensitive data
    if (error instanceof z.ZodError) {
      console.error("Sync validation error:", {
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

    console.error("Sync error:", {
      message: error instanceof Error ? error.message : "Unknown error",
      clientIP,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      { error: "Failed to sync user data" },
      { status: 500 },
    );
  }
}
