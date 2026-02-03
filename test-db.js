const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// 1. Read .env.local manually to ensure we test EXACTLY what is in the file
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const match = envContent.match(/MONGODB_URI=(.*)/);
const uri = match ? match[1].trim() : null;

console.log('--- MongoDB Connection Test ---');
console.log(`Reading URI from: ${envPath}`);

if (!uri) {
    console.error('ERROR: Could not find MONGODB_URI in .env.local');
    process.exit(1);
}

// Mask password for output
const maskedUri = uri.replace(/:([^:@]+)@/, ':****@');
console.log(`Testing Connection to: ${maskedUri}`);

async function testConnection() {
    try {
        console.log('Attempting to connect...');
        await mongoose.connect(uri);
        console.log('✅ Connection Successful!');

        const state = mongoose.connection.readyState;
        console.log(`Connection State: ${state} (1 = connected)`);

        console.log('Listing Collections...');
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Collections found:', collections.map(c => c.name));

        console.log('✅ Test Passed. Database credentials are correct.');
    } catch (error) {
        console.error('❌ Connection Failed:', error.message);
        if (error.cause) console.error('Cause:', error.cause);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected.');
    }
}

testConnection();
