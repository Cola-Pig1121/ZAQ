"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Icon } from '@iconify/react'
import { login } from "@/lib/auth"
import { metadata } from "../layout"

export default function BackendLogin() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const result = await login(username, password)

      if (result.success) {
        console.log("登录成功，准备跳转到仪表板")
        // 登录成功，跳转到仪表板
        router.push("/backend/dashboard")
      } else {
        // 登录失败，显示错误信息
        setError(result.error || "登录失败")
      }
    } catch (error) {
      console.error("Login error:", error)
      setError("登录过程中发生错误")
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Icon icon="lucide:lock" className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">后台管理</h1>
          <p className="text-slate-600">管理后台</p>
        </div>

        {/* Login Form */}
        <div className="glass rounded-2xl p-8 shadow-xl border border-white/30">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-2">
                用户名
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Icon icon="lucide:user" className="w-5 h-5 text-slate-400" />
                </div>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
                  placeholder="请输入用户名"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                密码
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Icon icon="lucide:lock" className="w-5 h-5 text-slate-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
                  placeholder="请输入密码"
                  required
                />
              </div>
            </div>



            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center">
                  <Icon icon="lucide:alert-circle" className="w-5 h-5 text-red-500 mr-2" />
                  <span className="text-red-700 text-sm">{error}</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 px-4 rounded-xl hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <Icon icon="lucide:loader" className="w-5 h-5 mr-2 animate-spin" />
                  登录中...
                </>
              ) : (
                <>
                  <Icon icon="lucide:log-in" className="w-5 h-5 mr-2" />
                  登录
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500">
              请输入您的用户名和密码
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <a href="/" className="text-slate-500 hover:text-slate-700 text-sm flex items-center justify-center">
            <Icon icon="lucide:home" className="w-4 h-4 mr-1" />
            返回首页
          </a>
        </div>
      </div>
    </div>
  )
}