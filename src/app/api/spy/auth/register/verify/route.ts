import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { getRpID, getOrigin, verifyToken, signToken } from "@/lib/spy-auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { registrationResponse } = body;

    const cookieHeader = req.headers.get("cookie") || "";
    const matchChallenge = cookieHeader.match(/spy_challenge=([^;]+)/);
    const challengeData = matchChallenge ? verifyToken(matchChallenge[1]) : null;

    if (!challengeData || !challengeData.challenge) {
      return NextResponse.json({ error: "Registration challenge not found or expired" }, { status: 400 });
    }

    const rpID = getRpID(req);
    const origin = getOrigin(req);

    const verification = await verifyRegistrationResponse({
      response: registrationResponse,
      expectedChallenge: challengeData.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: false,
    });

    const { verified, registrationInfo } = verification;

    if (!verified || !registrationInfo) {
      return NextResponse.json({ error: "Registration verification failed" }, { status: 400 });
    }

    const { credential } = registrationInfo;
    const { id: credentialID, publicKey: credentialPublicKey, counter } = credential;

    await prisma.spyCredential.create({
      data: {
        id: credentialID,
        publicKey: Buffer.from(credentialPublicKey).toString("base64"),
        counter: counter,
        deviceType: registrationInfo.credentialDeviceType,
        backedUp: registrationInfo.credentialBackedUp,
        transports: registrationResponse.response.transports?.join(",") || null,
      },
    });

    const sessionToken = signToken({ authenticated: true, expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000 });

    const response = NextResponse.json({ success: true });
    response.headers.append("Set-Cookie", `spy_admin_session=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`);
    response.headers.append("Set-Cookie", "spy_challenge=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0");
    return response;
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || "Failed to verify registration response" }, { status: 500 });
  }
}
