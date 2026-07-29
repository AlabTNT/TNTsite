import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { getRpID, signToken, verifyToken } from "@/lib/spy-auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { passcode } = body;

    const count = await prisma.spyCredential.count();
    
    // Auth check: if credentials exist, require active session. Otherwise, require Setup Passcode.
    if (count > 0) {
      const cookieHeader = req.headers.get("cookie") || "";
      const match = cookieHeader.match(/spy_admin_session=([^;]+)/);
      const session = match ? verifyToken(match[1]) : null;
      if (!session) {
        return NextResponse.json({ error: "Unauthorized. Admin session required to register more keys." }, { status: 401 });
      }
    } else {
      const expectedPasscode = process.env.SETUP_PASSCODE || "alabtnt";
      if (!passcode || passcode !== expectedPasscode) {
        return NextResponse.json({ error: "Invalid Setup Passcode" }, { status: 400 });
      }
    }

    const rpID = getRpID(req);
    const options = await generateRegistrationOptions({
      rpName: "AlabTNT Spy Space",
      rpID,
      userID: Buffer.from("admin-user-id"),
      userName: "admin@alabtnt.cn",
      userDisplayName: "AlabTNT Admin",
      attestationType: "none",
      authenticatorSelection: {
        residentKey: "required",
        userVerification: "preferred",
      },
    });

    const challengeToken = signToken({ challenge: options.challenge, expiresAt: Date.now() + 5 * 60 * 1000 });
    
    const response = NextResponse.json(options);
    response.headers.append("Set-Cookie", `spy_challenge=${challengeToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=300`);
    return response;
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || "Failed to generate registration options" }, { status: 500 });
  }
}
