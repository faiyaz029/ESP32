import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database.types"

// Create a single supabase client for server components
export const createServerClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL as string
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string

  return createClient<Database>(supabaseUrl, supabaseServiceKey)
}
