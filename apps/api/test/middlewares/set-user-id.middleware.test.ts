import app from "@/parsing/upload"
import { EntToken, EntUser } from "@repo/database/entities"
import {
  createExecutionContext,
  env,
  waitOnExecutionContext,
} from "cloudflare:test"
import { afterAll, beforeAll, describe, expect, test } from "vitest"

describe("Set user id in middleware", () => {
  beforeAll(async () => {
    const user = await EntUser.create({
      db: env.DB,
      name: "test",
      email: "test@gmail.com",
    })
  })

  test("Set user id in middleware", async () => {
    const user = await EntUser.getByEmail({
      db: env.DB,
      email: "test@gmail.com",
    })
    const token = await EntToken.create({
      db: env.DB,
      userId: user.id,
      token: "dynamic-token",
    })

    const formData = new FormData()
    formData.append(
      "file",
      new File(["abc"], "abc.pdf", { type: "application/pdf" })
    )

    const ctx = createExecutionContext()
    const res = await app.request(
      "/",
      {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${token.token}`,
        },
      },
      env,
      ctx
    )

    await waitOnExecutionContext(ctx)
    expect(res.status).toBe(201)
  })

  test("Can't find userId in middleware", async () => {
    const formData = new FormData()
    formData.append(
      "file",
      new File(["abc"], "abc.pdf", { type: "application/pdf" })
    )

    const ctx = createExecutionContext()
    const res = await app.request(
      "/",
      {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${"invalid-token"}`,
        },
      },
      env,
      ctx
    )

    await waitOnExecutionContext(ctx)
    expect(res.status).toBe(500)
  })
})
