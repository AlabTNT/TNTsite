import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { content, mode, scheduledTime, isPool } = body;
    
    // If pulling from pool ('pull' mode)
    let updateData: any = { content };
    
    if (mode === 'pull') {
      updateData.isPool = false;
      updateData.publishAt = scheduledTime ? new Date(scheduledTime) : new Date();
    } else if (isPool !== undefined) {
      updateData.isPool = isPool;
    }
    
    if (scheduledTime && mode !== 'pull') {
      updateData.publishAt = new Date(scheduledTime);
    }

    const updatedEvent = await prisma.tripEvent.update({
      where: { id },
      data: updateData,
    });
    
    return NextResponse.json(updatedEvent);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.tripEvent.delete({
      where: { id },
    });
    
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
  }
}
