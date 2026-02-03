import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
    const error = 'MONGODB_URI environment variable is not defined. Please add it to your .env.local file or deployment environment variables.';
    console.error('[DB ERROR]', error);
    throw new Error(error);
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
// @ts-ignore
let cached = global.mongoose;

if (!cached) {
    // @ts-ignore
    cached = global.mongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
    if (cached.conn) {
        console.log("[DB] Using cached MongoDB connection");
        return cached.conn;
    }

    if (!cached.promise) {
        console.log("[DB] Creating new MongoDB connection...");
        console.log("[DB] MONGODB_URI present:", !!MONGODB_URI);
        const opts = {
            bufferCommands: false,
        };

        cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
            console.log("[DB] MongoDB connected successfully");
            return mongoose;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (e: any) {
        console.error("[DB] MongoDB connection failed:", e.message);
        console.error("[DB] Connection string format check:", MONGODB_URI.substring(0, 20) + "...");
        console.error("[DB] Full error:", JSON.stringify(e, null, 2));
        cached.promise = null;
        throw new Error(`MongoDB connection failed: ${e.message}. Check your MONGODB_URI and network access in MongoDB Atlas.`);
    }

    return cached.conn;
}

export default connectToDatabase;
