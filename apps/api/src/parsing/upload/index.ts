import { createRoute, OpenAPIHono } from "@hono/zod-openapi"
import { HTTPException } from "hono/http-exception"

import { Job, JobSchema } from "../schemas"
import { CreateFileRequestSchema } from "./schemas"

const app = new OpenAPIHono<{ Bindings: Env }>()

const uploadRoute = createRoute({
  method: "post",
  path: "/",
  security: [
    {
      Bearer: [],
    },
  ],
  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: CreateFileRequestSchema,
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
  },
})

// Endpoint to upload files
app.openapi(uploadRoute, async (c) => {
  console.log(`c.req.valid("form")`, c.req.valid("form"))
  const { file } = c.req.valid("form")
  if (!file) {
    console.log(`No file uploaded`)
    throw new HTTPException(400, { message: "No file uploaded" })
  }

  const job: Job = {
    id: "123",
    status: "pending",
  }

  // TODO: Save the file to the storage service
  return c.json(job, 201)
})

export default app
