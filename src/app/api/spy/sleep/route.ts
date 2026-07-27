import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    let sleep = await prisma.spySleep.findUnique({ where: { id: "main" } });
    if (!sleep) {
      sleep = await prisma.spySleep.create({ data: { id: "main", isSleeping: false } });
    }
    return NextResponse.json({ isSleeping: sleep.isSleeping, startedAt: sleep.startedAt?.toISOString() ?? null });
  } catch {
    return NextResponse.json({ error: "Failed to fetch sleep state" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { isSleeping } = body;

    const data: Record<string, unknown> = { isSleeping };
    if (isSleeping) {
      data.startedAt = new Date();
    } else {
      data.startedAt = null;
    }

    const sleep = await prisma.spySleep.upsert({
      where: { id: "main" },
      update: data,
      create: { id: "main", isSleeping, startedAt: isSleeping ? new Date() : null },
    });

    return NextResponse.json({ isSleeping: sleep.isSleeping, startedAt: sleep.startedAt?.toISOString() ?? null });
  } catch {
    return NextResponse.json({ error: "Failed to update sleep state" }, { status: 500 });
  }
}
