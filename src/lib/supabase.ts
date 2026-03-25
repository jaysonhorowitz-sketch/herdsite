import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Issue = {
  id: string
  created_at: string
  title: string
  slug: string
  category: string
  date: string
  severity_score: number
  severity_label: string
  description: string
  actions: { text: string; effort: string; url: string }[]
  sources: { label: string; url: string }[]
  is_published: boolean
}
