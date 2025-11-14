import { supabase, Profile, Post, Discussion } from './supabase'
import bcrypt from 'bcryptjs'
import { afterDatabaseOperation } from './cache-manager'

// 导出类型，以便其他组件可以使用
export type { Profile, Post, Discussion } from './supabase'

// Profile 相关操作
export const profileService = {
  // 获取用户资料
  async getProfile(id: number): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profile')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching profile:', error)
      return null
    }

    return data
  },

  // 通过用户名获取用户资料
  async getProfileByName(name: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profile')
      .select('*')
      .eq('name', name)
      .single()

    if (error) {
      console.error('Error fetching profile by name:', error)
      return null
    }

    return data
  },

  // 创建或更新用户资料
  async upsertProfile(profile: Partial<Profile> & { id?: number }): Promise<Profile | null> {
    // 如果是创建新用户且有密码，则对密码进行哈希处理
    if (profile.pwd && !profile.id) {
      const salt = await bcrypt.genSalt(10)
      profile.pwd = await bcrypt.hash(profile.pwd, salt)
    }

    const { data, error } = await supabase
      .from('profile')
      .upsert(profile)
      .select()
      .single()

    if (error) {
      console.error('Error upserting profile:', error)
      return null
    }

    // 使用新的缓存管理系统
    afterDatabaseOperation('update', 'profile')

    return data
  },

  // 验证用户密码
  async validateUser(name: string, password: string): Promise<Profile | null> {
    const profile = await this.getProfileByName(name)

    if (!profile || !profile.pwd) {
      return null
    }

    const isPasswordValid = await (password == profile.pwd)

    if (!isPasswordValid) {
      return null
    }

    return profile
  },

  // 更新用户密码
  async updatePassword(id: number, newPassword: string): Promise<boolean> {
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(newPassword, salt)

    const { error } = await supabase
      .from('profile')
      .update({ pwd: hashedPassword })
      .eq('id', id)

    if (error) {
      console.error('Error updating password:', error)
      return false
    }

    // 使用新的缓存管理系统
    afterDatabaseOperation('update', 'profile')

    return true
  },

  // 获取所有用户资料
  async getAllProfiles(): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profile')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching all profiles:', error)
      return []
    }

    return data || []
  },

  // 删除用户资料
  async deleteProfile(id: number): Promise<boolean> {
    const { error } = await supabase
      .from('profile')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting profile:', error)
      return false
    }

    // 使用新的缓存管理系统
    afterDatabaseOperation('delete', 'profile')

    return true
  }
}

