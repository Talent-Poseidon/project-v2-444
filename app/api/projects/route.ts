import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        batches: {
          include: {
            _count: { select: { participants: true } },
          },
        },
        _count: { select: { assessors: true, events: true } },
      },
    });
    return NextResponse.json(projects);
  } catch (error) {
    console.error("[API] GET /api/projects failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, batchName } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    const project = await prisma.project.create({
      data: {
        name,
        description: description || null,
        status: "active",
        batches: batchName
          ? { create: { name: batchName } }
          : undefined,
        events: {
          create: {
            type: "submit_project",
            payload: JSON.stringify({
              message: `Project "${name}" created and submitted`,
            }),
          },
        },
      },
      include: {
        batches: true,
        events: true,
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("[API] POST /api/projects failed:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
