// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import { sql } from "drizzle-orm";
import {
  index,
  pgTableCreator,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `nymeria_${name}`);

const createdAt = timestamp("created_at", { withTimezone: true })
  .default(sql`CURRENT_TIMESTAMP`)
  .notNull();
const updatedAt = timestamp("updated_at", { withTimezone: true }).$onUpdate(
  () => new Date(),
);

// Session metadata type (non-sensitive)
export interface SessionMetadata {
  deviceInfo?: {
    userAgent?: string;
    platform?: string;
    browser?: string;
  };
  location?: {
    country?: string;
    city?: string;
  };
}

// User preferences type
export interface UserPreferences {
  theme?: string;
  language?: string;
  emailNotifications?: boolean;
  blogSettings?: {
    defaultVisibility?: "public" | "unlisted" | "private";
    defaultTheme?: string;
  };
}

// Core users table - stores AT Protocol identity data
export const users = createTable(
  "users",
  (d) => ({
    id: d.uuid("id").primaryKey(),
    did: d.text("did").notNull().unique(), // AT Protocol DID
    handle: d.text("handle").notNull(), // Current handle (can change)
    displayName: d.text("display_name"),
    avatar: d.text("avatar"), // Avatar URL
    banner: d.text("banner"), // Banner URL
    pds: d.text("pds").notNull(), // Personal Data Server URL
    lastSeenAt: d.timestamp("last_seen_at").defaultNow().notNull(),
    preferences: d.jsonb("preferences").$type<UserPreferences>().default({}),
    isActive: d.boolean("is_active").default(true).notNull(),

    createdAt,
    updatedAt,
  }),
  (table) => [
    uniqueIndex("users_did_idx").on(table.did),
    index("users_handle_idx").on(table.handle),
    index("users_last_seen_idx").on(table.lastSeenAt),
  ],
);

// Session metadata (non-sensitive data only)
export const userSessions = createTable(
  "user_sessions",
  (d) => ({
    id: d.uuid("id").primaryKey(),
    userId: d
      .uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    sessionId: d.text("session_id").notNull().unique(), // Client-generated session ID
    deviceId: d.text("device_id"), // Persistent device identifier
    lastActiveAt: d.timestamp("last_active_at").defaultNow().notNull(),
    expiresAt: d.timestamp("expires_at"),
    metadata: d.jsonb("metadata").$type<SessionMetadata>().default({}),
    isActive: d.boolean("is_active").default(true).notNull(),

    createdAt,
    updatedAt,
  }),
  (table) => [
    index("user_sessions_user_id_idx").on(table.userId),
    uniqueIndex("user_sessions_session_id_idx").on(table.sessionId),
    index("user_sessions_active_idx").on(table.isActive, table.lastActiveAt),
  ],
);

// Blog metadata (migrated from DynamoDB)
export const blogMetadata = createTable(
  "blog_metadata",
  (d) => ({
    id: d.serial("id").primaryKey(),
    authorDid: d.text("author_did").notNull(),
    rkey: d.text("rkey").notNull(),
    entryTitle: d.text("entry_title"),
    entryDescription: d.text("entry_description"),
    cid: d.text("cid").notNull(),
    handle: d.text("handle"),
    trackedPost: d.text("tracked_post"),

    createdAt,
    updatedAt,
  }),
  (table) => [
    index("blog_metadata_author_did_idx").on(table.authorDid),
    index("blog_metadata_entry_title_idx").on(table.entryTitle),
    uniqueIndex("blog_metadata_author_rkey_idx").on(
      table.authorDid,
      table.rkey,
    ),
  ],
);

// Blog mentions (migrated from DynamoDB)
export const blogMentions = createTable(
  "blog_mentions",
  (d) => ({
    id: d.serial("id").primaryKey(),
    subjectAtUri: d.text("subject_at_uri").notNull(),
    postAtUri: d.text("post_at_uri").notNull(),
    rec: d.jsonb("rec"),

    createdAt,
    updatedAt,
  }),
  (table) => [
    index("blog_mentions_subject_idx").on(table.subjectAtUri),
    index("blog_mentions_time_idx").on(table.createdAt),
  ],
);

// User connections (for multi-account support)
export const userConnections = createTable(
  "user_connections",
  (d) => ({
    id: d.uuid("id").primaryKey(),
    primaryUserId: d
      .uuid("primary_user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    connectedUserId: d
      .uuid("connected_user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    connectionType: d.text("connection_type").notNull(), // 'linked', 'merged', etc.

    createdAt,
    updatedAt,
  }),
  (table) => [
    index("user_connections_primary_idx").on(table.primaryUserId),
    index("user_connections_connected_idx").on(table.connectedUserId),
  ],
);

// Export types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserSession = typeof userSessions.$inferSelect;
export type NewUserSession = typeof userSessions.$inferInsert;
export type BlogMetadata = typeof blogMetadata.$inferSelect;
export type BlogMention = typeof blogMentions.$inferSelect;
