import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "./auth";

export function requireAuth(request: NextRequest) {
  const token = request.cookies.get("token")?.value;

  if (!token) {
    return NextResponse.json(
      {
        success: false,
        message: "Unauthorized. Please login first.",
      },
      { status: 401 }
    );
  }

  try {
    const decoded = verifyToken(token);

    return {
      authenticated: true,
      user: decoded,
    };
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid or expired token. Please login again.",
      },
      { status: 401 }
    );
  }
}