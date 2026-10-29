// Intentionally empty by default.
// Add Drizzle tables here when the site actually needs a database.
// See examples/d1/db/schema.ts for an opt-in example.
import {
  integer,
  sqliteTable,
  text,
  primaryKey,
} from "drizzle-orm/sqlite-core";
export const rooms = sqliteTable("rooms", {
  code: text("code").primaryKey(),
  revision: integer("revision").notNull().default(0),
  state: text("state").notNull(),
  updatedAt: integer("updated_at").notNull(),
});
export const wikiArticles = sqliteTable("wiki_articles", {
  title: text("title").primaryKey(),
  article: text("article").notNull(),
  fetchedAt: integer("fetched_at").notNull(),
});
export const roomPresence = sqliteTable(
  "room_presence",
  {
    roomCode: text("room_code").notNull(),
    playerId: text("player_id").notNull(),
    lastSeen: integer("last_seen").notNull(),
  },
  (table) => [primaryKey({ columns: [table.roomCode, table.playerId] })],
);
