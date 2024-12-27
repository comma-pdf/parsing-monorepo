import { InferInsertModel, InferSelectModel } from "drizzle-orm"

import { files, jobs, users } from "./schema.js"

export type User = InferSelectModel<typeof users>
export type NewUser = InferInsertModel<typeof users>

export type Job = InferSelectModel<typeof jobs>
export type NewJob = InferInsertModel<typeof jobs>

export type File = InferSelectModel<typeof files>
export type NewFile = InferInsertModel<typeof files>
