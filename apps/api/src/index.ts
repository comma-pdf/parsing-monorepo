import jobs from "@/parsing/jobs"
import upload from "@/parsing/upload"
import { OpenAPIHono } from "@hono/zod-openapi"
import { EntToken } from "@repo/database/entities"
import { apiReference } from "@scalar/hono-api-reference"
import { bearerAuth } from "hono/bearer-auth"

const app = new OpenAPIHono<{ Bindings: Env }>()

// Middleware to verify the bearer token
app.use(
  "/api/*",
  bearerAuth({
    verifyToken: async (token, c) => {
      try {
        // Get the auth token from DB
        const entToken = await EntToken.getByToken({ db: c.env.DB, token })
        return !entToken.isRevoked
      } catch (e) {
        return false
      }
    },
  })
)

app.get("/", (c) => {
  return c.text("Hello Hono!")
})

app.get("/api", (c) => {
  return c.text("Hello Hono API!")
})

app.route("/api/v1/parsing/upload", upload)
app.route("/api/v1/parsing/jobs", jobs)

/**
 * Register the Bearer Auth security scheme in OpenAPI.
 * The 'Bearer' will be used to secure the routes in
 * ```
 *   security: [{Bearer: []}, ...],
 * ```
 */
app.openAPIRegistry.registerComponent("securitySchemes", "Bearer", {
  type: "http",
  scheme: "bearer",
})

// The OpenAPI documentation will be available at /openapi.json
app.doc("/openapi.json", {
  openapi: "3.0.0",
  info: {
    version: "1.0.0",
    title: "My API",
  },
})

// Render a beautiful API reference based on an OpenAPI/Swagger document with Hono
app.get(
  "/reference",
  apiReference({
    spec: {
      url: "/openapi.json",
    },
  })
)

export default app
