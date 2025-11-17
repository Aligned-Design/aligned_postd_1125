import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Database types for type safety
export type Database = {
  public: {
    Tables: {
      brands: {
        Row: {
          id: string
          name: string
          description: string | null
          logo_url: string | null
          website: string | null
          industry: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          logo_url?: string | null
          website?: string | null
          industry?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          logo_url?: string | null
          website?: string | null
          industry?: string | null
          updated_at?: string
        }
      }
      content: {
        Row: {
          id: string
          brand_id: string
          title: string
          content: string
          platform: string
          status: 'draft' | 'pending' | 'approved' | 'published'
          scheduled_for: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          brand_id: string
          title: string
          content: string
          platform: string
          status?: 'draft' | 'pending' | 'approved' | 'published'
          scheduled_for?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          brand_id?: string
          title?: string
          content?: string
          platform?: string
          status?: 'draft' | 'pending' | 'approved' | 'published'
          scheduled_for?: string | null
          updated_at?: string
        }
      }
    }
  }
}
