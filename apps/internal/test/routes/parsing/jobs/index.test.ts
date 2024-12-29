import app from "@/routes/parsing/jobs"
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
import { beforeAll, describe, expect, test, vi } from "vitest"

describe("Jobs", () => {
  test("GET /:jobId/file", async () => {
    const mockGetSignedUrl = vi
      .spyOn(EntParsingFile.prototype, "getSignedUrl")
      .mockReturnValue(Promise.resolve("test-signed-url"))

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
    const file = await EntParsingFile.create({
      db: env.DB,
      oss: env.FILE_BUCKET,
      userId: user.id,
      file: new File(["abc"], "abc.pdf", { type: "application/pdf" }),
    })
    const job = await EntParsingJob.create({
      db: env.DB,
      fileId: file.id,
    })

    const ctx = createExecutionContext()
    const result = await app.request(
      `/${job.id}/file`,
      {
        method: "GET",
        headers: {
          Authorization: "Bearer dynamic-token",
        },
      },
      env,
      ctx
    )
    // Wait for all `Promise`s passed to `ctx.waitUntil()` to settle before running test assertions
    await waitOnExecutionContext(ctx)

    const body = await result.json()

    expect(body).toMatchObject({
      signedUrl: "test-signed-url",
    })
    expect(result.status).toBe(200)
  })
})
