import { z } from "@hono/zod-openapi"

const jobMetadataSchema = z
  .object({
    succeededPages: z.number().openapi({
      type: "number",
      description: "The number of pages that were successfully parsed",
    }),
    totalPages: z.number().openapi({
      type: "number",
      description: "The total number of pages",
    }),
  })
  .openapi({
    type: "object",
    description: "The metadata of the job",
  })

const jobResultRequestSchema = z
  .object({
    markdown: z.string().openapi({
      type: "string",
      description: "The result of the parsing job",
    }),
    jobMetadata: jobMetadataSchema,
  })
  .required()

type JobResultRequest = z.infer<typeof jobResultRequestSchema>
type JobMetadata = z.infer<typeof jobMetadataSchema>

export { jobResultRequestSchema, jobMetadataSchema }
export type { JobResultRequest, JobMetadata }
