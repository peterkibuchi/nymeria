import { NextResponse, type NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "~/server/db";
import { users, userSessions } from "~/server/db/schema";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ did: string }> },
) {
  try {
    const { did: rawDid } = await params;
    const did = decodeURIComponent(rawDid);

    // Get user first
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.did, did))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get user sessions
    const sessions = await db
      .select()
      .from(userSessions)
      .where(
        and(eq(userSessions.userId, user.id), eq(userSessions.isActive, true)),
      )
      .orderBy(userSessions.lastActiveAt);

    return NextResponse.json(sessions);
  } catch (error) {
    console.error("Get user sessions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user sessions" },
      { status: 500 },
    );
  }
}
