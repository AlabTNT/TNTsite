import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, description, location, timestamp, status, type } = body;

    const activity = await prisma.spyActivity.update({
      where: { id },
      data: { title, description, location, timestamp, status, type },
    });

    return NextResponse.json(activity);
  } catch (error) {
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
    const { id } = await params;
    await prisma.spyActivity.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete spy activity" },
      { status: 500 }
    );
  }
}
