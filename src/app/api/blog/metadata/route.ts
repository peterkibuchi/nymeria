import { NextResponse, type NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "~/server/db";
import { blogMetadata } from "~/server/db/schema";

const querySchema = z.object({
  authorDid: z.string(),
  entryTitle: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = querySchema.parse({
      authorDid: searchParams.get("authorDid"),
      entryTitle: searchParams.get("entryTitle") ?? undefined,
    });

    const conditions = [eq(blogMetadata.authorDid, query.authorDid)];

    if (query.entryTitle) {
      conditions.push(eq(blogMetadata.entryTitle, query.entryTitle));
    }

    const whereClause =
      conditions.length > 1 ? and(...conditions) : conditions[0];

    const metadata = await db
      .select()
      .from(blogMetadata)
      .where(whereClause)
      .orderBy(blogMetadata.createdAt);

    return NextResponse.json(metadata);
  } catch (error) {
    console.error("Get blog metadata error:", error);
    return NextResponse.json(
      { error: "Failed to fetch blog metadata" },
      { status: 500 },
    );
  }
}

const createSchema = z.object({
  authorDid: z.string(),
  rkey: z.string(),
  entryTitle: z.string().optional(),
  entryDescription: z.string().optional(),
  cid: z.string(),
  handle: z.string().optional(),
  trackedPost: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as unknown;
    const data = createSchema.parse(body);

    const [metadata] = await db
      .insert(blogMetadata)
      .values({
        authorDid: data.authorDid,
        rkey: data.rkey,
        entryTitle: data.entryTitle,
        entryDescription: data.entryDescription,
        cid: data.cid,
        handle: data.handle,
        trackedPost: data.trackedPost,
      })
      .returning();

    return NextResponse.json(metadata);
  } catch (error) {
    console.error("Create blog metadata error:", error);
    return NextResponse.json(
      { error: "Failed to create blog metadata" },
      { status: 500 },
    );
  }
}
