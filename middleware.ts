import { withAuth } from "next-auth/middleware"

export default withAuth(
    function middleware(req) {
        // Add any additional middleware logic here
    },
    {
        callbacks: {
            authorized: ({ token, req }) => {
                // For admin routes, check if user is admin
                if (req.nextUrl.pathname.startsWith('/admin')) {
                    return token?.email === 'hapuarachchikaviru@gmail.com'
                }

                // For other protected routes, just check if token exists
                return !!token
            },
        },
    }
)

export const config = {
    matcher: ['/dashboard/:path*', '/admin/:path*', '/tasks/:path*', '/ladder/:path*']
}
