// 认证工具函数
import { profileService } from './database'

export const AUTH_KEY = "backend_auth"
export const AUTH_USER_KEY = "auth_user"
export const AUTH_TIME_KEY = "auth_time"
export const AUTH_DURATION = 24 * 60 * 60 * 1000 // 24小时

// 检查是否已登录
export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false
  
  const auth = localStorage.getItem(AUTH_KEY)
  const authTime = localStorage.getItem(AUTH_TIME_KEY)
  
  if (!auth || !authTime) return false
  
  // 检查是否过期
  const timeDiff = Date.now() - parseInt(authTime)
  if (timeDiff > AUTH_DURATION) {
    logout()
    return false
  }
  
  return true
}

// 获取当前登录用户信息
export function getCurrentUser(): { id: number; name: string } | null {
  if (typeof window === "undefined") return null
  
  const userStr = localStorage.getItem(AUTH_USER_KEY)
  if (!userStr) return null
  
  try {
    return JSON.parse(userStr)
  } catch {
    return null
  }
}

// 登录 - 需要用户名和密码验证
export async function login(username: string, password: string): Promise<{ success: boolean; user?: { id: number; name: string }; error?: string }> {
  try {
    // 验证用户名和密码
    const user = await profileService.validateUser(username, password)
    
    if (!user) {
      return { success: false, error: "用户名或密码错误" }
    }
    
    // 登录成功，存储会话
    localStorage.setItem(AUTH_KEY, "true")
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify({ id: user.id, name: user.name || username }))
    localStorage.setItem(AUTH_TIME_KEY, Date.now().toString())
    
    console.log("登录成功，用户信息:", { id: user.id, name: user.name || username })
    
    return { success: true, user: { id: user.id, name: user.name || username } }
  } catch (error) {
    console.error('Login error:', error)
    return { success: false, error: "登录过程中发生错误" }
  }
}

// 登出
export function logout(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(AUTH_KEY)
  localStorage.removeItem(AUTH_USER_KEY)
  localStorage.removeItem(AUTH_TIME_KEY)
}

// 获取认证头部
export function getAuthHeaders() {
  return {
    'Authorization': `Bearer ${localStorage.getItem(AUTH_KEY) || ''}`
  }
}