import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const trip = await prisma.trip.findUnique({
      where: { id },
      include: {
        events: {
          where: { parentId: null },
          orderBy: { timestamp: 'asc' },
          include: {
            subNodes: {
              orderBy: { timestamp: 'asc' }
            }
          }
        }
      }
    });
    
    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }
    
    return NextResponse.json(trip);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch trip' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const updatedTrip = await prisma.trip.update({
      where: { id },
      data: body,
    });
    
    return NextResponse.json(updatedTrip);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update trip' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.trip.delete({
      where: { id },
    });
    
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete trip' }, { status: 500 });
  }
}
