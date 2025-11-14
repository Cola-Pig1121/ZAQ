"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ImageIcon, X, Upload, FolderOpen } from "lucide-react"
import { postService } from "@/lib/database"
import { MediaLibrary } from "./media-library"
import { useToast } from "@/hooks/use-toast"

export function PublishPost({ onPostCreated }: { onPostCreated: () => void }) {
  const [content, setContent] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [isMediaLibraryOpen, setIsMediaLibraryOpen] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    try {
      await postService.createPost({
        content,
        images: imageUrl ? [imageUrl] : null,
      })
      
      setContent("")
      setImageUrl("")
      onPostCreated()
      
      toast({
        title: "发布成功",
        description: "您的动态已成功发布",
      })
    } catch (error) {
      console.error("发布失败:", error)
      toast({
        title: "发布失败",
        description: "发布动态时出现错误，请重试",
        variant: "destructive",
      })
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const file = files[0]
    
    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      toast({
        title: "文件类型错误",
        description: "请选择图片文件",
        variant: "destructive",
      })
      return
    }

    // 验证文件大小 (50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "文件过大",
        description: "图片大小不能超过50MB",
        variant: "destructive",
      })
      return
    }

    try {
      setIsUploading(true)
      const url = await postService.uploadImage(file, 'media')
      if (url) {
        setImageUrl(url)
      }
      
      toast({
        title: "上传成功",
        description: "图片已成功上传",
      })
    } catch (error) {
      console.error("图片上传失败:", error)
      toast({
        title: "上传失败",
        description: "图片上传时出现错误，请重试",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveImage = () => {
    setImageUrl("")
  }

  const handleSelectFromMediaLibrary = (file: { url: string; name: string }) => {
    setImageUrl(file.url)
    setIsMediaLibraryOpen(false)
    
    toast({
      title: "选择成功",
      description: `已从媒体库选择图片: ${file.name}`,
    })
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>发布动态</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            placeholder="分享你的想法..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[100px]"
          />
          
          {imageUrl && (
            <div className="relative">
              <img
                src={imageUrl}
                alt="预览"
                className="w-full h-auto max-h-[300px] object-cover rounded-md"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={handleRemoveImage}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                上传图片
              </TabsTrigger>
              <TabsTrigger value="media" className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                媒体库
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload" className="space-y-2">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex items-center gap-2"
                  disabled={isUploading}
                  onClick={() => document.getElementById('image-upload')?.click()}
                >
                  <ImageIcon className="h-4 w-4" />
                  {isUploading ? "上传中..." : "选择图片"}
                </Button>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <span className="text-sm text-muted-foreground">
                  支持 JPG、PNG、GIF 格式，最大 50MB
                </span>
              </div>
            </TabsContent>
            
            <TabsContent value="media" className="space-y-2">
              <Dialog open={isMediaLibraryOpen} onOpenChange={setIsMediaLibraryOpen}>
                <DialogTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <FolderOpen className="h-4 w-4" />
                    从媒体库选择
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>选择图片</DialogTitle>
                  </DialogHeader>
                  <MediaLibrary onSelectImage={handleSelectFromMediaLibrary} />
                </DialogContent>
              </Dialog>
            </TabsContent>
          </Tabs>
          
          <Button type="submit" className="w-full">
            发布
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
