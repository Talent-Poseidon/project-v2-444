import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const assessors = await prisma.projectAssessor.findMany({
      where: { projectId: id },
      include: { masterAssessor: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(assessors);
  } catch (error) {
    console.error("[API] GET /api/projects/[id]/assessors failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch assessors" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { masterAssessorId } = body;

    if (!masterAssessorId) {
      return NextResponse.json(
        { error: "masterAssessorId is required" },
        { status: 400 }
      );
    }

    // Validate project exists
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Validate master assessor exists (AC-13: must be from valid master data)
    const masterAssessor = await prisma.masterAssessor.findUnique({
      where: { id: masterAssessorId },
    });
    if (!masterAssessor) {
      return NextResponse.json(
        { error: "Invalid assessor: not found in master data" },
        { status: 400 }
      );
    }

    // Check if already assigned
    const existing = await prisma.projectAssessor.findUnique({
      where: {
        projectId_masterAssessorId: {
          projectId: id,
          masterAssessorId,
        },
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Assessor already assigned to this project" },
        { status: 400 }
      );
    }

    const assessor = await prisma.projectAssessor.create({
      data: {
        projectId: id,
        masterAssessorId,
      },
      include: { masterAssessor: true },
    });

    // Generate event (AC-12)
    await prisma.projectEvent.create({
      data: {
        projectId: id,
        type: "assessor_assigned",
        payload: JSON.stringify({
          message: `Assessor "${masterAssessor.name}" assigned to project`,
          assessorId: masterAssessorId,
        }),
      },
    });

    return NextResponse.json(assessor, { status: 201 });
  } catch (error) {
    console.error("[API] POST /api/projects/[id]/assessors failed:", error);
    return NextResponse.json(
      { error: "Failed to assign assessor" },
      { status: 500 }
    );
  }
}
