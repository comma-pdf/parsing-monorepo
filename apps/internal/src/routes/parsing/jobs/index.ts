import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { EntParsingFile, EntParsingJob } from "@repo/database/entities"

interface EnvWithSecret extends Env {
  API_KEY: string
  R2_ENDPOINT: string
  R2_ACCESS_KEY_ID: string
  R2_SECRET_ACCESS_KEY: string
}
const app = new OpenAPIHono<{ Bindings: EnvWithSecret }>()

const getFileRoute = createRoute({
  method: "get",
  path: "/:jobId/file",
  security: [
    {
      Bearer: [],
    },
  ],
  request: {
    params: z.object({
      jobId: z.coerce.number(),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            signedUrl: z.string(),
          }),
        },
      },
      description: "The signed URL to download the file",
    },
    404: {
      content: {
        "application/json": {
          schema: z.object({
            code: z.number(),
            message: z.string(),
          }),
        },
      },
      description: "Job not found",
    },
  },
})

app.openapi(getFileRoute, async (c) => {
  try {
    const jobId = parseInt(c.req.param("jobId"))
    const job = await EntParsingJob.getOrFail({ db: c.env.DB, id: jobId })
    const file = await EntParsingFile.getOrFail({
      db: c.env.DB,
      id: job.fileId,
    })
    const signedUrl = await file.getSignedUrl({
      bucketName: "file-bucket",
      endpoint: c.env.R2_ENDPOINT,
      accessKeyId: c.env.R2_ACCESS_KEY_ID,
      secretAccessKey: c.env.R2_SECRET_ACCESS_KEY,
    })
    return c.json({ signedUrl }, 200)
  } catch (e) {
    if (e instanceof Error) {
      return c.json({ code: 400, message: e.message }, 404)
    }
    return c.json({ code: 500, message: "Unknown error" }, 404)
  }
})

export default app
