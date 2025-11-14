import { supabase } from './supabase'
import { getUserIP } from './ip-utils'
import { cacheUtils, CACHE_KEYS } from './cache'
import { afterDatabaseOperation } from './cache-manager'

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
  author_name: string
  dis_id?: number | null // 用于标识父评论的ID，null表示顶级评论
  ip?: string
}

export interface CreatePostData {
  content: string
  images?: string[]
}

// 获取所有帖子（使用缓存）
export async function getAllPosts(): Promise<Post[]> {
  // 尝试从缓存获取数据
  const cachedPosts = cacheUtils.getPosts()
  if (cachedPosts) {
    console.log('从缓存获取帖子数据')
    // 将缓存数据转换为Post格式返回
    return cachedPosts as Post[]
  }

  console.log('从数据库获取帖子数据')
  // 获取所有帖子
  const { data: posts, error: postsError } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })

  if (postsError) {
    console.error('获取帖子失败:', postsError)
    throw postsError
  }

  // 获取ID为1的用户信息作为作者
  const { data: authorProfile, error: authorError } = await supabase
    .from('profile')
    .select('name')
    .eq('id', 1)
    .single()

  if (authorError) {
    console.error('获取作者信息失败:', authorError)
    throw authorError
  }

  // 获取所有评论
  const { data: allComments, error: commentsError } = await supabase
    .from('discussions')
    .select('*')
    .order('created_at', { ascending: true })

  if (commentsError) {
    console.error('获取评论失败:', commentsError)
    throw commentsError
  }

  // 为每个帖子添加作者信息和评论
  const postsWithDetails = (posts || []).map(post => ({
    ...post,
    author: authorProfile?.name || '未知作者',
    comments: (allComments || []).filter(comment => comment.post_id === post.id)
  }))

  // 缓存数据
  cacheUtils.setPosts(postsWithDetails as any[])

  return postsWithDetails
}

// 获取单个帖子
export async function getPostById(id: number): Promise<Post | null> {
  // 获取帖子信息
  const { data: post, error: postError } = await supabase
    .from('posts')
    .select('*')
    .eq('id', id)
    .single()

  if (postError) {
    console.error('获取帖子失败:', postError)
    throw postError
  }

  if (!post) {
    return null
  }

  // 获取ID为1的用户信息作为作者
  const { data: authorProfile, error: authorError } = await supabase
    .from('profile')
    .select('name')
    .eq('id', 1)
    .single()

  if (authorError) {
    console.error('获取作者信息失败:', authorError)
    throw authorError
  }

  // 获取评论信息
  // 第一类：post_id等于当前id的评论
  const { data: comments, error: commentsError } = await supabase
    .from('discussions')
    .select('*')
    .eq('post_id', id)
    .order('created_at', { ascending: true })

  if (commentsError) {
    console.error('获取评论失败:', commentsError)
    throw commentsError
  }

  // 构建包含作者和评论的帖子对象
  const postWithDetails: Post = {
    ...post,
    author: authorProfile?.name || '未知作者',
    comments: comments || []
  }

  return postWithDetails
}

// 创建新帖子（并更新缓存）
export async function createPost(postData: CreatePostData): Promise<Post> {
  const { data, error } = await supabase
    .from('posts')
    .insert({
      content: postData.content,
      images: postData.images || [],
      thumbs: 0
    })
    .select()
    .single()

  if (error) {
    console.error('创建帖子失败:', error)
    throw error
  }

  // 获取作者信息
  const { data: authorProfile } = await supabase
    .from('profile')
    .select('name')
    .eq('id', 1)
    .single()

  // 创建新帖子对象
  const newPost: Post = {
    ...data,
    author: authorProfile?.name || '未知作者',
    comments: []
  }

  // 使用新的缓存管理系统
  afterDatabaseOperation('create', 'post')

  console.log('创建帖子成功，已清除缓存并保留点赞状态')
  return newPost
}

