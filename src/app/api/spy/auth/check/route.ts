import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/spy-auth";

export async function GET(req: Request) {
  try {
    const cookieHeader = req.headers.get("cookie") || "";
    const match = cookieHeader.match(/spy_admin_session=([^;]+)/);
    const session = match ? verifyToken(match[1]) : null;
    const authenticated = !!session && session.authenticated;

    const count = await prisma.spyCredential.count();
    const hasRegisteredCredentials = count > 0;

    return NextResponse.json({ authenticated, hasRegisteredCredentials });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || "Failed to check authentication status" }, { status: 500 });
  }
}
