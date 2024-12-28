import { setUserId } from "@/middlewares/set-user-id.middleware"
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { EntParsingFile, EntParsingJob } from "@repo/database/entities"
import { HTTPException } from "hono/http-exception"

import { Job, JobSchema } from "../schemas"

const app = new OpenAPIHono<{ Bindings: Env }>()

const getJobRoute = createRoute({
  method: "get",
  path: "/:jobId",
  middleware: [setUserId] as const,
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
          schema: JobSchema,
        },
      },
      description: "The job",
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

const markdownResultRoute = createRoute({
  method: "get",
  path: "/:jobId/result/markdown",
  middleware: [setUserId] as const,
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
            markdown: z.string(),
          }),
        },
      },
      description: "The job result in markdown",
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
  },
})

app.openapi(
  getJobRoute,
  async (c) => {
    const jobId = c.req.param("jobId")

    const entJob = await EntParsingJob.get({
      db: c.env.DB,
      id: parseInt(jobId),
    })

    if (!entJob) {
      throw new HTTPException(404, {
        message: "Job not found",
      })
    }

    const job: Job = {
      id: entJob.id,
      status: entJob.status,
    }

    return c.json(job, 200)
  },
  (result, c) => {
    if (!result.success) {
      return c.json(
        {
          code: 404,
          message: result.error.message,
        },
        404
      )
    }
  }
)

app.openapi(
  markdownResultRoute,
  async (c) => {
    try {
      const jobId = c.req.param("jobId")

      const entJob = await EntParsingJob.get({
        db: c.env.DB,
        id: parseInt(jobId),
      })

      if (!entJob) {
        throw new HTTPException(404, {
          message: "Job not found",
        })
      }

      if (entJob.status !== "completed") {
        throw new HTTPException(400, {
          message: "Job is not completed",
        })
      }

      if (!entJob.markdownResultFileId) {
        throw new HTTPException(400, {
          message: "Job has no markdown result",
        })
      }

      const markdownFile = await EntParsingFile.get({
        db: c.env.DB,
        id: entJob.markdownResultFileId,
      })

      const markdownContent = await markdownFile.getFileContent(
        c.env.FILE_BUCKET
      )

      return c.json({ markdown: markdownContent }, 200)
    } catch (error) {
      if (error instanceof Error) {
        return c.json(
          {
            code: 400,
            message: error.message,
          },
          400
        )
      }

      return c.json(
        {
          code: 400,
          message: "Unknown error",
        },
        400
      )
    }
  },
  (result, c) => {
    if (!result.success) {
      return c.json(
        {
          code: 404,
          message: result.error.message,
        },
        404
      )
    }
  }
)

export default app
