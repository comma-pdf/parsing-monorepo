import "dotenv/config"

import fs from "fs"
import path from "path"
import { defineConfig } from "drizzle-kit"

function getLocalD1DB() {
  try {
    const basePath = path.resolve("../../apps/api/.wrangler")
    const dbFile = fs
      .readdirSync(basePath, { encoding: "utf-8", recursive: true })
      .find((f) => f.endsWith(".sqlite"))

    if (!dbFile) {
      throw new Error(`.sqlite file not found in ${basePath}`)
    }

    const url = path.resolve(basePath, dbFile)
    return url
  } catch (err) {
    console.log(`Error ${err.message}`)
    throw err
  }
}

export default defineConfig({
  out: "./drizzle",
  schema: "./src/schema.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: getLocalD1DB(),
  },
})
