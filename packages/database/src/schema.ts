import { relations } from "drizzle-orm"
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core"

export const users = sqliteTable(
  "users",
  {
    id: integer("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
  },
  (t) => [uniqueIndex("email_index").on(t.email)]
)

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(tokens),
}))

export const tokens = sqliteTable(
  "tokens",
  {
    id: integer("id").primaryKey(),
    userId: integer("userId")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    token: text("token").notNull(),
    isRevoked: integer("is_revoked", { mode: "boolean" })
      .notNull()
      .default(false),
  },
  (t) => [uniqueIndex("token_index").on(t.token)]
)

export const tokensRelations = relations(tokens, ({ one }) => ({
  owner: one(users, {
    fields: [tokens.userId],
    references: [users.id],
  }),
}))

export const files = sqliteTable(
  "files",
  {
    id: integer("id").primaryKey(),
    name: text("name").notNull(),
    key: text("key").notNull(),
  },
  (t) => []
)

export const jobs = sqliteTable(
  "jobs",
  {
    id: integer("id").primaryKey(),
    status: text("status").notNull(),
    fileId: integer("fileId")
      .references(() => files.id)
      .notNull(),
    error: text("error"),
  },
  (t) => []
)

export const jobRelations = relations(jobs, ({ one }) => ({
  file: one(files, {
    fields: [jobs.fileId],
    references: [files.id],
  }),
}))
