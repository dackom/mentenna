import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, unlink } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      authorId,
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

    // Construct the prompt for image generation
    let prompt = `Create an abstract, artistic avatar portrait representing an author with these characteristics:\n\n`;

    if (name) prompt += `Name: ${name}\n`;
    if (age) prompt += `Age: ${age}\n`;
    if (location) prompt += `Location: ${location}\n`;
    if (continent) prompt += `Continent: ${continent}\n`;
    if (field) prompt += `Field/Profession: ${field}\n`;
    if (genreDescriptions) prompt += `Writing Genres: ${genreDescriptions}\n`;
    if (personalityTraits)
      prompt += `Personality Traits: ${personalityTraits}\n`;
    if (writingStyles) prompt += `Writing Style: ${writingStyles}\n`;

    prompt += `\nCreate an abstract, artistic portrait that represents this author's essence. The style should be modern, professional, and suitable as an avatar. Size should be 500x500 pixels. The image can be abstract or stylized, not necessarily photorealistic.`;

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
          model: "google/gemini-2.5-flash-image-preview",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          modalities: ["image", "text"],
          temperature: 0.7,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error("OpenRouter API error:", errorData);
      return NextResponse.json(
        { error: "Failed to generate avatar image" },
        { status: response.status }
      );
    }

    const data = await response.json();
    const imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageData) {
      return NextResponse.json(
        { error: "No image generated" },
        { status: 500 }
      );
    }

    // Generate filename
    const timestamp = Date.now();
    const filename = authorId ? `${authorId}.png` : `avatar-${timestamp}.png`;

    // Get upload directory from environment
    const uploadsPath = process.env.AVATAR_UPLOAD_DIR || "avatars";

    // If author has an existing image and we're regenerating, delete the old one
    if (authorId) {
      try {
        const author = await prisma.author.findUnique({
          where: { id: authorId },
          select: { image: true },
        });

        if (author?.image) {
          const oldFilePath = path.join(uploadsPath, author.image);
          if (existsSync(oldFilePath)) {
            await unlink(oldFilePath);
          }
        }
      } catch (error) {
        console.error("Error deleting old avatar:", error);
        // Continue anyway
      }
    }

    // Save the image
    const filePath = path.join(uploadsPath, filename);

    // Extract base64 data
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    await writeFile(filePath, buffer);

    // Update author record if authorId is provided
    if (authorId) {
      await prisma.author.update({
        where: { id: authorId },
        data: { image: filename },
      });
    }

    // Extract usage and cost information if available
    const usage = data.usage;

    return NextResponse.json({
      filename,
      usage: usage || null,
    });
  } catch (error) {
    console.error("Error generating avatar:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
