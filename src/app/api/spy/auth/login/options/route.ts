import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { getRpID, signToken } from "@/lib/spy-auth";

export async function POST(req: Request) {
  try {
    const credentials = await prisma.spyCredential.findMany();

    if (credentials.length === 0) {
      return NextResponse.json({ error: "No passkeys registered. Please register first." }, { status: 400 });
    }

    const rpID = getRpID(req);
    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: credentials.map((c: any) => ({
        id: c.id,
        type: "public-key" as const,
        transports: c.transports ? (c.transports.split(",") as any[]) : undefined,
      })),
      userVerification: "preferred",
    });

    const challengeToken = signToken({ challenge: options.challenge, expiresAt: Date.now() + 5 * 60 * 1000 });

    const response = NextResponse.json(options);
    response.headers.append("Set-Cookie", `spy_challenge=${challengeToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=300`);
    return response;
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || "Failed to generate login options" }, { status: 500 });
  }
}
