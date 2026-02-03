import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Project from "@/models/Project";
import ChatSession from "@/models/ChatSession";
import Scene from "@/models/Scene";
import BudgetItem from "@/models/BudgetItem";

/**
 * Database Initialization API
 * This endpoint initializes all MongoDB collections and creates indexes
 * Visit: /api/init-db to set up your database
 */
export async function GET() {
    try {
        console.log("[INIT-DB] Starting database initialization...");
        
        // Connect to MongoDB
        const connection = await connectToDatabase();
        console.log("[INIT-DB] MongoDB connected successfully");
        
        // Get database instance
        const db = connection.connection.db;
        console.log("[INIT-DB] Database name:", db?.databaseName);
        
        // Initialize all models (this ensures collections are created)
        console.log("[INIT-DB] Initializing models...");
        
        // Create collections if they don't exist
        const collections = await db?.listCollections().toArray();
        const collectionNames = collections?.map((c: any) => c.name) || [];
        console.log("[INIT-DB] Existing collections:", collectionNames);
        
        // Ensure all model collections exist
        const modelsToInit = [
            { model: Project, name: 'projects' },
            { model: ChatSession, name: 'chatsessions' },
            { model: Scene, name: 'scenes' },
            { model: BudgetItem, name: 'budgetitems' }
        ];
        
        const results = [];
        
        for (const { model, name } of modelsToInit) {
            try {
                // Ensure indexes are created
                await model.init();
                await model.createIndexes();
                
                // Check if collection exists
                const exists = collectionNames.includes(name);
                
                if (!exists) {
                    // Create collection by inserting and deleting a dummy document
                    console.log(`[INIT-DB] Creating collection: ${name}`);
                    // Collection will be created on first insert
                }
                
                // Get collection stats
                const count = await model.countDocuments();
                
                results.push({
                    collection: name,
                    status: 'initialized',
                    documentCount: count,
                    alreadyExisted: exists
                });
                
                console.log(`[INIT-DB] ✓ ${name}: ${count} documents`);
            } catch (error: any) {
                console.error(`[INIT-DB] Error initializing ${name}:`, error.message);
                results.push({
                    collection: name,
                    status: 'error',
                    error: error.message
                });
            }
        }
        
        // List all collections after initialization
        const finalCollections = await db?.listCollections().toArray();
        const finalCollectionNames = finalCollections?.map((c: any) => c.name) || [];
        
        console.log("[INIT-DB] Final collections:", finalCollectionNames);
        
        return NextResponse.json({
            success: true,
            message: "Database initialized successfully",
            database: db?.databaseName,
            collections: results,
            allCollections: finalCollectionNames
        });
        
    } catch (error: any) {
        console.error("[INIT-DB] Initialization failed:", error);
        return NextResponse.json({
            success: false,
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
