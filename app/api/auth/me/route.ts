import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "../../../lib/authGuard";

export async function GET(request: NextRequest) {
   const auth = requireAuth(request); 
   if (auth instanceof NextResponse) 
    { return auth; }
    return NextResponse.json({ success: true, authenticated: true, user: auth.user, }); }