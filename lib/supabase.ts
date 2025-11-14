import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 数据库类型定义
export interface Profile {
  id: number
  name: string | null
  pwd: string | null
  avatar: string | null
  birth: string | null
  created_at?: string
}

export interface Post {
  id: number
  created_at: string
  content: string | null
  thumbs: number
  images: string[] | null
  author?: string // 从 profile 表获取的作者名称
  comments?: Comment[] // 从 discussions 表获取的评论
}

export interface Comment {
  id: number
  created_at: string
  content: string
  post_id: number
  dis_id?: number | null // 用于标识父评论的ID，null表示顶级评论
}

export interface Discussion {
  id: number
  created_at: string
  content: string | null
  post_id: number | null
  dis_id?: number | null // 用于标识父评论的ID，null表示顶级评论
}