import { Job } from "@/parsing/schemas"
import app from "@/parsing/upload"
import {
  EntParsingFile,
  EntParsingJob,
  EntToken,
  EntUser,
} from "@repo/database/entities"
import {
  createExecutionContext,
  env,
  waitOnExecutionContext,
} from "cloudflare:test"
import { beforeAll, describe, expect, test } from "vitest"

describe("Upload", () => {
  beforeAll(async () => {
    const user = await EntUser.create({
      db: env.DB,
      name: "test",
      email: "test@gmail.com",
    })
    await EntToken.create({
      db: env.DB,
      userId: user.id,
      token: "dynamic-token",
    })
  })

  test("POST /", async () => {
    const formData = new FormData()
    formData.append(
      "file",
      new File(["abc"], "abc.pdf", { type: "application/pdf" })
    )

    const ctx = createExecutionContext()
    /**
     * Don't set the Content-Type header manually.
     * The browser automatically sets the Content-Type header to multipart/form-data
     * and generates a unique boundary when you use FormData.
     */
    const res = await app.request(
      "/",
      {
        method: "POST",
        body: formData,
        headers: {
          Authorization: "Bearer dynamic-token",
        },
      },
      env,
      ctx
    )
    const body = await res.json<Job>()

    // Wait for all `Promise`s passed to `ctx.waitUntil()` to settle before running test assertions
    await waitOnExecutionContext(ctx)
    expect(res.status).toBe(201)

    const entParsingJob = await EntParsingJob.get({ db: env.DB, id: body.id })
    expect(entParsingJob.id).toBeGreaterThan(0)
    expect(entParsingJob.status).toBe("pending")

    const entParsingFile = await EntParsingFile.get({
      db: env.DB,
      id: entParsingJob.fileId,
    })
    expect(entParsingFile.id).toBeGreaterThan(0)
    expect(entParsingFile.name).toBe("abc.pdf")

    expect(body).toEqual({
      id: entParsingJob.id,
      status: entParsingJob.status,
    })

    expect(await entParsingFile.getFileContent(env.FILE_BUCKET)).toBe("abc")
  })
})
