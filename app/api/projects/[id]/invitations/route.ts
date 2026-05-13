import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Send invitations to all participants in a project
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        batches: {
          include: {
            participants: {
              include: { invitation: true },
            },
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    const allParticipants = project.batches.flatMap((b) => b.participants);

    if (allParticipants.length === 0) {
      return NextResponse.json(
        { error: "No participants to invite" },
        { status: 400 }
      );
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Send invitations to participants who don't have one or whose invitation expired
    const results = [];
    for (const participant of allParticipants) {
      if (
        !participant.invitation ||
        participant.invitation.status === "expired"
      ) {
        if (participant.invitation) {
          // Delete old expired invitation
          await prisma.invitation.delete({
            where: { id: participant.invitation.id },
          });
        }

        const invitation = await prisma.invitation.create({
          data: {
            participantId: participant.id,
            status: "sent",
            sentAt: now,
            expiresAt,
          },
        });

        // Simulate external system notification
        console.log(
          `[External System] Sending invitation to ${participant.email} for project ${project.name}`
        );

        results.push(invitation);
      }
    }

    // Generate event
    await prisma.projectEvent.create({
      data: {
        projectId: id,
        type: "assessee_notified",
        payload: JSON.stringify({
          message: `Invitations sent to ${results.length} participants`,
          participantCount: results.length,
        }),
      },
    });

    return NextResponse.json(
      {
        message: `Invitations sent to ${results.length} participants`,
        invitations: results,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[API] POST /api/projects/[id]/invitations failed:", error);
    return NextResponse.json(
      { error: "Failed to send invitations" },
      { status: 500 }
    );
  }
}

// Resend invitation to a specific expired participant
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { participantId } = body;

    if (!participantId) {
      return NextResponse.json(
        { error: "participantId is required" },
        { status: 400 }
      );
    }

    const participant = await prisma.participant.findUnique({
      where: { id: participantId },
      include: {
        invitation: true,
        batch: true,
      },
    });

    if (!participant || participant.batch.projectId !== id) {
      return NextResponse.json(
        { error: "Participant not found in this project" },
        { status: 404 }
      );
    }

    if (
      participant.invitation &&
      participant.invitation.status !== "expired"
    ) {
      return NextResponse.json(
        { error: "Invitation is not expired" },
        { status: 400 }
      );
    }

    // Delete old invitation if exists
    if (participant.invitation) {
      await prisma.invitation.delete({
        where: { id: participant.invitation.id },
      });
    }

    const now = new Date();
    const invitation = await prisma.invitation.create({
      data: {
        participantId,
        status: "sent",
        sentAt: now,
        expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    console.log(
      `[External System] Resending invitation to ${participant.email}`
    );

    return NextResponse.json(invitation);
  } catch (error) {
    console.error("[API] PATCH /api/projects/[id]/invitations failed:", error);
    return NextResponse.json(
      { error: "Failed to resend invitation" },
      { status: 500 }
    );
  }
}
