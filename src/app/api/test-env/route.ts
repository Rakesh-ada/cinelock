import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

/**
 * Environment Variables Test API
 * This endpoint checks if all required environment variables are configured
 * Visit: /api/test-env to check your configuration
 */
export async function GET() {
    const envCheck = {
        // MongoDB
        mongodb: {
            hasUri: !!process.env.MONGODB_URI,
            uriPreview: process.env.MONGODB_URI 
                ? `${process.env.MONGODB_URI.substring(0, 20)}...${process.env.MONGODB_URI.slice(-10)}`
                : "MISSING"
        },
        
        // Azure OpenAI
        azureOpenAI: {
            hasApiKey: !!process.env.AZURE_OPENAI_API_KEY,
            hasEndpoint: !!process.env.AZURE_OPENAI_ENDPOINT,
            endpoint: process.env.AZURE_OPENAI_ENDPOINT || "MISSING",
            chatDeployment: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "MISSING",
            imageDeployment: process.env.AZURE_OPENAI_IMAGE_DEPLOYMENT_NAME || "MISSING"
        },
        
        // Pollinations (Budget Analysis)
        pollinations: {
            hasApiKey: !!process.env.POLLINATIONS_API_KEY
        },
        
        // Clerk Authentication
        clerk: {
            hasPublishableKey: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
            hasSecretKey: !!process.env.CLERK_SECRET_KEY
        }
    };
    
    // Test MongoDB connection
    let dbStatus = { connected: false, error: null, databaseName: null, collections: [] };
    try {
        const connection = await connectToDatabase();
        dbStatus.connected = true;
        dbStatus.databaseName = connection.connection.db?.databaseName || null;
        
        const collections = await connection.connection.db?.listCollections().toArray();
        dbStatus.collections = collections?.map((c: any) => c.name) || [];
    } catch (error: any) {
        dbStatus.error = error.message;
    }
    
    // Test Clerk authentication
    let authStatus = { authenticated: false, userId: null as string | null };
    try {
        const { userId } = await auth();
        authStatus.authenticated = !!userId;
        authStatus.userId = userId || null;
    } catch (error: any) {
        authStatus.authenticated = false;
    }
    
    // Overall status
    const allConfigured = 
        envCheck.mongodb.hasUri &&
        envCheck.azureOpenAI.hasApiKey &&
        envCheck.azureOpenAI.hasEndpoint &&
        envCheck.clerk.hasPublishableKey &&
        envCheck.clerk.hasSecretKey;
    
    const allWorking = allConfigured && dbStatus.connected;
    
    return NextResponse.json({
        status: allWorking ? "healthy" : "unhealthy",
        allConfigured,
        environment: envCheck,
        database: dbStatus,
        authentication: authStatus,
        timestamp: new Date().toISOString()
    });
}
