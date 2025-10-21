import { NextRequest, NextResponse } from "next/server";
import { getGenre1ByWrites, getGenre2ByGenre1 } from "@/lib/db/genres";
import { getWritingStyleOptions } from "@/lib/parse-writing-styles";
import { getPersonalityOptions } from "@/lib/parse-personalities";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const level = searchParams.get("level");
  const writes = searchParams.get("writes");
  const genre1Id = searchParams.get("genre1Id");

  try {
    let options: Array<{ id: string; name: string }> | string[] = [];

    switch (level) {
      case "writes":
        // Hardcoded writes options
        options = [
          { id: "Fiction", name: "Fiction" },
          { id: "Non-fiction", name: "Non-fiction" },
          { id: "Speculative", name: "Speculative" },
        ];
        break;
      case "genre_1":
        if (!writes) {
          return NextResponse.json(
            { error: "writes parameter is required for genre_1" },
            { status: 400 }
          );
        }
        const genre1List = await getGenre1ByWrites(writes);
        options = genre1List.map((g: { id: string; name: string }) => ({
          id: g.id,
          name: g.name,
        }));
        break;
      case "genre_2":
        if (!genre1Id) {
          return NextResponse.json(
            { error: "genre1Id parameter is required for genre_2" },
            { status: 400 }
          );
        }
        const genre2List = await getGenre2ByGenre1(genre1Id);
        options = genre2List.map((g: { id: string; name: string }) => ({
          id: g.id,
          name: g.name,
        }));
        break;
      case "genre_3":
        // genre_3 is free text, return empty array
        options = [];
        break;
      case "writing_styles":
        options = getWritingStyleOptions();
        break;
      case "personalities":
        options = getPersonalityOptions();
        break;
      default:
        return NextResponse.json(
          { error: "Invalid level parameter" },
          { status: 400 }
        );
    }

    return NextResponse.json({ options });
  } catch (error) {
    console.error("Error fetching genre options:", error);
    return NextResponse.json(
      { error: "Failed to fetch genre options" },
      { status: 500 }
    );
  }
}
