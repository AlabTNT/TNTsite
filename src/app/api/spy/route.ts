import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const activities = await prisma.spyActivity.findMany({
      orderBy: { timestamp: "asc" },
    });
    return NextResponse.json(activities);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch spy activities" },
      { status: 500 }
    );
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
    const { title, description, location, timestamp, timestamp2, type, flightNumber, trainNumber, departure, arrival, recurrence, msgStatus } = body;

    const activity = await prisma.spyActivity.create({
      data: {
        title, description, location, timestamp, timestamp2, type,
        flightNumber, trainNumber, departure, arrival, recurrence, msgStatus,
      },
    });

    return NextResponse.json(activity, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create spy activity" },
      { status: 500 }
    );
  }
}
