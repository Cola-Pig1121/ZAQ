// localStorage缓存管理系统
export interface CacheItem<T> {
  data: T
  timestamp: number
  expiresAt: number
}

// 统一的MediaFile接口定义
export interface MediaFile {
  id: string
  name: string
  url: string
  size: number
  type: string
  category: string
  created_at: string
}

export interface CachedPost {
  id: number
  created_at: string
  content: string | null
  thumbs: number
  images: string[] | null
  author?: string
  comments?: CachedComment[]
}

export interface CachedComment {
  id: number
  created_at: string
  content: string
  post_id: number
  author_name: string
  dis_id?: number | null
  ip?: string
}

// 统一的MediaCategory接口定义
export interface MediaCategory {
  id: string
  name: string
}

// 缓存配置
const CACHE_CONFIG = {
  posts: { duration: 5 * 60 * 1000 }, // 5分钟
  mediaFiles: { duration: 10 * 60 * 1000 }, // 10分钟
  comments: { duration: 5 * 60 * 1000 }, // 5分钟
  mediaCategories: { duration: 10 * 60 * 1000 }, // 10分钟
}

class LocalCache {
  private storage: Storage

  constructor() {
    // 检查是否在浏览器环境中
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      this.storage = localStorage
    } else {
      // 在服务端渲染环境中使用模拟的Storage
      this.storage = {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
        clear: () => {},
        length: 0,
        key: () => null,
      } as unknown as Storage
    }
  }

  // 设置缓存
  set<T>(key: string, data: T, duration: number = 5 * 60 * 1000): void {
    const now = Date.now()
    const cacheItem: CacheItem<T> = {
      data,
      timestamp: now,
      expiresAt: now + duration
    }
    
    try {
      this.storage.setItem(key, JSON.stringify(cacheItem))
    } catch (error) {
      console.warn('缓存写入失败:', error)
    }
  }

  // 获取缓存
  get<T>(key: string): T | null {
    try {
      const item = this.storage.getItem(key)
      if (!item) return null

      const cacheItem: CacheItem<T> = JSON.parse(item)
      const now = Date.now()

      // 检查是否过期
      if (now > cacheItem.expiresAt) {
        this.remove(key)
        return null
      }

      return cacheItem.data
    } catch (error) {
      console.warn('缓存读取失败:', error)
      return null
    }
  }

  // 移除缓存
  remove(key: string): void {
    try {
      this.storage.removeItem(key)
    } catch (error) {
      console.warn('缓存移除失败:', error)
    }
  }

  // 清空所有缓存
  clear(): void {
    try {
      this.storage.clear()
    } catch (error) {
      console.warn('缓存清空失败:', error)
    }
  }

  // 检查缓存是否存在且有效
  has(key: string): boolean {
    return this.get(key) !== null
  }

  // 获取缓存的创建时间
  getTimestamp(key: string): number | null {
    try {
      const item = this.storage.getItem(key)
      if (!item) return null

      const cacheItem: CacheItem<any> = JSON.parse(item)
      return cacheItem.timestamp
    } catch (error) {
      console.warn('获取缓存时间戳失败:', error)
      return null
    }
  }

  // 更新缓存中的特定项目
  updateItem<T>(key: string, updater: (item: T) => T): void {
    const cached = this.get<T>(key)
    if (cached) {
      const updated = updater(cached)
      this.set(key, updated)
    }
  }
}

// 创建缓存实例
export const cache = new LocalCache()

// 缓存键名常量
export const CACHE_KEYS = {
  POSTS: 'cache_posts',
  MEDIA_FILES: 'cache_media_files',
  MEDIA_CATEGORIES: 'cache_media_categories',
  COMMENTS: 'cache_comments',
} as const

// 缓存工具函数
export const cacheUtils = {
  // 缓存媒体文件
  setMediaFiles: (files: MediaFile[]) => {
    cache.set(CACHE_KEYS.MEDIA_FILES, files, CACHE_CONFIG.mediaFiles.duration)
  },

  // 获取媒体文件
  getMediaFiles: (): MediaFile[] | null => {
    return cache.get<MediaFile[]>(CACHE_KEYS.MEDIA_FILES)
  },

  // 缓存媒体分类
  setMediaCategories: (categories: MediaCategory[]) => {
    cache.set(CACHE_KEYS.MEDIA_CATEGORIES, categories, CACHE_CONFIG.mediaCategories.duration)
  },

  // 获取媒体分类
  getMediaCategories: (): MediaCategory[] | null => {
    return cache.get<MediaCategory[]>(CACHE_KEYS.MEDIA_CATEGORIES)
  },

  // 缓存帖子
  setPosts: (posts: CachedPost[]) => {
    cache.set(CACHE_KEYS.POSTS, posts, CACHE_CONFIG.posts.duration)
  },

  // 获取帖子
  getPosts: (): CachedPost[] | null => {
    return cache.get<CachedPost[]>(CACHE_KEYS.POSTS)
  },

  // 缓存评论
  setComments: (comments: CachedComment[]) => {
    cache.set(CACHE_KEYS.COMMENTS, comments, CACHE_CONFIG.comments.duration)
  },

  // 获取评论
  getComments: (): CachedComment[] | null => {
    return cache.get<CachedComment[]>(CACHE_KEYS.COMMENTS)
  },

  // 清空所有缓存
  clearAll: () => {
    cache.clear()
  },

  // 根据URL获取媒体文件名
  getMediaFileNameByUrl: (url: string): string | undefined => {
    const files = cacheUtils.getMediaFiles()
    if (!files) return undefined
    
    const file = files.find(f => f.url === url)
    return file?.name
  },

  // 更新缓存中的媒体文件
  updateMediaFileInCache: (updatedFile: MediaFile) => {
    const files = cacheUtils.getMediaFiles()
    if (files) {
      const index = files.findIndex(f => f.id === updatedFile.id)
      if (index !== -1) {
        files[index] = updatedFile
        cacheUtils.setMediaFiles(files)
      }
    }
  },

  // 从缓存中删除媒体文件
  removeMediaFileFromCache: (fileId: string) => {
    const files = cacheUtils.getMediaFiles()
    if (files) {
      const filtered = files.filter(f => f.id !== fileId)
      cacheUtils.setMediaFiles(filtered)
    }
  },

  // 添加新的媒体文件到缓存
  addMediaFileToCache: (newFile: MediaFile) => {
    const files = cacheUtils.getMediaFiles()
    if (files) {
      files.unshift(newFile) // 添加到开头
      cacheUtils.setMediaFiles(files)
    }
  }
}