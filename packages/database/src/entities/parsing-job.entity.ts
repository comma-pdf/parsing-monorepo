// Assuming D1Database is defined elsewhere, import it here
import { D1Database, R2Bucket } from "@cloudflare/workers-types"
import { eq } from "drizzle-orm"
import { drizzle } from "drizzle-orm/d1"

import { jobs } from "../schema.js"

enum JobStatus {
  Pending = "pending",
  Running = "running",
  Error = "error",
  Completed = "completed",
}

function stringToJobStatus(status: string): JobStatus | undefined {
  switch (status) {
    case "pending":
      return JobStatus.Pending
    case "running":
      return JobStatus.Running
    case "error":
      return JobStatus.Error
    case "completed":
      return JobStatus.Completed
    default:
      return undefined // Handle invalid input
  }
}

interface EntParsingJobParams {
  id: number
  status: JobStatus
  ownerId: number
  fileId: number
  error?: string
  markdownResultFileId?: number
}

class EntParsingJob {
  id: number
  status: JobStatus
  ownerId: number
  fileId: number
  error?: string
  markdownResultFileId?: number

  private constructor({
    id,
    ownerId,
    fileId,
    status = JobStatus.Pending,
    error,
    markdownResultFileId,
  }: EntParsingJobParams) {
    this.id = id
    this.ownerId = ownerId
    this.fileId = fileId
    this.status = status
    this.error = error
    this.markdownResultFileId = markdownResultFileId
  }

  static async create({
    db,
    ownerId,
    fileId,
  }: {
    db: D1Database
    ownerId: number
    fileId: number
  }) {
    // Create a new job in the database
    const result = await drizzle(db)
      .insert(jobs)
      .values({
        status: "pending",
        ownerId: ownerId,
        fileId: fileId,
      })
      .returning({ id: jobs.id })
    if (!result || result.length !== 1) {
      throw new Error("Failed to create job")
    }

    return new EntParsingJob({
      id: result.at(0)!.id,
      status: JobStatus.Pending,
      ownerId,
      fileId,
    })
  }

  static async get({ db, id }: { db: D1Database; id: number }) {
    // Get the job from the database
    const jobsFromDB = await drizzle(db)
      .select()
      .from(jobs)
      .where(eq(jobs.id, id))
      .execute()
    const job = jobsFromDB[0]
    if (!job) {
      throw new Error("Job not found")
    }

    const jobStatus = stringToJobStatus(job.status)
    if (!jobStatus) {
      throw new Error("Invalid job status")
    }

    return new EntParsingJob({
      id: job.id,
      status: jobStatus,
      ownerId: job.ownerId,
      fileId: job.fileId,
      error: job.error || undefined,
      markdownResultFileId: job.markdownResultFileId || undefined,
    })
  }

  static async getOrFail({ db, id }: { db: D1Database; id: number }) {
    // Get the job from the database
    const job = await this.get({ db, id })
    return job
  }

  async save({ db }: { db: D1Database }) {
    // Save the job to the database
    await drizzle(db)
      .update(jobs)
      .set({
        status: this.status,
        fileId: this.fileId,
        error: this.error,
        markdownResultFileId: this.markdownResultFileId,
      })
      .where(eq(jobs.id, this.id))
      .execute()
  }
}

export { EntParsingJob, JobStatus, stringToJobStatus }
