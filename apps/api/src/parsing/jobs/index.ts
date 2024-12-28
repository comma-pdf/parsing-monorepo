import { setUserId } from "@/middlewares/set-user-id.middleware"
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { EntParsingJob } from "@repo/database/entities"
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

export default app
