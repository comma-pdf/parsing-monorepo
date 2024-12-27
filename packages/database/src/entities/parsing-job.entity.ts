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
  fileId: number
  error?: string
}

class EntParsingJob {
  id: number
  status: JobStatus
  fileId: number
  error?: string

  private constructor({
    id,
    fileId,
    status = JobStatus.Pending,
    error,
  }: EntParsingJobParams) {
    this.id = id
    this.fileId = fileId
    this.status = status
    this.error = error
  }

  static async create({ db, fileId }: { db: D1Database; fileId: number }) {
    console.log("Creating job with fileId:", fileId)

    // Create a new job in the database
    const result = await drizzle(db)
      .insert(jobs)
      .values({
        status: "pending",
        fileId: fileId,
        error: null,
      })
      .returning({ id: jobs.id })
    if (!result || result.length !== 1) {
      throw new Error("Failed to create job")
    }

    return new EntParsingJob({
      id: result.at(0)!.id,
      status: JobStatus.Pending,
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
      fileId: job.fileId,
      error: job.error || undefined,
    })
  }

  async save({ db }: { db: D1Database }) {
    // Save the job to the database
    await drizzle(db)
      .update(jobs)
      .set({
        status: this.status,
        fileId: this.fileId,
        error: this.error,
      })
      .where(eq(jobs.id, this.id))
      .execute()
  }
}

export { EntParsingJob, JobStatus }
