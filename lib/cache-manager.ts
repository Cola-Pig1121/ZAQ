/**
 * 简化的缓存管理工具
 * 仅保留点赞状态和登录状态的管理
 */

import { likeCache, authCache } from './cache'

// 保留点赞状态并清除其他所有缓存（现在是空操作）
export function preserveLikesAndClearCache() {
  console.log('缓存系统已简化，仅保留点赞和登录状态')
  // 由于我们已经移除了其他缓存，这里不需要做任何操作
  // 点赞状态和登录状态会自动保留
}

// 清除特定类型的缓存，同时保留点赞状态（现在是空操作）
export function preserveLikesAndClearSpecificCache(cacheKeys: string[]) {
  console.log(`缓存系统已简化，仅保留点赞和登录状态。尝试清除缓存键: [${cacheKeys.join(', ')}]`)
  // 由于我们已经移除了其他缓存，这里不需要做任何操作
  // 点赞状态和登录状态会自动保留
}

// 数据库操作后调用此函数（现在是空操作）
export function afterDatabaseOperation(operationType: 'create' | 'update' | 'delete', dataType: 'post' | 'comment' | 'profile' | 'media') {
  console.log(`数据库操作: ${operationType} ${dataType}`)
  console.log('缓存系统已简化，无需清除缓存')
  // 由于我们已经移除了其他缓存，这里不需要做任何操作
  // 点赞状态和登录状态会自动保留
}

// 点赞状态管理
export const likeManager = {
  // 获取所有点赞状态
  getAllLikedPosts: () => likeCache.getLikedPosts(),
  
  // 检查帖子是否被点赞
  isPostLiked: (postId: string) => likeCache.isPostLiked(postId),
  
  // 切换点赞状态
  toggleLike: (postId: string) => likeCache.toggleLike(postId),
  
  // 设置点赞状态
  setLikeStatus: (postId: string, isLiked: boolean) => likeCache.setLikedPost(postId, isLiked),
  
  // 清除所有点赞状态
  clearAllLikes: () => likeCache.clearLikedPosts()
}

// 登录状态管理
export const authManager = {
  // 获取认证信息
  getAuth: () => authCache.getAuth(),
  
  // 设置认证信息
  setAuth: (authData: any) => authCache.setAuth(authData),
  
  // 获取用户信息
  getUser: () => authCache.getUser(),
  
  // 设置用户信息
  setUser: (userData: any) => authCache.setUser(userData),
  
  // 获取登录时间
  getAuthTime: () => authCache.getAuthTime(),
  
  // 设置登录时间
  setAuthTime: (time: number) => authCache.setAuthTime(time),
  
  // 清除所有登录状态
  clearAuth: () => authCache.clearAuth()
}