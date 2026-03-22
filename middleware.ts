import { withAuth } from "next-auth/middleware"

export default withAuth({
  pages: {
    signIn: '/login', // Redirect to /login if unauthenticated
  },
})

export const config = {
  matcher: ['/dashboard/:path*']
}
