import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tripId, parentId, timestamp, content, mode, scheduledTime } = body;
    
    // Modes:
    // 'immediate': isPool = false, publishAt = null (or now)
    // 'scheduled': isPool = false, publishAt = scheduledTime
    // 'pool': isPool = true, publishAt = null
    
    let isPool = false;
    let publishAt = null;

    if (mode === 'pool') {
      isPool = true;
    } else if (mode === 'scheduled') {
      publishAt = scheduledTime ? new Date(scheduledTime) : new Date();
    } else {
      // immediate
      publishAt = new Date(); // Publish immediately
    }

    const newEvent = await prisma.tripEvent.create({
      data: {
        tripId,
        parentId,
        timestamp,
        content,
        isPool,
        publishAt,
      }
    });
    
    return NextResponse.json(newEvent, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}
