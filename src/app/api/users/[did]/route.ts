// app/api/users/[did]/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "~/server/db";
import { users } from "~/server/db/schema";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ did: string }> },
) {
  try {
    const { did: rawDid } = await params;
    const did = decodeURIComponent(rawDid);

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.did, did))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 },
    );
  }
}
