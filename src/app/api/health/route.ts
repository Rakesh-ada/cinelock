import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

/**
 * Health Check API - Use this to diagnose production issues
 * Visit: /api/health
 */
export async function GET() {
    const checks: any = {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        checks: {}
    };

    // 1. Environment Variables Check
    checks.checks.envVars = {
        mongodb: !!process.env.MONGODB_URI,
        azureApiKey: !!process.env.AZURE_OPENAI_API_KEY,
        azureEndpoint: !!process.env.AZURE_OPENAI_ENDPOINT,
        pollinationsKey: !!process.env.POLLINATIONS_API_KEY,
        clerkPublic: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
        clerkSecret: !!process.env.CLERK_SECRET_KEY,
        allPresent: !!(
            process.env.MONGODB_URI &&
            process.env.AZURE_OPENAI_API_KEY &&
            process.env.AZURE_OPENAI_ENDPOINT &&
            process.env.CLERK_SECRET_KEY
        )
    };

    // 2. MongoDB Connection Check
    try {
        const conn = await connectToDatabase();
        const db = conn.connection.db;
        const collections = await db?.listCollections().toArray();
        
        checks.checks.mongodb = {
            status: "connected",
            database: db?.databaseName,
            collections: collections?.map((c: any) => c.name) || []
        };
    } catch (error: any) {
        checks.checks.mongodb = {
            status: "failed",
            error: error.message
        };
    }

    // 3. Clerk Authentication Check
    try {
        const { userId } = await auth();
        checks.checks.auth = {
            status: userId ? "authenticated" : "not-authenticated",
            userId: userId || null
        };
    } catch (error: any) {
        checks.checks.auth = {
            status: "error",
            error: error.message
        };
    }

    // Overall Status
    const isHealthy = 
        checks.checks.envVars.allPresent &&
        checks.checks.mongodb.status === "connected";

    return NextResponse.json({
        healthy: isHealthy,
        ...checks
    }, { 
        status: isHealthy ? 200 : 503 
    });
}
