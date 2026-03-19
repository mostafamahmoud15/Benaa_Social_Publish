import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

/**
 * Convert the JWT secret into Uint8Array because
 * the `jose` library expects the secret in this format
 * when verifying tokens.
 *
 * The `!` tells TypeScript that we are sure the env variable exists.
 * In production environments it is recommended to validate this value
 * during server startup.
 */
const secretKey = new TextEncoder().encode(process.env.JWT_SECRET!);

/**
 * Small helper function to avoid repeating redirect logic.
 * It clones the current request URL and replaces the pathname
 * with the desired destination.
 */
function redirectTo(req: NextRequest, pathname: string) {
  const url = req.nextUrl.clone();
  url.pathname = pathname;
  return NextResponse.redirect(url);
}

/**
 * Verifies the JWT token and extracts the user role from it.
 *
 * If the token is valid → returns the role.
 * If the token is invalid / expired → throws an error.
 *
 * The cast to `string | undefined` is required because
 * JWT payloads are generic and the role field may not exist.
 */
async function getRoleFromToken(token: string): Promise<string | undefined> {
  const { payload } = await jwtVerify(token, secretKey);
  return payload.role as string | undefined;
}

/**
 * Main middleware responsible for:
 * - Protecting dashboard routes
 * - Preventing unauthorized access
 * - Handling role-based access control
 */
export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;

  /**
   * Route grouping to keep conditions readable
   * and easy to maintain or extend later.
   */
  const isAuthPage = path.startsWith("/login");
  const isDashboard = path.startsWith("/dashboard");

  // Dashboard sub-areas
  const isUsersArea = path.startsWith("/dashboard/users");
  const isPostsArea = path.startsWith("/dashboard/posts");
  const isConnectArea = path.startsWith("/dashboard/connect");

  /**
   * Retrieve the authentication token from cookies.
   * If it does not exist, the user is considered unauthenticated.
   */
  const token = req.cookies.get("token")?.value;

  /**
   * 1) Global dashboard protection
   *
   * Any attempt to access `/dashboard` or its subroutes
   * without a valid token will redirect the user to `/login`.
   */
  if (isDashboard && !token) {
    return redirectTo(req, "/login");
  }

  /**
   * 2) Prevent authenticated users from accessing the login page.
   *
   * If a logged-in user tries to visit `/login`,
   * they will be redirected to `/dashboard`.
   */
  if (isAuthPage && token) {
    return redirectTo(req, "/dashboard");
  }

  /**
   * 3) Role-based access control for sensitive dashboard areas.
   *
   * Currently implemented rule:
   * - Users with role "user" cannot access `/dashboard/users`
   *
   * This logic can easily be extended later to support
   * additional roles or protected sections.
   */
  if ((isUsersArea || isPostsArea || isConnectArea) && token) {
    try {
      const role = await getRoleFromToken(token);

      /**
       * Example permission rule:
       * Normal users should not access the users management area.
       */
      if (isUsersArea && role === "user") {
        return redirectTo(req, "/dashboard");
      }

      /**
       * Example future extension:
       *
       * if ((isPostsArea || isConnectArea) && role === "user") {
       *   return redirectTo(req, "/dashboard");
       * }
       */
    } catch (error) {
      /**
       * If token verification fails, it usually means:
       * - Token is expired
       * - Token has been tampered with
       * - Secret key mismatch
       *
       * In this case we redirect the user back to login
       * and remove the invalid token from cookies
       * to prevent redirect loops or inconsistent behavior.
       */
      const response = redirectTo(req, "/login");
      response.cookies.delete("token");
      return response;
    }
  }

  /**
   * If none of the conditions above matched,
   * the request is allowed to continue normally.
   */
  return NextResponse.next();
}

/**
 * The matcher defines which routes this middleware applies to.
 *
 * In this case:
 * - All dashboard routes
 * - The login page
 */
export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};