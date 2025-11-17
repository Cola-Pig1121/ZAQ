import { supabase } from './supabase'

export interface Comment {
  id: number
  post_id: number
  dis_id: number
  content: string
  created_at: string
  author_name: string
  ip?: string
}

export interface CreateCommentData {
  post_id: number
  dis_id?: number
  content: string
  author_name: string
  ip?: string
}

// 获取某个帖子的所有评论
export async function getCommentsByPostId(postId: number): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('discussions')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('获取评论失败:', error)
    throw error
  }

  return (data || []) as Comment[]
}

// 创建新评论
export async function createComment(commentData: CreateCommentData): Promise<Comment> {
  const { data, error } = await supabase
    .from('discussions')
    .insert({
      post_id: commentData.post_id,
      dis_id: commentData.dis_id || 0,
      content: commentData.content,
      author_name: commentData.author_name,
      ip: commentData.ip || 'unknown'
    })
    .select()
    .single()

  if (error) {
    console.error('创建评论失败:', error)
    throw error
  }

  return data as Comment
}

// 更新评论
export async function updateComment(id: number, content: string): Promise<Comment> {
  const { data, error } = await supabase
    .from('discussions')
    .update({ content })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('更新评论失败:', error)
    throw error
  }

  return data as Comment
}

// 删除评论
export async function deleteComment(id: number): Promise<void> {
  // 先删除所有子评论
  const { data: childComments, error: fetchError } = await supabase
    .from('discussions')
    .select('id')
    .eq('dis_id', id)

  if (fetchError) {
    console.error('获取子评论失败:', fetchError)
    throw fetchError
  }

  // 如果有子评论，递归删除
  if (childComments && childComments.length > 0) {
    for (const childComment of childComments) {
      await deleteComment(childComment.id)
    }
  }

  // 删除当前评论
  const { error } = await supabase
    .from('discussions')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('删除评论失败:', error)
    throw error
  }
}