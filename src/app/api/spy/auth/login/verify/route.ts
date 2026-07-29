import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { getRpID, getOrigin, verifyToken, signToken } from "@/lib/spy-auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { authenticationResponse } = body;

    const cookieHeader = req.headers.get("cookie") || "";
    const matchChallenge = cookieHeader.match(/spy_challenge=([^;]+)/);
    const challengeData = matchChallenge ? verifyToken(matchChallenge[1]) : null;

    if (!challengeData || !challengeData.challenge) {
      return NextResponse.json({ error: "Authentication challenge not found or expired" }, { status: 400 });
    }

    const credentialId = authenticationResponse.id;
    const dbCredential = await prisma.spyCredential.findUnique({
      where: { id: credentialId },
    });

    if (!dbCredential) {
      return NextResponse.json({ error: "Credential not found in database" }, { status: 400 });
    }

    const rpID = getRpID(req);
    const origin = getOrigin(req);

    const verification = await verifyAuthenticationResponse({
      response: authenticationResponse,
      expectedChallenge: challengeData.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: dbCredential.id,
        publicKey: Buffer.from(dbCredential.publicKey, "base64"),
        counter: dbCredential.counter,
        transports: dbCredential.transports ? (dbCredential.transports.split(",") as any[]) : undefined,
      },
      requireUserVerification: false,
    });

    const { verified, authenticationInfo } = verification;

    if (!verified || !authenticationInfo) {
      return NextResponse.json({ error: "Authentication verification failed" }, { status: 400 });
    }

    const { newCounter } = authenticationInfo;

    await prisma.spyCredential.update({
      where: { id: credentialId },
      data: { counter: newCounter },
    });

    const sessionToken = signToken({ authenticated: true, expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000 });

    const response = NextResponse.json({ success: true });
    response.headers.append("Set-Cookie", `spy_admin_session=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`);
    response.headers.append("Set-Cookie", "spy_challenge=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0");
    return response;
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || "Failed to verify authentication response" }, { status: 500 });
  }
}
