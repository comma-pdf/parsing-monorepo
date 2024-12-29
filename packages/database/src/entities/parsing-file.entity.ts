import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { D1Database, File, R2Bucket } from "@cloudflare/workers-types"
import { eq, gte, lt, ne } from "drizzle-orm"
import { drizzle } from "drizzle-orm/d1"

import { generateS3ObjectKey } from "../lib/utils.js"
import { files } from "../schema.js"

interface EntParsingFileParams {
  id: number
  name: string
  key: string
}

class EntParsingFile {
  readonly id: number
  readonly name: string
  readonly key: string

  static async create({
    db,
    oss,
    userId,
    file,
  }: {
    db: D1Database
    oss: R2Bucket
    userId: number
    file: File
  }) {
    // Generate a unique key for the file
    const key = generateS3ObjectKey(userId, file.name, "parsing")

    try {
      await oss.put(key, file)

      // Create a new file in the database
      const result = await drizzle(db)
        .insert(files)
        .values({
          name: file.name,
          key,
        })
        .returning({ id: files.id })
      if (!result || result.length !== 1) {
        throw new Error("Failed to create file")
      }

      return new EntParsingFile({ id: result.at(0)!.id, name: file.name, key })
    } catch (error) {
      // If there was an error, delete the file from the bucket
      await oss.delete(key)

      throw error
    }
  }

  static async get({ db, id }: { db: D1Database; id: number }) {
    const result = await drizzle(db)
      .select()
      .from(files)
      .where(eq(files.id, id))
      .execute()
    if (!result || result.length !== 1) {
      throw new Error("File not found")
    }

    const file = result.at(0)!
    return new EntParsingFile({ id: file.id, name: file.name, key: file.key })
  }

  static async getOrFail({ db, id }: { db: D1Database; id: number }) {
    try {
      return await EntParsingFile.get({ db, id })
    } catch (error) {
      throw new Error("File not found")
    }
  }

  private constructor({ id, name, key }: EntParsingFileParams) {
    this.id = id
    this.name = name
    this.key = key
  }

  async getFileContent(oss: R2Bucket) {
    const object = await oss.get(this.key)
    if (!object) {
      throw new Error("File not found")
    }
    const content = await object.text()
    return content
  }

  async getSignedUrl({
    bucketName,
    endpoint,
    accessKeyId,
    secretAccessKey,
  }: {
    bucketName: string
    endpoint: string
    accessKeyId: string
    secretAccessKey: string
  }) {
    const S3 = new S3Client({
      region: "auto",
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    })
    const signedUrl = await getSignedUrl(
      S3,
      new GetObjectCommand({ Bucket: bucketName, Key: this.key }),
      { expiresIn: 3600 }
    )

    return signedUrl
  }
}

export { EntParsingFile }
