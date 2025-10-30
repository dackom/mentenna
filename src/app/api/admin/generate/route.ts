export async function POST(req: Request) {
  try {
    const { prompt, model } = await req.json();

    if (!prompt || !model) {
      return Response.json(
        { error: "Prompt and model are required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return Response.json(
        { error: "OPENROUTER_API_KEY environment variable is not set" },
        { status: 500 }
      );
    }

    const openRouterModel = model;

    console.log("[v0] Calling OpenRouter with model:", openRouterModel);

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer":
            process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
          "X-Title": "Mentenna",
        },
        body: JSON.stringify({
          model: openRouterModel,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          max_tokens: 1000,
          temperature: 0.7,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[v0] OpenRouter API error:", errorData);
      return Response.json(
        { error: `OpenRouter API error: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    const text = data.choices?.[0]?.message?.content || "No response generated";
    const usage = {
      promptTokens: data.usage?.prompt_tokens || 0,
      completionTokens: data.usage?.completion_tokens || 0,
      totalTokens: data.usage?.total_tokens || 0,
    };
    const finishReason = data.choices?.[0]?.finish_reason || "stop";

    console.log("[v0] Successfully received response from OpenRouter");

    return Response.json({
      text,
      usage,
      finishReason,
    });
  } catch (error) {
    console.error("[v0] Error in generate route:", error);
    return Response.json(
      {
        error: `Failed to generate response: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 }
    );
  }
}
