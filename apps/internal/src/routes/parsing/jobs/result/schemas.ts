import { z } from "@hono/zod-openapi"

const jobResultRequestSchema = z.object({
  result: z.string().openapi({
    type: "string",
    description: "The result of the parsing job",
  }),
})

type JobResultRequest = z.infer<typeof jobResultRequestSchema>

export { jobResultRequestSchema }
export type { JobResultRequest }
