import { NextResponse } from "next/server";
import { STUDIO_BUDGET_SYSTEM_PROMPT } from "@/lib/prompts";

export async function POST(req: Request) {
    try {
        const { imageUrl, projectContext } = await req.json();

        if (!imageUrl) {
            return NextResponse.json({ error: "Image URL is required" }, { status: 400 });
        }

        console.log("Analyzing budget for image...");

        const contextPrompt = projectContext
            ? `Project Context: ${JSON.stringify(projectContext)}. Use this context (Scale, Genre, Budget Limit) to scale the estimated costs appropriately. `
            : "";

        const apiKey = process.env.POLLINATIONS_API_KEY;

        // Helper to make request
        const fetchBudget = async (model: string) => {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };
            // Only attach auth if we have a key
            if (apiKey) {
                headers['Authorization'] = `Bearer ${apiKey}`;
            }

            const messages: any[] = [
                {
                    role: "system",
                    content: STUDIO_BUDGET_SYSTEM_PROMPT
                },
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: `${contextPrompt}Analyze this generated movie scene image. Provide the budget breakdown as requested.`
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: imageUrl
                            }
                        }
                    ]
                }
            ];

            const res = await fetch('https://gen.pollinations.ai/v1/chat/completions', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    model: model,
                    messages: messages
                })
            });

            if (!res.ok) {
                const txt = await res.text();
                throw new Error(`${res.status} ${txt}`);
            }
            return res.json();
        };

        let data;

        // Attempt 1: Gemini Search (preferred)
        try {
            console.log("Attempting with model: gemini-search");
            data = await fetchBudget("gemini-search");
        } catch (e: any) {
            console.warn("gemini-search failed:", e.message);
            // Attempt 2: OpenAI (fallback)
            // OpenAI model on Pollinations usually supports vision (GPT-4o or similar)
            console.log("Falling back to model: openai");
            data = await fetchBudget("openai");
        }

        const content = data?.choices?.[0]?.message?.content || "Could not generate budget analysis.";
        return NextResponse.json({ content });

    } catch (error: any) {
        console.error("Budget Analysis Error:", error);
        return NextResponse.json({
            content: "I'm sorry, I couldn't generate a budget analysis for this image. The analysis service is currently unavailable."
        }, { status: 500 });
    }
}
