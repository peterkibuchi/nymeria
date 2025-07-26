import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "~/server/db";
import { userSessions } from "~/server/db/schema";

const activitySchema = z.object({
  sessionId: z.string(),
  lastActiveAt: z.string().datetime(),
});

export async function POST(request: NextRequest) {
  try {
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
    console.error("Activity update error:", error);
    return NextResponse.json(
      { error: "Failed to update session activity" },
      { status: 500 },
    );
  }
}