// 更新帖子
export async function updatePost(id: number, postData: Partial<CreatePostData>): Promise<Post> {
  const { data, error } = await supabase
    .from('posts')
    .update(postData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('更新帖子失败:', error)
    throw error
  }

  return data
}

// 删除帖子
export async function deletePost(id: string): Promise<boolean> {
  try {
    // 先获取帖子信息，以便删除相关的图片
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('images')
      .eq('id', id)
      .single()
    
    if (fetchError) throw fetchError
    
    // 删除帖子
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    
    // 如果帖子有图片，从Storage中删除
    if (post.images && post.images.length > 0) {
      for (const imageUrl of post.images) {
        try {
          // 从URL中提取文件路径和文件名
          const urlParts = imageUrl.split('/')
          // URL格式: https://xxx.supabase.co/storage/v1/object/public/media/folder/filename
          // 我们需要提取folder/filename部分
          const pathParts = urlParts.slice(urlParts.indexOf('media') + 1)
          const filePath = pathParts.join('/')
          
          // 从Storage中删除文件
          await supabase.storage
            .from('media')
            .remove([filePath])
        } catch (storageError) {
          console.error("删除图片失败:", storageError)
          // 即使删除图片失败，也不影响删除帖子的操作
        }
      }
    }
    
    // 使用新的缓存管理系统
    afterDatabaseOperation('delete', 'post')
    
    console.log('删除帖子成功，已清除缓存并保留点赞状态')
    return true
  } catch (error) {
    console.error("删除帖子失败:", error)
    return false
  }
}

// 点赞帖子
export async function likePost(id: number): Promise<Post> {
  // 先获取当前点赞数
  const { data: currentPost, error: fetchError } = await supabase
    .from('posts')
    .select('thumbs')
    .eq('id', id)
    .single()

  if (fetchError) {
    console.error('获取帖子失败:', fetchError)
    throw fetchError
  }

  // 更新点赞数
  const { data, error } = await supabase
    .from('posts')
    .update({ thumbs: currentPost.thumbs + 1 })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('点赞失败:', error)
    throw error
  }

  return data
}

// 创建评论
export async function createComment(postId: number, content: string, authorName: string, parentId?: number): Promise<Comment> {
  try {
    // 获取用户IP
    const userIP = await getUserIP()
    
    const { data, error } = await supabase
      .from('discussions')
      .insert({
        content,
        post_id: postId,
        author_name: authorName,
        dis_id: parentId || null,
        ip: userIP || 'unknown'
      })
      .select()
      .single()

    if (error) {
      console.error('创建评论失败:', error.message || error, '详细信息:', error)
      throw error
    }

    // 使用新的缓存管理系统
    afterDatabaseOperation('create', 'comment')

    return data
  } catch (error) {
    console.error('创建评论异常:', (error as Error).message || error, '详细信息:', error)
    throw error
  }
}

// 删除评论
export async function deleteComment(commentId: number): Promise<void> {
  // 先删除所有子评论
  const { data: childComments, error: fetchError } = await supabase
    .from('discussions')
    .select('id')
    .eq('dis_id', commentId)

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
    .eq('id', commentId)

  if (error) {
    console.error('删除评论失败:', error)
    throw error
  }

  // 使用新的缓存管理系统
  afterDatabaseOperation('delete', 'comment')
}

// 取消点赞帖子
export async function unlikePost(id: number): Promise<Post> {
  // 先获取当前点赞数
  const { data: currentPost, error: fetchError } = await supabase
    .from('posts')
    .select('thumbs')
    .eq('id', id)
    .single()

  if (fetchError) {
    console.error('获取帖子失败:', fetchError)
    throw fetchError
  }

  // 确保点赞数不会小于0
  const newThumbsCount = Math.max(0, currentPost.thumbs - 1)

  // 更新点赞数
  const { data, error } = await supabase
    .from('posts')
    .update({ thumbs: newThumbsCount })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('取消点赞失败:', error)
    throw error
  }

  return data
}