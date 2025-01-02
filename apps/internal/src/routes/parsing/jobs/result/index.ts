import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import {
  EntParsingFile,
  EntParsingJob,
  JobStatus,
} from "@repo/database/entities"

import { JobResultRequest, jobResultRequestSchema } from "./schemas"

const app = new OpenAPIHono<{ Bindings: Env }>()

const jobResultRoute = createRoute({
  method: "post",
  path: "/:jobId/result",
  security: [
    {
      Bearer: [],
    },
  ],
  request: {
    params: z.object({
      jobId: z.coerce.number(),
    }),
    body: {
      content: {
        "application/json": {
          schema: jobResultRequestSchema,
        },
      },
      description: "The file to upload",
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            jobId: z.number(),
          }),
        },
      },
      description: "The result has been uploaded",
    },
    400: {
      content: {
        "application/json": {
          schema: z.object({
            code: z.number(),
            message: z.string(),
          }),
        },
      },
      description: "Bad Request",
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
    500: {
      content: {
        "application/json": {
          schema: z.object({
            code: z.number(),
            message: z.string(),
          }),
        },
      },
      description: "Internal Server Error",
    },
  },
})

app.openapi(jobResultRoute, async (c) => {
  try {
    const body = await c.req.json()
    const jobResult: JobResultRequest = jobResultRequestSchema.parse(body)
    const result = jobResult.markdown
    // TODO: Save the jobMetadata to the database
    const jobMetadata = jobResult.jobMetadata

    const jobId = parseInt(c.req.param("jobId"))
    const job = await EntParsingJob.getOrFail({ db: c.env.DB, id: jobId })

    const file = await EntParsingFile.getOrFail({
      db: c.env.DB,
      id: job.fileId,
    })

    const resultFileName = `result-${file.name}.md`
    const resultFile = await EntParsingFile.create({
      db: c.env.DB,
      oss: c.env.FILE_BUCKET,
      userId: job.ownerId,
      file: new File([result], resultFileName, { type: "text/markdown" }),
    })

    job.markdownResultFileId = resultFile.id
    job.status = JobStatus.Completed
    await job.save({ db: c.env.DB })

    return c.json({ jobId: job.id }, 200)
  } catch (e) {
    if (e instanceof z.ZodError) {
      return c.json({ code: 400, message: e.message }, 400)
    }

    if (e instanceof Error) {
      return c.json({ code: 500, message: e.message }, 500)
    }

    return c.json({ code: 404, message: "Job not found" }, 404)
  }
})

export default app
