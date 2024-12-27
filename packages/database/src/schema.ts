import { relations } from "drizzle-orm"
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

export const users = sqliteTable(
  "users",
  {
    id: integer("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
  },
  (t) => []
)

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
