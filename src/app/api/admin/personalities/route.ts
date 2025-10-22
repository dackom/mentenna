import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/admin/personalities - Get all personalities
export async function GET() {
  try {
    const personalities = await prisma.personality.findMany({
      orderBy: { order: "asc" },
    });

    return NextResponse.json({ personalities });
  } catch (error) {
    console.error("Error fetching personalities:", error);
    return NextResponse.json(
      { error: "Failed to fetch personalities" },
      { status: 500 }
    );
  }
}

// POST /api/admin/personalities - Create a new personality
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Personality name is required" },
        { status: 400 }
      );
    }

    // Get the highest order value and add 1
    const maxOrder = await prisma.personality.findFirst({
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const personality = await prisma.personality.create({
      data: {
        name: name.trim(),
        order: (maxOrder?.order ?? -1) + 1,
      },
    });

    return NextResponse.json({ personality }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating personality:", error);

    // Handle unique constraint violation
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A personality with this name already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create personality" },
      { status: 500 }
    );
  }
}
