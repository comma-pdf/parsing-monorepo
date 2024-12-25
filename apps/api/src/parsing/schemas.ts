import { z } from "@hono/zod-openapi"

const JobSchema = z
  .object({
    id: z.string(),
    status: z.enum(["pending", "running", "error", "completed"]),
    errorMessage: z.string().optional(),
  })
  .openapi("Job")

type Job = z.infer<typeof JobSchema>

export { JobSchema }
export type { Job }
