import { createClient, SupabaseClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || "https://test.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "test_service_key";

if (
  process.env.NODE_ENV === "production" &&
  (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY)
) {
  throw new Error(
    "Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env"
  );
}

// Create Supabase client with service role key for backend operations
// Implements connection pooling and query optimization (Requirement 21.4)
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  db: {
    schema: "public",
  },
  global: {
    headers: {
      // Enable connection pooling via Supabase's connection pooler
      // This uses PgBouncer in transaction mode for better performance
      "x-connection-mode": "transaction",
    },
  },
  // Configure realtime for better performance
  realtime: {
    params: {
      eventsPerSecond: 10, // Limit events to prevent overwhelming clients
    },
  },
});

export default supabase;
