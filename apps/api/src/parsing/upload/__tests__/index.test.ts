import { describe, expect, test } from "vitest"

import app from "../index"

describe("Upload", () => {
  test("POST /", async () => {
    const formData = new FormData()
    formData.append(
      "file",
      new File(["abc"], "abc.pdf", { type: "application/pdf" })
    )
    /**
     * Don't set the Content-Type header manually.
     * The browser automatically sets the Content-Type header to multipart/form-data
     * and generates a unique boundary when you use FormData.
     */
    const res = await app.request("/", {
      method: "POST",
      body: formData,
    })
    expect(res.status).toBe(201)
    expect(await res.json()).toEqual({ id: "123", status: "pending" })
  })
})
