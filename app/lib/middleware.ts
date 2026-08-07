import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "../lib/auth";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const pathname = request.nextUrl.pathname;

  // Login API ko allow karo
  if (pathname === "/api/auth/login") {
    return NextResponse.next();
  }

  // Login page
  if (pathname === "/") {
    if (token) {
      try {
        await verifyToken(token);

        return NextResponse.redirect(
          new URL("/dashboard", request.url)
        );
      } catch {
        // Invalid token -> login page allow
        return NextResponse.next();
      }
    }

    return NextResponse.next();
  }

  // Protected route/API
  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized. Please login first.",
        },
        { status: 401 }
      );
    }

    return NextResponse.redirect(new URL("/", request.url));
  }

  // JWT verify
  try {
    await verifyToken(token);

    return NextResponse.next();
  } catch (error) {
    console.log("Invalid token:", error);

    // Invalid token ko delete karo
    const response = pathname.startsWith("/api/")
      ? NextResponse.json(
          {
            success: false,
            message: "Session expired. Please login again.",
          },
          { status: 401 }
        )
      : NextResponse.redirect(new URL("/", request.url));

    response.cookies.set("token", "", {
      httpOnly: true,
      expires: new Date(0),
      path: "/",
    });

    return response;
  }
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/products/:path*",
    "/customers/:path*",
    "/orders/:path*",
    "/api/:path*",
  ],
};