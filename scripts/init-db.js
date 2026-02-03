/**
 * Database Initialization Script
 * 
 * This script initializes the MongoDB database with all required collections
 * and ensures indexes are created.
 * 
 * Run: node --loader ts-node/esm init-db-script.ts
 * Or visit: http://localhost:3000/api/init-db
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in .env.local');
    process.exit(1);
}

// Import models
const Project = require('./src/models/Project').default;
const ChatSession = require('./src/models/ChatSession').default;
const Scene = require('./src/models/Scene').default;
const BudgetItem = require('./src/models/BudgetItem').default;

async function initializeDatabase() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');
        
        const db = mongoose.connection.db;
        console.log('📦 Database:', db.databaseName);
        
        // List existing collections
        const collections = await db.listCollections().toArray();
        console.log('📋 Existing collections:', collections.map(c => c.name));
        
        // Initialize models and create indexes
        const models = [
            { model: Project, name: 'Project' },
            { model: ChatSession, name: 'ChatSession' },
            { model: Scene, name: 'Scene' },
            { model: BudgetItem, name: 'BudgetItem' }
        ];
        
        console.log('\n🔨 Initializing collections and indexes...');
        
        for (const { model, name } of models) {
            try {
                await model.init();
                await model.createIndexes();
                const count = await model.countDocuments();
                console.log(`✅ ${name}: ${count} documents`);
            } catch (error) {
                console.error(`❌ ${name}:`, error.message);
            }
        }
        
        // List final collections
        const finalCollections = await db.listCollections().toArray();
        console.log('\n📋 Final collections:', finalCollections.map(c => c.name));
        
        console.log('\n✅ Database initialization complete!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Disconnected from MongoDB');
    }
}

initializeDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
