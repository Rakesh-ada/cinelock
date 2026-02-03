import { OpenAI } from "openai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { messages } = body;

        const client = new OpenAI({
            apiKey: process.env.AZURE_OPENAI_API_KEY,
            baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME}`,
            defaultQuery: { 'api-version': '2024-08-01-preview' },
            defaultHeaders: { 'api-key': process.env.AZURE_OPENAI_API_KEY }
        });

        const completion = await client.chat.completions.create({
            model: "", // Model is specified in the URL path for Azure
            messages: messages,
            temperature: 0.7,
        });

        return NextResponse.json({
            content: completion.choices[0].message.content
        });

    } catch (error) {
        console.error("Chat API Error:", error);
        return NextResponse.json({ error: "Failed to generate response" }, { status: 500 });
    }
}
