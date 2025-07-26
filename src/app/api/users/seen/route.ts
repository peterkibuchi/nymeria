import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";

import { db } from "~/server/db";
import { users } from "~/server/db/schema";

export async function GET() {
  try {
    // Get recently seen users (last 50)
    const seenUsers = await db
      .select()
      .from(users)
      .where(eq(users.isActive, true))
      .orderBy(desc(users.lastSeenAt))
      .limit(50);

    return NextResponse.json(seenUsers);
  } catch (error) {
    console.error("Get seen users error:", error);
    return NextResponse.json(
      { error: "Failed to fetch seen users" },
      { status: 500 },
    );
  }
}
