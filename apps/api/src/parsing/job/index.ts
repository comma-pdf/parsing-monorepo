import { createRoute, OpenAPIHono } from "@hono/zod-openapi"
import { HTTPException } from "hono/http-exception"

const app = new OpenAPIHono<{ Bindings: Env }>()
