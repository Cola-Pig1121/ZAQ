/**
 * 缓存管理工具
 * 用于在数据库更改后清除缓存，同时保留点赞状态
 */

import { cacheUtils } from './cache'

// 保留点赞状态并清除其他所有缓存
export function preserveLikesAndClearCache() {
  try {
    // 1. 保存点赞状态
    const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '{}')
    
    // 2. 清除所有缓存
    cacheUtils.clearAll()
    
    // 3. 恢复点赞状态
    localStorage.setItem('likedPosts', JSON.stringify(likedPosts))
    
    console.log('已清除所有缓存，并保留点赞状态')
  } catch (error) {
    console.error('清除缓存时出错:', error)
  }
}

// 清除特定类型的缓存，同时保留点赞状态
export function preserveLikesAndClearSpecificCache(cacheKeys: string[]) {
  try {
    // 1. 保存点赞状态
    const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '{}')
    
    // 2. 清除指定的缓存
    cacheKeys.forEach(key => {
      localStorage.removeItem(key)
    })
    
    // 3. 恢复点赞状态
    localStorage.setItem('likedPosts', JSON.stringify(likedPosts))
    
    console.log(`已清除指定缓存 [${cacheKeys.join(', ')}]，并保留点赞状态`)
  } catch (error) {
    console.error('清除指定缓存时出错:', error)
  }
}

// 数据库操作后调用此函数
export function afterDatabaseOperation(operationType: 'create' | 'update' | 'delete', dataType: 'post' | 'comment' | 'profile' | 'media') {
  console.log(`数据库操作: ${operationType} ${dataType}`)
  
  // 根据操作类型和数据类型决定清除哪些缓存
  const cacheKeysToClear = []
  
  // 帖子相关的操作会影响帖子缓存
  if (dataType === 'post') {
    cacheKeysToClear.push('posts')
  }
  
  // 评论相关的操作会影响帖子缓存（因为评论是帖子的一部分）
  if (dataType === 'comment') {
    cacheKeysToClear.push('posts')
  }
  
  // 用户资料相关的操作会影响用户资料缓存
  if (dataType === 'profile') {
    cacheKeysToClear.push('profile')
  }
  
  // 媒体文件相关的操作会影响媒体文件缓存
  if (dataType === 'media') {
    cacheKeysToClear.push('mediaFiles')
  }
  
  // 如果有特定的缓存需要清除，使用特定清除方法
  if (cacheKeysToClear.length > 0) {
    preserveLikesAndClearSpecificCache(cacheKeysToClear)
  } else {
    // 否则清除所有缓存
    preserveLikesAndClearCache()
  }
}