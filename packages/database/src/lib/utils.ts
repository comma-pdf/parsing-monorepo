import { v4 as uuidv4 } from "uuid"

function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0") // Add 1 to month as it's zero-indexed
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

function generateS3ObjectKey(
  userId: number,
  fileName: string,
  prefix: string
): string {
  // Extract the file extension and base name
  const fileParts = fileName.split(".")
  const extension = fileParts.pop() // Get the extension
  const baseName = fileParts.join(".") // Rejoin in case of multiple dots in name

  // Construct the object key
  const date = formatDate(new Date())
  const uuid = uuidv4()
  const objectKey = `${prefix}/${userId}/${date}/${uuid}/${baseName}${extension ? `.${extension}` : ""}`

  return objectKey
}

export { formatDate, generateS3ObjectKey }
