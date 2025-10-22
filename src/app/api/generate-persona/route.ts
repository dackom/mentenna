import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      pronouns,
      age,
      continent,
      location,
      field,
      writingGenres,
      personalityIds,
      writingStyle1Id,
      writingStyle2Id,
    } = body;

    // Build the prompt based on available data
    const genreDescriptions = writingGenres
      ?.filter(
        (g: { writes?: string; genre_1?: string }) => g.writes || g.genre_1
      )
      .map(
        (g: {
          writes?: string;
          genre_1?: string;
          genre_2?: string;
          genre_3?: string;
        }) => {
          const parts = [g.writes, g.genre_1, g.genre_2, g.genre_3].filter(
            Boolean
          );
          return parts.join(" - ");
        }
      )
      .join(", ");

    // Fetch personality names from IDs
    let personalityTraits = "";
    if (personalityIds && personalityIds.length > 0) {
      const personalities = await prisma.personality.findMany({
        where: {
          id: {
            in: personalityIds,
          },
        },
        select: {
          name: true,
        },
      });
      personalityTraits = personalities.map((p) => p.name).join(", ");
    }

    // Fetch writing style names from IDs
    const writingStyleIds = [writingStyle1Id, writingStyle2Id].filter(Boolean);
    let writingStyles = "";
    if (writingStyleIds.length > 0) {
      const styles = await prisma.writingStyle.findMany({
        where: {
          id: {
            in: writingStyleIds,
          },
        },
        select: {
          name: true,
        },
      });
      writingStyles = styles.map((s) => s.name).join(" and ");
    }

    // Construct the prompt
    let prompt = `Create a concise AI persona description for an author with the following characteristics:\n\n`;

    if (name) prompt += `Name: ${name}\n`;
    if (pronouns) prompt += `Pronouns: ${pronouns}\n`;
    if (age) prompt += `Age: ${age}\n`;
    if (location) prompt += `Location: ${location}\n`;
    if (continent) prompt += `Continent: ${continent}\n`;
    if (field) prompt += `Field/Profession: ${field}\n`;
    if (genreDescriptions) prompt += `Writing Genres: ${genreDescriptions}\n`;
    if (personalityTraits)
      prompt += `Personality Traits: ${personalityTraits}\n`;
    if (writingStyles) prompt += `Writing Style: ${writingStyles}\n`;

    prompt += `\nCreate a 3-4 sentence persona description similar to this example:
"Kate Bloom's AI persona is an American psychologist in her mid 40s. She comes from Ohio and writes nonfiction Self-Help & Personal development books. She specializes/her expertise is in relationships and family constellations. She is insightful, empathetic and explores human behavior deeply. Her writing style is reflective. You can read her books in any language of your choice."

The description should:
1. Start with "{name}'s AI persona is..."
2. Include nationality/location and profession/field
3. Mention what they write (genres)
4. Highlight their expertise or specialization
5. Incorporate personality traits naturally
6. Mention their writing style
7. End with "You can read their books in any language of your choice."

Keep it professional, coherent, and flowing naturally.`;

    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenRouter API key not configured" },
        { status: 500 }
      );
    }

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer":
            process.env.BETTER_AUTH_URL || "http://localhost:3000",
          "X-Title": "Mentenna",
        },
        body: JSON.stringify({
          model: "openai/gpt-3.5-turbo-16k", // You can change this to other models
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error("OpenRouter API error:", errorData);
      return NextResponse.json(
        { error: "Failed to generate persona" },
        { status: response.status }
      );
    }

    const data = await response.json();
    const generatedPersona = data.choices?.[0]?.message?.content;

    if (!generatedPersona) {
      return NextResponse.json(
        { error: "No persona generated" },
        { status: 500 }
      );
    }

    // Extract usage and cost information if available
    const usage = data.usage;

    return NextResponse.json({
      persona: generatedPersona,
      usage: usage || null,
    });
  } catch (error) {
    console.error("Error generating persona:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
