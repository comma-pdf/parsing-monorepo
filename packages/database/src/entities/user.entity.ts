import { D1Database } from "@cloudflare/workers-types"
import { eq } from "drizzle-orm"
import { drizzle } from "drizzle-orm/d1"

import { users } from "../schema.js"

class EntUser {
  id: number
  name: string
  email: string

  private constructor({
    id,
    name,
    email,
  }: {
    id: number
    name: string
    email: string
  }) {
    this.id = id
    this.name = name
    this.email = email
  }

  static async create({
    db,
    name,
    email,
  }: {
    db: D1Database
    name: string
    email: string
  }) {
    const result = await drizzle(db)
      .insert(users)
      .values({ name, email })
      .returning({ id: users.id })

    if (!result || !result[0]) {
      throw new Error("Failed to create user")
    }

    return new EntUser({
      id: result[0].id,
      name,
      email,
    })
  }

  static async getByEmail({ db, email }: { db: D1Database; email: string }) {
    const result = await drizzle(db)
      .select()
      .from(users)
      .where(eq(users.email, email))

    if (!result || !result[0]) {
      throw new Error("User not found")
    }

    return new EntUser({
      id: result[0].id,
      name: result[0].name,
      email: result[0].email,
    })
  }
}

export { EntUser }
