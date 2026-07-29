import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeStatus } from "@/lib/types/trip";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    let sleep = await prisma.spySleep.findUnique({ where: { id: "main" } });
    const isSleeping = sleep?.isSleeping ?? false;

    const activities = await prisma.spyActivity.findMany();
    const activeActivities = activities.filter(a => computeStatus(a as any) === "active");

    let status: "idle" | "sleeping" | "maybe" | "must" = "idle";
    let msgStatus: "none" | "maybe" | "must" = "none";
    let reason: string | null = null;

    if (isSleeping) {
      status = "sleeping";
      msgStatus = "must";
      reason = "Sleeping";
    } else if (activeActivities.length > 0) {
      const hasMust = activeActivities.some(a => a.msgStatus === "must");
      const hasMaybe = activeActivities.some(a => a.msgStatus === "maybe");

      if (hasMust) {
        status = "must";
        msgStatus = "must";
      } else if (hasMaybe) {
        status = "maybe";
        msgStatus = "maybe";
      }

      reason = activeActivities.map(a => a.title).join(", ");
    }

    return NextResponse.json({
      active: isSleeping || activeActivities.length > 0,
      status,
      msgStatus,
      reason,
      isSleeping,
      activities: activeActivities,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch active state" }, { status: 500 });
  }
}
