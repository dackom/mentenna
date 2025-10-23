import { NextResponse } from "next/server";

export async function GET() {
  try {
    const apiKey = process.env.OPENROUTER_PROVISIONING_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenRouter API key not configured" },
        { status: 500 }
      );
    }

    const response = await fetch("https://openrouter.ai/api/v1/activity", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("OpenRouter API error:", errorData);
      return NextResponse.json(
        { error: "Failed to fetch OpenRouter activity" },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching OpenRouter activity:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
