/* eslint-disable @typescript-eslint/no-explicit-any -- no generated DB types; admin client is deliberately untyped */
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

let adminClient: SupabaseClient<any> | null = null

export function createAdminClient(): SupabaseClient<any> {
  if (adminClient) return adminClient
  adminClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  )
  return adminClient
}