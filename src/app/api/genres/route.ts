import { NextRequest, NextResponse } from "next/server";
import {
  getWritesOptions,
  getGenre1Options,
  getGenre2Options,
  getGenre3Options,
} from "@/lib/parse-genres";
import { getWritingStyleOptions } from "@/lib/parse-writing-styles";
import { getPersonalityOptions } from "@/lib/parse-personalities";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const level = searchParams.get("level");
  const writes = searchParams.get("writes");
  const genre1 = searchParams.get("genre_1");
  const genre2 = searchParams.get("genre_2");

  try {
    let options: string[] = [];

    switch (level) {
      case "writes":
        options = getWritesOptions();
        break;
      case "genre_1":
        options = getGenre1Options(writes);
        break;
      case "genre_2":
        options = getGenre2Options(writes, genre1);
        break;
      case "genre_3":
        options = getGenre3Options(writes, genre1, genre2);
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
