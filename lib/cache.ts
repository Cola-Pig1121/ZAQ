/**
 * 简化的缓存系统 - 仅保留点赞状态和登录状态缓存
 */

// 点赞状态缓存键
const LIKED_POSTS_KEY = 'likedPosts'

// 登录状态相关键
const AUTH_KEY = 'auth'
const AUTH_USER_KEY = 'auth_user'
const AUTH_TIME_KEY = 'auth_time'

// 点赞状态缓存操作
export const likeCache = {
  // 获取所有点赞状态
  getLikedPosts: (): Record<string, boolean> => {
    try {
      return JSON.parse(localStorage.getItem(LIKED_POSTS_KEY) || '{}')
    } catch (error) {
      console.error('获取点赞状态失败:', error)
      return {}
    }
  },

  // 设置点赞状态
  setLikedPost: (postId: string, isLiked: boolean): void => {
    try {
      const likedPosts = likeCache.getLikedPosts()
      likedPosts[postId] = isLiked
      localStorage.setItem(LIKED_POSTS_KEY, JSON.stringify(likedPosts))
    } catch (error) {
      console.error('设置点赞状态失败:', error)
    }
  },

  // 获取特定帖子的点赞状态
  isPostLiked: (postId: string): boolean => {
    const likedPosts = likeCache.getLikedPosts()
    return likedPosts[postId] || false
  },

  // 切换点赞状态
  toggleLike: (postId: string): boolean => {
    const currentStatus = likeCache.isPostLiked(postId)
    const newStatus = !currentStatus
    likeCache.setLikedPost(postId, newStatus)
    return newStatus
  },

  // 清除所有点赞状态
  clearLikedPosts: (): void => {
    try {
      localStorage.removeItem(LIKED_POSTS_KEY)
    } catch (error) {
      console.error('清除点赞状态失败:', error)
    }
  }
}

// 登录状态缓存操作
export const authCache = {
  // 获取认证信息
  getAuth: (): any => {
    try {
      return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null')
    } catch (error) {
      console.error('获取认证信息失败:', error)
      return null
    }
  },

  // 设置认证信息
  setAuth: (authData: any): void => {
    try {
      localStorage.setItem(AUTH_KEY, JSON.stringify(authData))
    } catch (error) {
      console.error('设置认证信息失败:', error)
    }
  },

  // 获取用户信息
  getUser: (): any => {
    try {
      return JSON.parse(localStorage.getItem(AUTH_USER_KEY) || 'null')
    } catch (error) {
      console.error('获取用户信息失败:', error)
      return null
    }
  },

  // 设置用户信息
  setUser: (userData: any): void => {
    try {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData))
    } catch (error) {
      console.error('设置用户信息失败:', error)
    }
  },

  // 获取登录时间
  getAuthTime: (): number | null => {
    try {
      const time = localStorage.getItem(AUTH_TIME_KEY)
      return time ? parseInt(time, 10) : null
    } catch (error) {
      console.error('获取登录时间失败:', error)
      return null
    }
  },

  // 设置登录时间
  setAuthTime: (time: number): void => {
    try {
      localStorage.setItem(AUTH_TIME_KEY, time.toString())
    } catch (error) {
      console.error('设置登录时间失败:', error)
    }
  },

  // 清除所有登录状态
  clearAuth: (): void => {
    try {
      localStorage.removeItem(AUTH_KEY)
      localStorage.removeItem(AUTH_USER_KEY)
      localStorage.removeItem(AUTH_TIME_KEY)
    } catch (error) {
      console.error('清除登录状态失败:', error)
    }
  }
}

// 向后兼容的缓存工具对象
export const cacheUtils = {
  // 空操作，用于向后兼容
  setMediaFiles: () => {},
  getMediaFiles: () => null,
  setCategories: () => {},
  getCategories: () => null,
  setPosts: () => {},
  getPosts: () => null,
  setComments: () => {},
  getComments: () => null,
  clearAll: () => {
    // 清除所有缓存，但保留点赞和登录状态
    // 这里我们什么都不做，因为其他缓存已经被移除
    console.log('缓存系统已简化，仅保留点赞和登录状态')
  }
}

// 导出缓存键，用于向后兼容
export const CACHE_KEYS = {
  POSTS: 'posts',
  MEDIA_FILES: 'mediaFiles',
  MEDIA_CATEGORIES: 'mediaCategories',
  COMMENTS: 'comments'
}