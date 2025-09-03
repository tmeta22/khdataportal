// The Supabase middleware is causing Node.js API compatibility issues in Edge Runtime
// Authentication will be handled client-side only for now

// import { updateSession } from "@/lib/supabase/middleware"
// import type { NextRequest } from "next/server"

// export async function middleware(request: NextRequest) {
//   return await updateSession(request)
// }

// export const config = {
//   matcher: [
//     "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
//   ],
// }

// Middleware disabled - using client-side authentication only
export const config = {
  matcher: [],
}
