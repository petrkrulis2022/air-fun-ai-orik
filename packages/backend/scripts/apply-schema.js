#!/usr/bin/env node
/**
 * Database Schema Application Script
 *
 * This script helps apply the database schema to Supabase.
 * It reads the schema.sql file and provides instructions for applying it.
 *
 * Usage: node scripts/apply-schema.js
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log("\n=== air.fun Database Schema Setup ===\n");

// Read schema file
const schemaPath = join(__dirname, "../src/db/schema.sql");
const schema = readFileSync(schemaPath, "utf-8");

// Read seed file
const seedPath = join(__dirname, "../src/db/seed-agent-templates.sql");
const seedSql = readFileSync(seedPath, "utf-8");

console.log("Schema file loaded successfully!");
console.log(`Schema size: ${schema.length} characters`);
console.log(`Seed file size: ${seedSql.length} characters\n`);

console.log("To apply the schema to your Supabase database:\n");
console.log("1. Go to https://app.supabase.com");
console.log("2. Select your project");
console.log("3. Navigate to SQL Editor (left sidebar)");
console.log("4. Copy and paste the schema SQL below");
console.log('5. Click "Run" to execute\n');

console.log("=== SCHEMA SQL (Copy this) ===\n");
console.log(schema);
console.log("\n=== END SCHEMA SQL ===\n");

console.log("After applying the schema, seed the agent templates:\n");
console.log("=== SEED SQL (Copy this) ===\n");
console.log(seedSql);
console.log("\n=== END SEED SQL ===\n");

console.log("Once complete, run tests with: npm test\n");
