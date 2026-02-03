import { OpenAI } from "openai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        console.log("[IMAGE] Image generation request received");
        console.log("[IMAGE] Environment check - AZURE_OPENAI_API_KEY:", !!process.env.AZURE_OPENAI_API_KEY);
        console.log("[IMAGE] Environment check - AZURE_OPENAI_ENDPOINT:", !!process.env.AZURE_OPENAI_ENDPOINT);
        console.log("[IMAGE] Environment check - AZURE_OPENAI_IMAGE_DEPLOYMENT_NAME:", process.env.AZURE_OPENAI_IMAGE_DEPLOYMENT_NAME);
        
        const body = await req.json();
        const { prompt } = body;

        if (!prompt) {
            console.error("[IMAGE] Missing prompt in request");
            return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
        }
        
        console.log("[IMAGE] Prompt received:", prompt.substring(0, 100));

        // Client for Chat (Prompt Enhancement)
        const chatClient = new OpenAI({
            apiKey: process.env.AZURE_OPENAI_API_KEY,
            baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME}`,
            defaultQuery: { 'api-version': '2024-08-01-preview' },
            defaultHeaders: { 'api-key': process.env.AZURE_OPENAI_API_KEY }
        });

        // Client for Image Generation
        const imageClient = new OpenAI({
            apiKey: process.env.AZURE_OPENAI_API_KEY,
            baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}openai/deployments/${process.env.AZURE_OPENAI_IMAGE_DEPLOYMENT_NAME}`,
            defaultQuery: { 'api-version': '2024-06-01' },
            defaultHeaders: { 'api-key': process.env.AZURE_OPENAI_API_KEY }
        });

        let finalPrompt = prompt;

        // 1. Prompt Enhancement (if short < 50 chars)
        if (prompt.length < 50) {
            console.log("[IMAGE] Enhancing short prompt:", prompt);
            try {
                const enhancementResponse = await chatClient.chat.completions.create({
                    model: "", // Model from URL
                    messages: [
                        {
                            role: "system",
                            content: "You are an expert prompt engineer for AI image generation. Your task is to take a short, simple user prompt and rewrite it into a highly detailed, cinematic, and descriptive prompt suitable for a high-quality image generator (like FLUX or Midjourney). Focus on lighting, texture, composition, and mood. Keep it under 100 words. Output ONLY the enhanced prompt, no intro/outro."
                        },
                        { role: "user", content: prompt }
                    ],
                    temperature: 0.7,
                });
                finalPrompt = enhancementResponse.choices[0].message.content?.trim() || prompt;
                console.log("[IMAGE] Enhanced Prompt:", finalPrompt);
            } catch (err: any) {
                console.error("[IMAGE] Enhancement failed, using original prompt:", err.message);
            }
        }

        // 2. Image Generation
        console.log("[IMAGE] Starting image generation with Azure OpenAI...");
        const response = await imageClient.images.generate({
            model: "", // Model is specified in the URL path for Azure
            prompt: finalPrompt,
            n: 1,
            size: "1024x1024",
            response_format: "b64_json"
        });

        if (!response.data || !response.data[0]?.b64_json) {
            console.error("[IMAGE] No image data returned from API");
            throw new Error("No image data returned from API");
        }

        const b64Json = response.data[0].b64_json;
        const imageUri = `data:image/png;base64,${b64Json}`;
        
        console.log("[IMAGE] Image generated successfully, size:", b64Json.length, "characters");

        return NextResponse.json({
            imageUrl: imageUri,
            revisedPrompt: finalPrompt !== prompt ? finalPrompt : undefined
        });

    } catch (error: any) {
        console.error("[IMAGE] Image API Error:", error.message);
        console.error("[IMAGE] Error stack:", error.stack);
        console.error("[IMAGE] Error details:", JSON.stringify(error, null, 2));
        // Fallback to demo image if API fails (likely due to missing key)
        return NextResponse.json({
            imageUrl: "/demo-panorama.png",
            info: "Fallback to demo image due to API error",
            error: error.message
        }, { status: 200 }); // Return 200 to fail gracefully in frontend
    }
}
