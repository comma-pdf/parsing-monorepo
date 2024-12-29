import app from "@/parsing/jobs"
import { Job } from "@/parsing/schemas"
import {
  EntParsingFile,
  EntParsingJob,
  EntToken,
  EntUser,
  JobStatus,
} from "@repo/database/entities"
import {
  createExecutionContext,
  env,
  waitOnExecutionContext,
} from "cloudflare:test"
import { beforeAll, describe, expect, test } from "vitest"

describe("Jobs", () => {
  test("GET /:jobId", async () => {
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
      `/${job.id}`,
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
      id: job.id,
      status: job.status,
    })
    expect(result.status).toBe(200)
  })

  test("GET /:jobId/result/markdown", async () => {
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
    job.status = JobStatus.Completed
    job.markdownResultFileId = (
      await EntParsingFile.create({
        db: env.DB,
        oss: env.FILE_BUCKET,
        userId: user.id,
        file: new File(["# Hello, world!"], "abc.md", {
          type: "text/markdown",
        }),
      })
    ).id
    await job.save({ db: env.DB })

    const ctx = createExecutionContext()
    const result = await app.request(
      `/${job.id}/result/markdown`,
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
      markdown: "# Hello, world!",
    })
  })
})
