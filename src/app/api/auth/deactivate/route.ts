import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "~/server/db";
import { userSessions } from "~/server/db/schema";

const deactivateSchema = z.object({
  sessionId: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as unknown;
    const data = deactivateSchema.parse(body);

    // Deactivate session
    const [deactivatedSession] = await db
      .update(userSessions)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(userSessions.sessionId, data.sessionId))
      .returning({ id: userSessions.id });

    if (!deactivatedSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Session deactivation error:", error);
    return NextResponse.json(
      { error: "Failed to deactivate session" },
      { status: 500 },
    );
  }
}
