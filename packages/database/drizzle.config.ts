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
    console.log(`Error  ${err.message}`)
  }
}

export default defineConfig({
  out: "./drizzle",
  schema: "./src/schema.ts",
  dialect: "sqlite",
  ...(process.env.NODE_ENV === "production"
    ? {
        driver: "d1-http",
        dbCredentials: {
          accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
          databaseId: process.env.CLOUDFLARE_DATABASE_ID!,
          token: process.env.CLOUDFLARE_D1_TOKEN!,
        },
      }
    : {
        // driver: "sqlite",
        dbCredentials: {
          // url: "../../apps/api/.wrangler/state/v3/d1/miniflare-D1DatabaseObject/<sqlite_filename>.sqlite",
          url: getLocalD1DB(),
        },
      }),
})
