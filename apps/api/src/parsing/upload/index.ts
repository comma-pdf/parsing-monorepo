import { setUserId } from "@/middlewares/set-user-id.middleware"
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { EntParsingFile, EntParsingJob } from "@repo/database/entities"
import { HTTPException } from "hono/http-exception"

import { Job, JobSchema } from "../schemas"
import { UploadFileRequestSchema } from "./schemas"

const app = new OpenAPIHono<{ Bindings: Env }>()

const uploadRoute = createRoute({
  method: "post",
  path: "/",
  // https://github.com/oberbeck/honojs-middleware/blob/3ffb66707201f657f9aa37e726ea2ecc2f034acf/packages/zod-openapi/test/index.test-d.ts#L268-L304
  middleware: [setUserId] as const,
  security: [
    {
      Bearer: [],
    },
  ],
  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: UploadFileRequestSchema,
        },
      },
      description: "The file to upload",
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: JobSchema,
        },
      },
      description: "The file has been uploaded",
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
  },
})

// Endpoint to upload files
app.openapi(
  uploadRoute,
  async (c) => {
    if (!c.var.userId) {
      throw new HTTPException(401, {
        message: "Unauthorized",
        cause: "Missing userId",
      })
    }
    const userId = c.var.userId

    const body = await c.req.parseBody()
    const file = body["file"]
    if (typeof file === "string") {
      throw new HTTPException(400, { message: "File must not be a string" })
    }

    try {
      // 1. Create the file
      const entFile = await EntParsingFile.create({
        db: c.env.DB,
        oss: c.env.FILE_BUCKET,
        userId: userId,
        file,
      })

      // 2. Create a new job
      const endJob = await EntParsingJob.create({
        db: c.env.DB,
        fileId: entFile.id,
      })

      // 3. Enqueue the job
      const job: Job = {
        id: endJob.id,
        status: endJob.status,
      }
      await c.env.JOB_QUEUE.send(job)

      return c.json(job, 201)
    } catch (error) {
      console.error("Error uploading file:", error)
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
          code: 400,
          message: result.error.message,
        },
        400
      )
    }
    return undefined
  }
)

export default app
