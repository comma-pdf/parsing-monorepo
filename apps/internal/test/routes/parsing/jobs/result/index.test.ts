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
import { describe, expect, test } from "vitest"

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

    const body = await result.json()

    expect(body).toMatchObject({
      resultFileId: expect.any(Number),
    })
    expect(result.status).toBe(200)
  })
})
