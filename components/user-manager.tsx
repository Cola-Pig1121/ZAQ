"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { profileService } from "@/lib/database"
import { Icon } from '@iconify/react'
import { Profile } from "@/lib/database"

export default function UserManager() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    title: "",
    avatar: ""
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })

  useEffect(() => {
    fetchProfiles()
  }, [])

  const fetchProfiles = async () => {
    try {
      const data = await profileService.getAllProfiles()
      setProfiles(data)
    } catch (error) {
      console.error("获取用户资料失败:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProfile = async () => {
    try {
      await profileService.upsertProfile({
        name: formData.name,
        avatar: formData.avatar,
        pwd: "default123" // 默认密码，用户首次登录后需要修改
      })
      setIsCreateDialogOpen(false)
      resetForm()
      fetchProfiles()
    } catch (error) {
      console.error("创建用户资料失败:", error)
    }
  }

  const handleUpdateProfile = async () => {
    if (!currentProfile) return
    
    try {
      await profileService.upsertProfile({
        id: currentProfile.id,
        name: formData.name,
        avatar: formData.avatar
      })
      setIsEditDialogOpen(false)
      resetForm()
      fetchProfiles()
    } catch (error) {
      console.error("更新用户资料失败:", error)
    }
  }

  const handleDeleteProfile = async (id: number) => {
    if (confirm("确定要删除这个用户吗？")) {
      try {
        await profileService.deleteProfile(id)
        fetchProfiles()
      } catch (error) {
        console.error("删除用户失败:", error)
      }
    }
  }

  const handleChangePassword = async () => {
    if (!currentProfile) return
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("新密码和确认密码不匹配")
      return
    }
    
    try {
      await profileService.updatePassword(
        currentProfile.id, 
        passwordData.newPassword
      )
      setIsPasswordDialogOpen(false)
      resetPasswordForm()
      alert("密码更新成功")
    } catch (error) {
      console.error("更新密码失败:", error)
      alert("密码更新失败: " + (error as Error).message)
    }
  }

  const openEditDialog = (profile: Profile) => {
    setCurrentProfile(profile)
    setFormData({
      name: profile.name || "",
      title: "",
      avatar: profile.avatar || ""
    })
    setIsEditDialogOpen(true)
  }

  const openPasswordDialog = (profile: Profile) => {
    setCurrentProfile(profile)
    setIsPasswordDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      name: "",
      title: "",
      avatar: ""
    })
    setCurrentProfile(null)
  }

  const resetPasswordForm = () => {
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">用户管理</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center space-x-1">
              <Icon icon="lucide:user-plus" className="w-4 h-4" />
              <span>创建用户</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>创建新用户</DialogTitle>
              <DialogDescription>
                创建新的系统用户
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">用户名</Label>
                <Input
                  id="name"
                  placeholder="输入用户名"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="title">标题</Label>
                <Input
                  id="title"
                  placeholder="输入标题"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="avatar">头像URL</Label>
                <Input
                  id="avatar"
                  placeholder="输入头像URL"
                  value={formData.avatar}
                  onChange={(e) => setFormData(prev => ({ ...prev, avatar: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleCreateProfile}>
                创建
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-white/80 backdrop-blur-md border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>用户列表</CardTitle>
          <CardDescription>管理所有系统用户</CardDescription>
        </CardHeader>
        <CardContent>
          {profiles.length === 0 ? (
            <div className="text-center py-8">
              <Icon icon="lucide:users" className="w-12 h-12 mx-auto text-slate-400 mb-4" />
              <p className="text-slate-500">暂无用户</p>
            </div>
          ) : (
            <div className="space-y-4">
              {profiles.map((profile) => (
                <div key={profile.id} className="border rounded-lg p-4 bg-white/50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      {profile.avatar ? (
                        <img 
                          src={profile.avatar} 
                          alt={profile.name || "用户头像"} 
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center">
                          <Icon icon="lucide:user" className="w-6 h-6 text-white" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-medium">{profile.name || "未知用户"}</h3>
                        <div className="text-xs text-slate-500 mt-2">
                          创建时间: {profile.created_at ? new Date(profile.created_at).toLocaleString() : "未知时间"}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(profile)}>
                        <Icon icon="lucide:edit" className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openPasswordDialog(profile)}>
                        <Icon icon="lucide:key" className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDeleteProfile(profile.id)}>
                        <Icon icon="lucide:trash" className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 编辑对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>编辑用户</DialogTitle>
            <DialogDescription>
              修改用户信息
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">用户名</Label>
              <Input
                id="edit-name"
                placeholder="输入用户名"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-title">标题</Label>
              <Input
                id="edit-title"
                placeholder="输入标题"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-avatar">头像URL</Label>
              <Input
                id="edit-avatar"
                placeholder="输入头像URL"
                value={formData.avatar}
                onChange={(e) => setFormData(prev => ({ ...prev, avatar: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleUpdateProfile}>
              更新
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 修改密码对话框 */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>修改密码</DialogTitle>
            <DialogDescription>
              修改用户密码
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="current-password">当前密码</Label>
              <Input
                id="current-password"
                type="password"
                placeholder="输入当前密码"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-password">新密码</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="输入新密码"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm-password">确认新密码</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="再次输入新密码"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleChangePassword}>
              更新密码
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}