import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/admin/writing-styles - Get all writing styles
export async function GET() {
  try {
    const writingStyles = await prisma.writingStyle.findMany({
      orderBy: [{ group: "asc" }, { order: "asc" }],
    });

    return NextResponse.json({ writingStyles });
  } catch (error) {
    console.error("Error fetching writing styles:", error);
    return NextResponse.json(
      { error: "Failed to fetch writing styles" },
      { status: 500 }
    );
  }
}

// POST /api/admin/writing-styles - Create a new writing style
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, group } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Writing style name is required" },
        { status: 400 }
      );
    }

    if (
      !description ||
      typeof description !== "string" ||
      !description.trim()
    ) {
      return NextResponse.json(
        { error: "Writing style description is required" },
        { status: 400 }
      );
    }

    // Get the highest order value and add 1
    const maxOrder = await prisma.writingStyle.findFirst({
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const writingStyle = await prisma.writingStyle.create({
      data: {
        name: name.trim(),
        description: description.trim(),
        group: group ? group.trim() : null,
        order: (maxOrder?.order ?? -1) + 1,
      },
    });

    return NextResponse.json({ writingStyle }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating writing style:", error);

    return NextResponse.json(
      { error: "Failed to create writing style" },
      { status: 500 }
    );
  }
}