// Post 相关操作
export const postService = {
  // 获取所有帖子
  async getPosts(): Promise<Post[]> {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching posts:', error)
      return []
    }

    return data || []
  },

  // 获取单个帖子
  async getPost(id: number): Promise<Post | null> {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching post:', error)
      return null
    }

    return data
  },

  // 创建新帖子
  async createPost(post: Omit<Post, 'id' | 'created_at' | 'thumbs'>): Promise<Post | null> {
    const { data, error } = await supabase
      .from('posts')
      .insert(post)
      .select()
      .single()

    if (error) {
      console.error('Error creating post:', error)
      return null
    }

    // 使用新的缓存管理系统
    afterDatabaseOperation('create', 'post')

    return data
  },

  // 更新帖子
  async updatePost(id: number, updates: Partial<Post>): Promise<Post | null> {
    const { data, error } = await supabase
      .from('posts')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating post:', error)
      return null
    }

    // 使用新的缓存管理系统
    afterDatabaseOperation('update', 'post')

    return data
  },

  // 删除帖子
  async deletePost(id: number): Promise<boolean> {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting post:', error)
      return false
    }

    // 使用新的缓存管理系统
    afterDatabaseOperation('delete', 'post')

    return true
  },

  // 点赞帖子
  async likePost(id: number): Promise<Post | null> {
    // 先获取当前点赞数
    const post = await this.getPost(id)
    if (!post) return null

    // 增加点赞数
    return this.updatePost(id, { thumbs: post.thumbs + 1 })
  },

  // 上传图片到Supabase Storage
  async uploadImage(file: File, bucketName: string = 'media'): Promise<string | null> {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      
      // 根据文件类型确定文件夹
      let folder = 'others'
      if (file.type.startsWith('image/')) {
        folder = 'images'
      } else if (file.type.startsWith('video/')) {
        folder = 'videos'
      } else if (file.type.startsWith('audio/')) {
        folder = 'audios'
      } else if (file.type.includes('pdf')) {
        folder = 'documents'
      }
      
      const filePath = `${folder}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file)

      if (uploadError) {
        console.error('Error uploading image:', uploadError)
        return null
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath)

      // 使用新的缓存管理系统
      afterDatabaseOperation('create', 'media')

      return publicUrl
    } catch (error) {
      console.error('Error in uploadImage:', error)
      return null
    }
  }
}

// Discussion 相关操作
export const discussionService = {
  // 获取所有讨论
  async getDiscussions(): Promise<Discussion[]> {
    const { data, error } = await supabase
      .from('discussions')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching discussions:', error)
      return []
    }

    return data || []
  },

  // 获取单个讨论
  async getDiscussion(id: number): Promise<Discussion | null> {
    const { data, error } = await supabase
      .from('discussions')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching discussion:', error)
      return null
    }

    return data
  },

  // 创建新讨论
  async createDiscussion(discussion: Omit<Discussion, 'id' | 'created_at'>): Promise<Discussion | null> {
    const { data, error } = await supabase
      .from('discussions')
      .insert(discussion)
      .select()
      .single()

    if (error) {
      console.error('Error creating discussion:', error)
      return null
    }

    // 使用新的缓存管理系统
    afterDatabaseOperation('create', 'comment')

    return data
  },

  // 更新讨论
  async updateDiscussion(id: number, updates: Partial<Discussion>): Promise<Discussion | null> {
    const { data, error } = await supabase
      .from('discussions')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating discussion:', error)
      return null
    }

    // 使用新的缓存管理系统
    afterDatabaseOperation('update', 'comment')

    return data
  },

  // 删除讨论
  async deleteDiscussion(id: number): Promise<boolean> {
    const { error } = await supabase
      .from('discussions')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting discussion:', error)
      return false
    }

    // 使用新的缓存管理系统
    afterDatabaseOperation('delete', 'comment')

    return true
  }
}

// 获取媒体库中的文件
export async function getMediaFiles(folder?: string): Promise<{name: string, url: string, type: string}[]> {
  try {
    // 如果指定了文件夹，只获取该文件夹中的文件
    const path = folder ? folder : ''
    
    const { data, error } = await supabase.storage
      .from('media')
      .list(path, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' }
      })
    
    if (error) throw error
    
    // 获取每个文件的公共URL
    const filesWithUrls = await Promise.all(
      (data || []).map(async (file) => {
        const { data: { publicUrl } } = supabase.storage
          .from('media')
          .getPublicUrl(folder ? `${folder}/${file.name}` : file.name)
        
        return {
          name: file.name,
          url: publicUrl,
          type: file.metadata?.mimetype || 'unknown'
        }
      })
    )
    
    // 使用新的缓存管理系统
    // 读取操作不需要清除缓存，所以不调用afterDatabaseOperation
    
    return filesWithUrls
  } catch (error) {
    console.error("获取媒体文件失败:", error)
    return []
  }
}

// 获取媒体库中的文件夹列表
export async function getMediaFolders(): Promise<string[]> {
  try {
    // 获取根目录下的所有文件夹
    const { data, error } = await supabase.storage
      .from('media')
      .list('', {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' }
      })
    
    if (error) throw error
    
    // 过滤出文件夹（没有id的项是文件夹）
    const folders = (data || [])
      .filter(item => !item.id)
      .map(item => item.name)
    
    // 使用新的缓存管理系统
    // 读取操作不需要清除缓存，所以不调用afterDatabaseOperation
    
    return folders
  } catch (error) {
    console.error("获取媒体文件夹失败:", error)
    return []
  }
}

// 删除媒体文件
export async function deleteMediaFile(fileName: string, folder?: string): Promise<boolean> {
  try {
    // 构建完整的文件路径
    const filePath = folder ? `${folder}/${fileName}` : fileName
    
    const { error } = await supabase.storage
      .from('media')
      .remove([filePath])
    
    if (error) throw error
    
    // 使用新的缓存管理系统
    afterDatabaseOperation('delete', 'media')
    
    return true
  } catch (error) {
    console.error("删除媒体文件失败:", error)
    return false
  }
}