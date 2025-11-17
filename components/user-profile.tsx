"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { profileService } from "@/lib/database"
import { supabase } from "@/lib/supabase"
import { Icon } from '@iconify/react'
import { Profile } from "@/lib/supabase"

export default function UserProfile() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false)
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false)
  const [previewImageUrl, setPreviewImageUrl] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    birth: ""
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })
  const [avatarUrl, setAvatarUrl] = useState("")
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState("")

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      console.log("开始获取用户资料...")
      
      // 使用自定义认证系统获取当前用户
      const { isAuthenticated, getCurrentUser } = await import('../lib/auth')
      
      if (!isAuthenticated()) {
        console.log("用户未登录")
        return
      }
      
      const currentUser = getCurrentUser()
      console.log("当前用户:", currentUser)
      
      if (!currentUser) {
        console.log("无法获取当前用户信息")
        return
      }
      
      // 从数据库获取用户资料
      const profiles = await profileService.getAllProfiles()
      console.log("数据库中的所有用户资料:", profiles)
      
      // 查找当前用户的资料 - 优先使用用户名匹配
      let userProfile = profiles.find(profile => 
        profile.name === currentUser.name || 
        profile.id === currentUser.id
      )
      
      console.log("找到的用户资料:", userProfile)
      
      if (userProfile) {
        setProfile(userProfile)
        setFormData({
          name: userProfile.name || "",
          birth: userProfile.birth || ""
        })
        setAvatarUrl(userProfile.avatar || "")
      } else {
        console.log("未找到匹配的用户资料，创建新的用户资料...")
        // 创建一个默认用户资料
        const newProfile = await profileService.upsertProfile({
          name: currentUser.name || "默认用户",
          avatar: "",
          birth: ""
        })
        console.log("创建的新用户资料:", newProfile)
        
        // 确保newProfile存在
        if (newProfile) {
          setProfile(newProfile)
          setFormData({
            name: newProfile.name || "",
            birth: newProfile.birth || ""
          })
          setAvatarUrl(newProfile.avatar || "")
        } else {
          console.error("创建用户资料失败")
        }
      }
    } catch (error) {
      console.error("获取用户资料失败:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfile = async () => {
    if (!profile) return
    
    try {
      setIsSaving(true)
      await profileService.upsertProfile({
        id: profile.id,
        name: formData.name,
        birth: formData.birth,
        avatar: avatarUrl
      })
      
      // 更新本地状态
      setProfile({
        ...profile,
        name: formData.name,
        birth: formData.birth,
        avatar: avatarUrl
      })
      
      alert("资料更新成功")
    } catch (error) {
      console.error("更新资料失败:", error)
      alert("更新资料失败")
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdatePassword = async () => {
    if (!profile) return
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("新密码和确认密码不匹配")
      return
    }
    
    try {
      setIsSaving(true)
      await profileService.updatePassword(
        profile.id, 
        passwordData.newPassword
      )
      
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      })
      
      alert("密码更新成功")
    } catch (error) {
      console.error("更新密码失败:", error)
      alert("密码更新失败")
    } finally {
      setIsSaving(false)
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleUploadAvatar = async () => {
    if (!avatarFile || !profile) return

    try {
      setIsSaving(true)
      
      // 生成唯一文件名
      const fileExt = avatarFile.name.split('.').pop()
      const fileName = `avatar-${profile.id}-${Date.now()}.${fileExt}`
      
      // 上传到Supabase Storage的media存储桶中的avatars文件夹
      const filePath = `avatars/${fileName}`
      const { data, error } = await supabase.storage
        .from('media')  // 使用 'media' 存储桶而不是 'avatars'
        .upload(filePath, avatarFile)
      
      if (error) throw error
      
      // 获取公共URL
      const { data: { publicUrl } } = supabase.storage
        .from('media')  // 使用 'media' 存储桶
        .getPublicUrl(filePath)
      
      // 更新用户资料中的头像URL
      await profileService.upsertProfile({
        id: profile.id,
        avatar: publicUrl
      })
      
      // 添加时间戳参数以避免浏览器缓存
      const timestampedUrl = `${publicUrl}?t=${Date.now()}`
      
      setAvatarUrl(timestampedUrl)
      setProfile({
        ...profile,
        avatar: timestampedUrl
      })
      
      setIsAvatarDialogOpen(false)
      setAvatarFile(null)
      setPreviewUrl("")
      
      alert("头像上传成功")
    } catch (error) {
      console.error("上传头像失败:", error)
      alert("上传头像失败: " + (error as Error).message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleUrlAvatarChange = async () => {
    if (!avatarUrl.trim() || !profile) return
    
    try {
      setIsSaving(true)
      
      // 更新用户资料中的头像URL
      await profileService.upsertProfile({
        id: profile.id,
        avatar: avatarUrl
      })
      
      setProfile({
        ...profile,
        avatar: avatarUrl
      })
      
      alert("头像更新成功")
    } catch (error) {
      console.error("更新头像失败:", error)
      alert("更新头像失败")
    } finally {
      setIsSaving(false)
    }
  }

  const handleImagePreview = (url: string) => {
    setPreviewImageUrl(url)
    setIsImagePreviewOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-8">
        <Icon icon="lucide:user-x" className="w-12 h-12 mx-auto text-slate-400 mb-4" />
        <p className="text-slate-500">未找到用户资料</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">个人资料</h2>
      </div>

      <Card className="bg-white/80 backdrop-blur-md border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Avatar className="h-16 w-16 cursor-pointer" onClick={() => avatarUrl && handleImagePreview(avatarUrl)}>
              <AvatarImage src={avatarUrl} alt={profile.name || "用户头像"} />
              <AvatarFallback className="text-lg">
                {profile.name ? profile.name.charAt(0).toUpperCase() : "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-xl font-semibold">{profile.name || "未知用户"}</h3>
              <p className="text-sm text-slate-500">{profile.birth ? new Date(profile.birth).toLocaleDateString() : "未设置生日"}</p>
            </div>
          </CardTitle>
          <CardDescription>
            管理您的个人信息和账户设置
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">基本信息</TabsTrigger>
          <TabsTrigger value="avatar">头像设置</TabsTrigger>
          <TabsTrigger value="password">修改密码</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="mt-6">
          <Card className="bg-white/80 backdrop-blur-md border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
              <CardDescription>
                更新您的个人基本信息
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">姓名</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="输入您的姓名"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birth">生日</Label>
                  <Input
                    id="birth"
                    type="date"
                    value={formData.birth}
                    onChange={(e) => setFormData(prev => ({ ...prev, birth: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleUpdateProfile} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Icon icon="lucide:loader" className="w-4 h-4 mr-2 animate-spin" />
                      保存中...
                    </>
                  ) : (
                    <>
                      <Icon icon="lucide:save" className="w-4 h-4 mr-2" />
                      保存更改
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="avatar" className="mt-6">
          <Card className="bg-white/80 backdrop-blur-md border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle>头像设置</CardTitle>
              <CardDescription>
                更新您的个人头像
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-shrink-0">
                  <Avatar className="h-32 w-32 cursor-pointer" onClick={() => avatarUrl && handleImagePreview(avatarUrl)}>
                    <AvatarImage src={avatarUrl} alt={profile.name || "用户头像"} />
                    <AvatarFallback className="text-3xl">
                      {profile.name ? profile.name.charAt(0).toUpperCase() : "U"}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex-1 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="avatar-url">头像URL</Label>
                    <div className="flex gap-2">
                      <Input
                        id="avatar-url"
                        value={avatarUrl}
                        onChange={(e) => setAvatarUrl(e.target.value)}
                        placeholder="输入头像图片URL"
                      />
                      <Button onClick={handleUrlAvatarChange} disabled={isSaving || !avatarUrl.trim()}>
                        更新
                      </Button>
                    </div>
                  </div>
                  <div className="text-sm text-slate-500">
                    或者
                  </div>
                  <Dialog open={isAvatarDialogOpen} onOpenChange={setIsAvatarDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <Icon icon="lucide:upload" className="w-4 h-4 mr-2" />
                        上传头像
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>上传头像</DialogTitle>
                        <DialogDescription>
                          选择一张图片作为您的头像
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="avatar-upload">选择图片</Label>
                          <Input
                            id="avatar-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarChange}
                          />
                        </div>
                        {previewUrl && (
                          <div className="flex justify-center">
                            <Avatar className="h-24 w-24">
                              <AvatarImage src={previewUrl} alt="预览" />
                              <AvatarFallback>
                                <Icon icon="lucide:image" className="w-8 h-8" />
                              </AvatarFallback>
                            </Avatar>
                          </div>
                        )}
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => {
                          setIsAvatarDialogOpen(false)
                          setAvatarFile(null)
                          setPreviewUrl("")
                        }}>
                          取消
                        </Button>
                        <Button onClick={handleUploadAvatar} disabled={isSaving || !avatarFile}>
                          {isSaving ? (
                            <>
                              <Icon icon="lucide:loader" className="w-4 h-4 mr-2 animate-spin" />
                              上传中...
                            </>
                          ) : (
                            <>
                              <Icon icon="lucide:upload" className="w-4 h-4 mr-2" />
                              上传
                            </>
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="password" className="mt-6">
          <Card className="bg-white/80 backdrop-blur-md border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle>修改密码</CardTitle>
              <CardDescription>
                更新您的账户密码
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">当前密码</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  placeholder="输入当前密码"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">新密码</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="输入新密码"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">确认新密码</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="再次输入新密码"
                />
              </div>
              <div className="flex justify-end">
                <Button 
                  onClick={handleUpdatePassword} 
                  disabled={isSaving || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                >
                  {isSaving ? (
                    <>
                      <Icon icon="lucide:loader" className="w-4 h-4 mr-2 animate-spin" />
                      更新中...
                    </>
                  ) : (
                    <>
                      <Icon icon="lucide:key" className="w-4 h-4 mr-2" />
                      更新密码
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 图片预览弹窗 */}
      <Dialog open={isImagePreviewOpen} onOpenChange={setIsImagePreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] bg-white/95 backdrop-blur-md border-slate-200 shadow-lg">
          <DialogHeader>
            <DialogTitle className="sr-only">图片预览</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-4">
            <img 
              src={previewImageUrl} 
              alt="头像预览" 
              className="max-w-full max-h-[70vh] object-contain rounded-lg"
            />
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setIsImagePreviewOpen(false)}>
                关闭
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}