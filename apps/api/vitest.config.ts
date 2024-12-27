/// <reference types="vitest" />
import path from "path"
import {
  defineWorkersConfig,
  readD1Migrations,
} from "@cloudflare/vitest-pool-workers/config"

export default defineWorkersConfig(async () => {
  // Read all migrations in the `migrations` directory
  const migrationsPath = path.join(__dirname, "../../packages/database/drizzle")
  const migrations = await readD1Migrations(migrationsPath)

  return {
    test: {
      setupFiles: ["./test/apply-migrations.ts"],
      exclude: ["node_modules"],
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      poolOptions: {
        workers: {
          wrangler: { configPath: "./wrangler.toml" },
          miniflare: {
            // Add a test-only binding for migrations, so we can apply them in a
            // setup file
            bindings: { TEST_MIGRATIONS: migrations },
          },
        },
      },
    },
  }
})
