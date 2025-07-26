// app/api/users/[did]/preferences/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "~/server/db";
import { users } from "~/server/db/schema";

const preferencesSchema = z.object({
  theme: z.string().optional(),
  language: z.string().optional(),
  emailNotifications: z.boolean().optional(),
  blogSettings: z
    .object({
      defaultVisibility: z.enum(["public", "unlisted", "private"]).optional(),
      defaultTheme: z.string().optional(),
    })
    .optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ did: string }> },
) {
  try {
    const { did: rawDid } = await params;
    const did = decodeURIComponent(rawDid);

    const [user] = await db
      .select({ preferences: users.preferences })
      .from(users)
      .where(eq(users.did, did))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user.preferences ?? {});
  } catch (error) {
    console.error("Get preferences error:", error);
    return NextResponse.json(
      { error: "Failed to fetch preferences" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ did: string }> },
) {
  try {
    const { did: rawDid } = await params;
    const did = decodeURIComponent(rawDid);
    const body = (await request.json()) as unknown;
    const newPreferences = preferencesSchema.parse(body);

    // Get current preferences
    const [currentUser] = await db
      .select({ preferences: users.preferences })
      .from(users)
      .where(eq(users.did, did))
      .limit(1);

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Merge preferences
    const updatedPreferences = {
      ...currentUser.preferences,
      ...newPreferences,
    };

    // Update user
    const [updatedUser] = await db
      .update(users)
      .set({
        preferences: updatedPreferences,
        updatedAt: new Date(),
      })
      .where(eq(users.did, did))
      .returning({ preferences: users.preferences });

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(updatedUser.preferences ?? {});
  } catch (error) {
    console.error("Update preferences error:", error);
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 },
    );
  }
}
