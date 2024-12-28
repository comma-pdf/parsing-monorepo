import { EntToken } from "@repo/database/entities"
import { createMiddleware } from "hono/factory"
import { HTTPException } from "hono/http-exception"

const TOKEN_STRINGS = "[A-Za-z0-9._~+/-]+=*"
const PREFIX = "Bearer"
const HEADER = "Authorization"

export const setUserId = createMiddleware<{
  Bindings: Env
  Variables: { userId: number }
}>(async (c, next) => {
  const regexp = new RegExp(`^${PREFIX} (${TOKEN_STRINGS}) *$`)

  const headerToken = c.req.header(HEADER)
  if (!headerToken) {
    const res = new Response("Unauthorized", { status: 401 })
    throw new HTTPException(401, { res })
  }

  const match = regexp.exec(headerToken)
  if (!match) {
    const res = new Response("Unauthorized", { status: 401 })
    throw new HTTPException(401, { res })
  }

  const token = match[1]
  const entToken = await EntToken.getByToken({ db: c.env.DB, token })

  c.set("userId", entToken.userId)
  return await next()
})
