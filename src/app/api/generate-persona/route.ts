import { NextRequest, NextResponse } from "next/server";

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
      personality,
      writing_style_1,
      writing_style_2,
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

    const personalityTraits = personality
      ?.split(";")
      .filter((p: string) => p.trim())
      .join(", ");

    const writingStyles = [writing_style_1, writing_style_2]
      .filter(Boolean)
      .join(" and ");

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

    return NextResponse.json({ persona: generatedPersona });
  } catch (error) {
    console.error("Error generating persona:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
