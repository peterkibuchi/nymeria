import { db } from "~/server/db";
import { users } from "~/server/db/schema";

async function testDatabase() {
  try {
    console.log("Testing database connection...");
    
    // Try to query the users table
    const userCount = await db.select().from(users).limit(1);
    console.log("✅ Database connection successful!");
    console.log(`Users table exists, found ${userCount.length} users`);
    
    // List all tables
    const tables = await db.execute(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'nymeria_%'
    `);
    
    console.log("📋 Nymeria tables in database:");
    tables.forEach((table: any) => {
      console.log(`  - ${table.table_name}`);
    });
    
  } catch (error) {
    console.error("❌ Database test failed:", error);
  }
}

testDatabase().then(() => process.exit(0));
