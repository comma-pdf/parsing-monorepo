import { OpenAPIHono } from "@hono/zod-openapi"
import { users } from "@repo/database/schema"
import { apiReference } from "@scalar/hono-api-reference"
import { drizzle } from "drizzle-orm/d1"
import { bearerAuth } from "hono/bearer-auth"

const app = new OpenAPIHono<{ Bindings: Env }>()

// Middleware to verify the bearer token
app.use(
  "/api/*",
  bearerAuth({
    verifyToken: async (token, c) => {
      // Get the auth token from DB

      // Get the token from the Authorization header

      // Compare two tokens

      return token === "dynamic-token"
    },
  })
)

app.get("/", (c) => {
  return c.text("Hello Hono!")
})

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
