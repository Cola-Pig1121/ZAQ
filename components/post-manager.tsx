"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Icon } from '@iconify/react'
import { Post, createPost, updatePost, deletePost, getAllPosts } from "@/lib/post-service"
import ImageUploader from "@/components/image-uploader"
import { CommentSection } from "@/components/comment-section"
import { CommentManager } from "@/components/comment-manager"

export default function PostManager() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isCommentDialogOpen, setIsCommentDialogOpen] = useState(false)

  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [formData, setFormData] = useState({
    content: "",
    images: [] as string[]
  })
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      const data = await getAllPosts()
      setPosts(data)
    } catch (error) {
      console.error("获取文章失败:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePost = async () => {
    try {
      await createPost({
        content: formData.content,
        images: formData.images
      })
      setIsCreateDialogOpen(false)
      resetForm()
      fetchPosts()
    } catch (error) {
      console.error("创建文章失败:", error)
    }
  }

  const handleUpdatePost = async () => {
    if (!editingPost) return
    
    try {
      await updatePost(editingPost.id, {
        content: formData.content,
        images: formData.images
      })
      setIsEditDialogOpen(false)
      resetForm()
      fetchPosts()
    } catch (error) {
      console.error("更新文章失败:", error)
    }
  }

  const handleDeletePost = async (id: number) => {
    if (!confirm("确定要删除这篇文章吗？")) {
      return
    }

    try {
      setLoading(true)
      await deletePost(String(id))
      
      // 刷新帖子列表
      await fetchPosts()
    } catch (error) {
      console.error("删除文章失败:", error)
      alert("删除文章失败")
    } finally {
      setLoading(false)
    }
  }

  const openEditDialog = (post: Post) => {
    setEditingPost(post)
    setFormData({
      content: post.content || '',
      images: post.images || []
    })
    setIsEditDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      content: "",
      images: []
    })
    setEditingPost(null)
  }

  const handleImagesChange = (images: string[]) => {
    setFormData(prev => ({ ...prev, images }))
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
        <h2 className="text-2xl font-bold">内容管理</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center space-x-1">
              <Icon icon="lucide:plus" className="w-4 h-4" />
              <span>创建内容</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>创建新内容</DialogTitle>
              <DialogDescription>
                创建新的社交媒体内容
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="content">内容</Label>
                <Textarea
                  id="content"
                  placeholder="输入内容..."
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  rows={4}
                />
              </div>
              <div className="grid gap-2">
                <Label>媒体</Label>
                <ImageUploader 
                  onImagesChange={handleImagesChange}
                  initialImages={formData.images}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsCreateDialogOpen(false)
                resetForm()
              }}>
                取消
              </Button>
              <Button onClick={handleCreatePost}>
                创建
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="posts">帖子管理</TabsTrigger>
          <TabsTrigger value="comments">评论管理</TabsTrigger>
        </TabsList>
        
        <TabsContent value="posts" className="space-y-4">
          <Card className="bg-white/80 backdrop-blur-md border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle>内容列表</CardTitle>
              <CardDescription>管理所有社交媒体内容</CardDescription>
            </CardHeader>
            <CardContent>
              {posts.length === 0 ? (
                <div className="text-center py-8">
                  <Icon icon="lucide:inbox" className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                  <p className="text-slate-500">暂无内容</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <div key={post.id} className="border rounded-lg p-4 bg-white/50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm text-slate-600 mb-2">{post.content}</p>
                          {post.images && post.images.length > 0 && (
                            <div className="mt-2">
                              <div className="flex items-center space-x-1 mb-2">
                                <Icon icon="lucide:image" className="w-4 h-4 text-slate-500" />
                                <span className="text-sm text-slate-500">{post.images.length} 张图片</span>
                              </div>
                              <div className={`grid gap-2 ${
                                post.images.length === 1 ? 'grid-cols-1' : 
                                post.images.length === 2 ? 'grid-cols-2' : 
                                'grid-cols-3'
                              }`}>
                                {post.images.map((image, index) => (
                                  <div 
                                    key={index} 
                                    className="aspect-square rounded-md overflow-hidden border cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => setSelectedImage(image)}
                                  >
                                    <img 
                                      src={image} 
                                      alt={`图片 ${index + 1}`}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          <div className="text-xs text-slate-500 mt-2">
                            创建时间: {new Date(post.created_at).toLocaleString()}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                            <Button variant="outline" size="sm" onClick={() => openEditDialog(post)}>
                              <Icon icon="lucide:edit" className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => {
                              setSelectedPost(post)
                              setIsCommentDialogOpen(true)
                            }}>
                              <Icon icon="lucide:message-square" className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDeletePost(post.id)}>
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
        </TabsContent>
        
        <TabsContent value="comments" className="space-y-4">
          <CommentManager />
        </TabsContent>
      </Tabs>

      {/* 编辑对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>编辑内容</DialogTitle>
            <DialogDescription>
              修改现有的社交媒体内容
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-content">内容</Label>
              <Textarea
                id="edit-content"
                placeholder="输入内容..."
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                rows={4}
              />
            </div>
            <div className="grid gap-2">
              <Label>图片</Label>
              <ImageUploader 
                onImagesChange={handleImagesChange}
                initialImages={formData.images}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditDialogOpen(false)
              resetForm()
            }}>
              取消
            </Button>
            <Button onClick={handleUpdatePost}>
              更新
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 评论对话框 */}
      <Dialog open={isCommentDialogOpen} onOpenChange={setIsCommentDialogOpen}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>评论</DialogTitle>
            <DialogDescription>
              查看和管理评论
            </DialogDescription>
          </DialogHeader>
          {selectedPost && (
            <div className="flex flex-col flex-1 min-h-0">
              <div className="mb-4 p-3 bg-muted/50 rounded-lg flex-shrink-0">
                <p className="text-sm">{selectedPost.content}</p>
              </div>
              <div className="flex-1 min-h-0 overflow-hidden">
                <CommentSection postId={selectedPost.id} className="h-full" />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* 图片预览弹窗 */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-4xl max-h-full" onClick={(e) => e.stopPropagation()}>
            <button 
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
              onClick={() => setSelectedImage(null)}
            >
              <Icon icon="lucide:x" className="w-6 h-6" />
            </button>
            <img 
              src={selectedImage} 
              alt="预览图片" 
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
            <div className="text-center text-white text-sm mt-4">
              点击空白处关闭
            </div>
          </div>
        </div>
      )}
    </div>
  )
}