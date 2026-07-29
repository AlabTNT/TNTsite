import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    let sleep = await prisma.spySleep.findUnique({ where: { id: "main" } });
    if (!sleep) {
      sleep = await prisma.spySleep.create({ data: { id: "main", isSleeping: false, isRiding: false } });
    }
    return NextResponse.json({
      isSleeping: sleep.isSleeping,
      startedAt: sleep.startedAt?.toISOString() ?? null,
      isRiding: sleep.isRiding,
      rideStartedAt: sleep.rideStartedAt?.toISOString() ?? null,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch sleep state" }, { status: 500 });
  }
}

import { authorizeRequest } from "@/lib/spy-auth";

export async function POST(request: Request) {
  try {
    const authorized = await authorizeRequest(request);
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { isSleeping, isRiding } = body;

    const data: Record<string, unknown> = {};
    if (isSleeping !== undefined) {
      data.isSleeping = isSleeping;
      data.startedAt = isSleeping ? new Date() : null;
    }
    if (isRiding !== undefined) {
      data.isRiding = isRiding;
      data.rideStartedAt = isRiding ? new Date() : null;
    }

    const sleep = await prisma.spySleep.upsert({
      where: { id: "main" },
      update: data,
      create: {
        id: "main",
        isSleeping: isSleeping ?? false,
        startedAt: isSleeping ? new Date() : null,
        isRiding: isRiding ?? false,
        rideStartedAt: isRiding ? new Date() : null,
      },
    });

    return NextResponse.json({
      isSleeping: sleep.isSleeping,
      startedAt: sleep.startedAt?.toISOString() ?? null,
      isRiding: sleep.isRiding,
      rideStartedAt: sleep.rideStartedAt?.toISOString() ?? null,
    });
  } catch {
    return NextResponse.json({ error: "Failed to update state" }, { status: 500 });
  }
}
