import { getAuth } from "@clerk/remix/ssr.server"
import {
  LoaderFunction,
  LoaderFunctionArgs,
  redirect,
} from "@remix-run/cloudflare"
import { Outlet } from "@remix-run/react"
import { Routes } from "~/utils/routes"

export const loader: LoaderFunction = async (args: LoaderFunctionArgs) => {
  // const { env, cf, ctx } = args.context.cloudflare

  const { userId } = await getAuth(args)
  if (!userId) {
    return redirect(Routes.SIGNIN)
  }
  return {}
}

export default function Index() {
  return (
    <>
      <Outlet />
    </>
  )
}
