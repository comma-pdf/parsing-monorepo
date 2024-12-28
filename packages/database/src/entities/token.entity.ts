import { D1Database } from "@cloudflare/workers-types"
import { eq } from "drizzle-orm"
import { drizzle } from "drizzle-orm/d1"

import { tokens } from "../schema.js"

class EntToken {
  id: number
  readonly userId: number
  readonly token: string
  isRevoked: boolean

  private constructor({
    id,
    userId,
    token,
    isRevoked,
  }: {
    id: number
    userId: number
    token: string
    isRevoked: boolean
  }) {
    this.id = id
    this.userId = userId
    this.token = token
    this.isRevoked = isRevoked
  }

  static async create({
    db,
    userId,
    token,
  }: {
    db: D1Database
    userId: number
    token: string
  }) {
    const result = await drizzle(db)
      .insert(tokens)
      .values({ userId, token })
      .returning({ id: tokens.id })

    if (!result || !result[0]) {
      throw new Error("Failed to create token")
    }

    return new EntToken({
      id: result[0].id,
      userId,
      token,
      isRevoked: false,
    })
  }

  static async getByToken({ db, token }: { db: D1Database; token: string }) {
    const result = await drizzle(db)
      .select()
      .from(tokens)
      .where(eq(tokens.token, token))

    if (!result || !result[0]) {
      throw new Error("Token not found")
    }

    return new EntToken({
      id: result[0].id,
      userId: result[0].userId,
      token: result[0].token,
      isRevoked: result[0].isRevoked,
    })
  }

  async save(db: D1Database) {
    await drizzle(db).update(tokens).set({ isRevoked: this.isRevoked })
  }
}

export { EntToken }
