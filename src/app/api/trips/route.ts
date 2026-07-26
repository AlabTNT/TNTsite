import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const trips = await prisma.trip.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        events: {
          where: { parentId: null }, // Only main nodes
          orderBy: { timestamp: 'asc' },
          include: {
            subNodes: {
              orderBy: { timestamp: 'asc' }
            }
          }
        }
      }
    });
    return NextResponse.json(trips);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch trips' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, location, startDate, endDate, description, imageUrl, status } = body;
    
    const newTrip = await prisma.trip.create({
      data: {
        title,
        location,
        startDate,
        endDate,
        description,
        imageUrl,
        status,
      }
    });
    
    return NextResponse.json(newTrip, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create trip' }, { status: 500 });
  }
}
