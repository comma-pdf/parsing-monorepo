import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignOutButton,
  SignUpButton,
  UserButton,
} from "@clerk/remix"
import { getAuth } from "@clerk/remix/ssr.server"
import {
  LoaderFunctionArgs,
  redirect,
  type LoaderFunction,
  type MetaFunction,
} from "@remix-run/cloudflare"
import { Routes } from "~/utils/routes"

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ]
}

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
    <div>
      <h1>Index Route</h1>
      <SignedIn>
        <p>You are signed in!</p>
        <div>
          <p>View your profile here</p>
          <UserButton />
        </div>
        <div>
          <SignOutButton />
        </div>
      </SignedIn>
      <SignedOut>
        <p>You are signed out</p>
        <div>
          <SignInButton />
        </div>
        <div>
          <SignUpButton />
        </div>
      </SignedOut>
    </div>
  )
}
