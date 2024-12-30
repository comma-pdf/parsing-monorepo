import { Outlet } from "@remix-run/react"

export default function Index() {
  return (
    <div className="relative flex min-h-screen flex-col items-center overflow-hidden bg-gray-300 px-4 py-6 [:root:has(&)]:bg-gray-300">
      <div className="relative flex w-full max-w-[25rem] flex-1 flex-col justify-center gap-y-6">
        <main className="relative grid flex-1 content-center">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
