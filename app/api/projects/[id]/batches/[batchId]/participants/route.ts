import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const MAX_PARTICIPANTS_PER_BATCH = 20;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; batchId: string }> }
) {
  try {
    const { id, batchId } = await params;
    const body = await request.json();
    const { name, email } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    // Validate batch exists and belongs to project
    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      include: { _count: { select: { participants: true } } },
    });

    if (!batch || batch.projectId !== id) {
      return NextResponse.json(
        { error: "Batch not found in this project" },
        { status: 404 }
      );
    }

    // AC-14, AC-16: Backend validation - max 20 participants per batch
    if (batch._count.participants >= MAX_PARTICIPANTS_PER_BATCH) {
      return NextResponse.json(
        {
          error: `Batch "${batch.name}" already has ${MAX_PARTICIPANTS_PER_BATCH} participants. Maximum ${MAX_PARTICIPANTS_PER_BATCH} participants per batch. Please create a new batch.`,
        },
        { status: 400 }
      );
    }

    const participant = await prisma.participant.create({
      data: {
        name,
        email,
        batchId,
      },
    });

    return NextResponse.json(participant, { status: 201 });
  } catch (error) {
    console.error(
      "[API] POST /api/projects/[id]/batches/[batchId]/participants failed:",
      error
    );
    return NextResponse.json(
      { error: "Failed to add participant" },
      { status: 500 }
    );
  }
}
