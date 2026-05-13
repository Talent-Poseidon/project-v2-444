import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const assessors = await prisma.masterAssessor.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(assessors);
  } catch (error) {
    console.error("[API] GET /api/master-assessors failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch master assessors" },
      { status: 500 }
    );
  }
}
