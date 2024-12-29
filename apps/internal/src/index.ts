import { OpenAPIHono } from "@hono/zod-openapi"
import { apiReference } from "@scalar/hono-api-reference"
import { bearerAuth } from "hono/bearer-auth"

import jobsRoute from "./routes/parsing/jobs"

interface EnvWithSecret extends Env {
  API_KEY: string
}
const app = new OpenAPIHono<{ Bindings: EnvWithSecret }>()

// Middleware to verify the bearer token
app.use(
  "/internal/*",
  bearerAuth({
    verifyToken(token, c) {
      return token === c.env.API_KEY
    },
  })
)

app.get("/", (c) => {
  return c.text("Hello Hono!")
})

app.get("/internal", (c) => {
  return c.text("Hello Hono API!")
})

app.route("/internal/v1/parsing/jobs", jobsRoute)

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
