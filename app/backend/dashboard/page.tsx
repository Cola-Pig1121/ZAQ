"use client"

import { useState, useEffect } from "react"
import ProtectedRoute from "@/components/protected-route"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getCurrentUser, logout } from "@/lib/auth"
import { Icon } from '@iconify/react'
import Link from "next/link"
import { useRouter } from "next/navigation"
import PostManager from "@/components/post-manager"
import { MediaLibrary } from "@/components/media-library"
import UserProfile from "@/components/user-profile"

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("posts")
  const [isInitializing, setIsInitializing] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const initializeApp = async () => {
      try {
        
        // 获取当前用户
        const currentUser = getCurrentUser()
        console.log("当前用户:", currentUser)
        
        if (!currentUser) {
          console.log("未找到当前用户，重定向到登录页面")
          router.push("/backend")
          return
        }
        
        setUser(currentUser)
      } catch (error) {
        console.error("初始化应用失败:", error)
      } finally {
        setIsInitializing(false)
      }
    }
    
    initializeApp()
  }, [])

  const handleLogout = () => {
    logout()
    router.push("/backend")
  }

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">正在初始化系统...</p>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* 顶部导航栏 */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                <Icon icon="lucide:layout-dashboard" className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                后台管理系统
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
                  <Icon icon="lucide:user" className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-slate-700">
                  {user?.name || "管理员"}
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout} className="flex items-center space-x-1">
                <Icon icon="lucide:log-out" className="w-4 h-4" />
                <span>退出</span>
              </Button>
              <Link href="/">
                <Button variant="outline" size="sm" className="flex items-center space-x-1">
                  <Icon icon="lucide:home" className="w-4 h-4" />
                  <span>首页</span>
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* 主要内容区域 */}
        <main className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* 侧边栏 */}
            <div className="lg:col-span-1">
              <Card className="bg-white/80 backdrop-blur-md border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">功能菜单</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <nav className="space-y-1 p-4">
                    <Button
                      variant={activeTab === "posts" ? "default" : "ghost"}
                      className="w-full justify-start"
                      size="sm"
                      onClick={() => setActiveTab("posts")}
                    >
                      <Icon icon="lucide:file-text" className="w-4 h-4 mr-2" />
                      内容管理
                    </Button>
                    <Button
                      variant={activeTab === "media" ? "default" : "ghost"}
                      className="w-full justify-start"
                      size="sm"
                      onClick={() => setActiveTab("media")}
                    >
                      <Icon icon="lucide:image" className="w-4 h-4 mr-2" />
                      媒体库
                    </Button>
                    <Button
                      variant={activeTab === "profile" ? "default" : "ghost"}
                      className="w-full justify-start"
                      size="sm"
                      onClick={() => setActiveTab("profile")}
                    >
                      <Icon icon="lucide:user" className="w-4 h-4 mr-2" />
                      个人资料
                    </Button>
                    <Button
                      variant={activeTab === "settings" ? "default" : "ghost"}
                      className="w-full justify-start"
                      size="sm"
                      onClick={() => setActiveTab("settings")}
                    >
                      <Icon icon="lucide:settings" className="w-4 h-4 mr-2" />
                      系统设置
                    </Button>
                  </nav>
                </CardContent>
              </Card>
            </div>

            {/* 主要内容 */}
            <div className="lg:col-span-3">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="posts">内容管理</TabsTrigger>
                  <TabsTrigger value="media">媒体库</TabsTrigger>
                  <TabsTrigger value="profile">个人资料</TabsTrigger>
                  <TabsTrigger value="settings">系统设置</TabsTrigger>
                </TabsList>

                <TabsContent value="posts" className="mt-6">
                  <PostManager />
                </TabsContent>

                <TabsContent value="media" className="mt-6">
                  <MediaLibrary />
                </TabsContent>

                <TabsContent value="profile" className="mt-6">
                  <UserProfile />
                </TabsContent>

                {/* <TabsContent value="settings" className="mt-6">
                  <Card className="bg-white/80 backdrop-blur-md border-slate-200 shadow-sm">
                    <CardHeader>
                      <CardTitle>系统设置</CardTitle>
                      <CardDescription>管理系统配置和设置</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <p>系统设置功能正在开发中...</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent> */}
              </Tabs>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}