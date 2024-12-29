import app from "@/routes/parsing/jobs/result"
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
import { assert, describe, expect, test } from "vitest"

describe("Job result", () => {
  test("POST /:jobId/result", async () => {
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
      ownerId: user.id,
      fileId: file.id,
    })

    const ctx = createExecutionContext()
    const result = await app.request(
      `/${job.id}/result`,
      {
        method: "POST",
        headers: {
          Authorization: "Bearer dynamic-token",
        },
        body: JSON.stringify({
          markdown: "test",
        }),
      },
      env,
      ctx
    )
    // Wait for all `Promise`s passed to `ctx.waitUntil()` to settle before running test assertions
    await waitOnExecutionContext(ctx)

    const body = await result.json()

    expect(body).toMatchObject({
      jobId: job.id,
    })
    expect(result.status).toBe(200)

    const updatedJob = await EntParsingJob.getOrFail({
      db: env.DB,
      id: job.id,
    })
    expect(updatedJob.status).toBe("completed")
    expect(updatedJob.markdownResultFileId).toBeDefined()

    assert(updatedJob.markdownResultFileId)
    const markdownFile = await EntParsingFile.getOrFail({
      db: env.DB,
      id: updatedJob.markdownResultFileId,
    })
    const content = await markdownFile.getFileContent(env.FILE_BUCKET)
    expect(content).toBe("test")
  })
})
