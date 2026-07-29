import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { authorizeRequest } from "@/lib/spy-auth";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authorized = await authorizeRequest(request);
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { title, description, location, timestamp, timestamp2, type, flightNumber, trainNumber, departure, arrival, recurrence, manualPast, msgStatus } = body;

    const activity = await prisma.spyActivity.update({
      where: { id },
      data: { title, description, location, timestamp, timestamp2, type, flightNumber, trainNumber, departure, arrival, recurrence, manualPast, msgStatus },
    });

    return NextResponse.json(activity);
  } catch {
    return NextResponse.json(
      { error: "Failed to update spy activity" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authorized = await authorizeRequest(_request);
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await prisma.spyActivity.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete spy activity" },
      { status: 500 }
    );
  }
}
