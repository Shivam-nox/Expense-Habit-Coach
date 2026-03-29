import { config } from 'dotenv';
// MUST be called before you use process.env!
config(); 

import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

// Sanity check: This will print to your terminal so you KNOW it's loaded
console.log("Database URL loaded:", process.env.DATABASE_URL ? "YES" : "NO");

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing! Check your .env file.");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Neon often requires this specific SSL object rather than just 'true'
  ssl: {
    rejectUnauthorized: false 
  }
});

export const db = drizzle(pool, { schema });