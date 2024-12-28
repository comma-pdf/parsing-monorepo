import app from "@/index"
import { EntToken, EntUser } from "@repo/database/entities"
import {
  createExecutionContext,
  env,
  waitOnExecutionContext,
} from "cloudflare:test"
import { afterAll, beforeAll, describe, expect, test } from "vitest"

describe("Bearer auth", () => {
  beforeAll(async () => {
    const user = await EntUser.create({
      db: env.DB,
      name: "test",
      email: "test@gmail.com",
    })
  })

  test("Use an active token", async () => {
    const user = await EntUser.getByEmail({
      db: env.DB,
      email: "test@gmail.com",
    })
    const token = await EntToken.create({
      db: env.DB,
      userId: user.id,
      token: "dynamic-token",
    })

    const ctx = createExecutionContext()
    const res = await app.request(
      "/api",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token.token}`,
        },
      },
      env,
      ctx
    )

    await waitOnExecutionContext(ctx)
    expect(res.status).toBe(200)
  })

  test("Use a revoked token", async () => {
    const user = await EntUser.getByEmail({
      db: env.DB,
      email: "test@gmail.com",
    })
    const token = await EntToken.create({
      db: env.DB,
      userId: user.id,
      token: "dynamic-token",
    })
    token.isRevoked = true
    await token.save(env.DB)

    const ctx = createExecutionContext()
    const res = await app.request(
      "/api",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token.token}`,
        },
      },
      env,
      ctx
    )

    await waitOnExecutionContext(ctx)
    expect(res.status).toBe(401)
  })
})
