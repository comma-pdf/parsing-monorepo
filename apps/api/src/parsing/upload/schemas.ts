import { z } from "@hono/zod-openapi"

const MAX_FILE_SIZE = 500000

const UploadFileRequestSchema = z
  .object({
    file: z
      .instanceof(File)
      .refine(
        (file) => file.name.length <= 255,
        `Max filename length is 255 characters.`
      )
      .refine((file) => file.size > 0, `File is empty.`)
      .refine((file) => file.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
      .refine(
        (file) => ["application/pdf"].includes(file.type),
        "Only PDF formats are supported."
      )
      .openapi({
        type: "string",
        format: "binary",
      }),
  })
  .required()

export { UploadFileRequestSchema }
