// custom-env.d.ts

declare global {
  interface Env {
    CLERK_PUBLISHABLE_KEY: string
    CLERK_SECRET_KEY: string
  }
}

export {}
