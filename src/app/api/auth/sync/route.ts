import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { db } from "~/server/db";
import { users, userSessions } from "~/server/db/schema";

const syncSchema = z.object({
  did: z.string(),
  handle: z.string(),
  displayName: z.string().optional(),
  avatar: z.string().optional(),
  description: z.string().optional(),
  pds: z.string().optional(),
  sessionId: z.string(),
  deviceId: z.string(),
  metadata: z
    .object({
      deviceInfo: z
        .object({
          userAgent: z.string().optional(),
          platform: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as unknown;
    const data = syncSchema.parse(body);

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
    console.error("Sync error:", error);
    return NextResponse.json(
      { error: "Failed to sync user data" },
      { status: 500 },
    );
  }
}
