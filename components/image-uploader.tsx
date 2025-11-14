"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Icon } from '@iconify/react'
import { supabase } from "@/lib/supabase"
import { postService } from "@/lib/database"
import { MediaLibrary } from "@/components/media-library"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ImageUploaderProps {
  onImagesChange: (images: string[]) => void
  initialImages?: string[]
  acceptFileTypes?: string
  maxFileSize?: number
}

interface MediaCategory {
  id: string
  name: string
  count: number
}

export default function ImageUploader({ 
  onImagesChange, 
  initialImages = [],
  acceptFileTypes = "image/*,video/*,audio/*",
  maxFileSize = 50 * 1024 * 1024
}: ImageUploaderProps) {
  const [images, setImages] = useState<string[]>(initialImages)
  const [isUploading, setIsUploading] = useState(false)
  const [isMediaLibraryOpen, setIsMediaLibraryOpen] = useState(false)
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [categories, setCategories] = useState<MediaCategory[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("未分类")
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 获取分类列表
  useEffect(() => {
    fetchCategories()
  }, [])

  // 获取分类列表
  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('media_categories')
        .select('*')

      if (error) throw error
      
      setCategories(data || [])
    } catch (error) {
      console.error("获取分类失败:", error)
    }
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    
    if (files.length === 0) return
    
    // 验证文件大小
    const validFiles = files.filter((file) => {
      if (file.size > maxFileSize) {
        alert(`文件 ${file.name} 超过${maxFileSize / (1024 * 1024)}MB限制`)
        return false
      }
      return true
    })
    
    if (validFiles.length === 0) return
    
    // 保存选择的文件并打开分类选择对话框
    setSelectedFiles(validFiles)
    setIsCategoryDialogOpen(true)
    
    // 重置文件输入
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // 执行文件上传（带分类）
  const executeUpload = async () => {
    if (selectedFiles.length === 0) return
    
    setIsUploading(true)
    setIsCategoryDialogOpen(false)
    
    try {
      const newImages: string[] = []
      
      for (const file of selectedFiles) {
        // 上传到Storage并获取URL
        const mediaUrl = await postService.uploadImage(file, 'media')
        
        if (mediaUrl) {
          // 保存文件信息到数据库
          const { data: fileData, error: dbError } = await supabase
            .from('media_files')
            .insert({
              name: file.name,
              url: mediaUrl,
              size: file.size,
              type: file.type,
              category: selectedCategory
            })
            .select()
            .single()
          
          if (dbError) {
            console.error(`保存文件信息失败: ${file.name}`, dbError)
            alert(`${file.name} 保存到媒体库失败`)
          } else {
            newImages.push(mediaUrl)
          }
        } else {
          alert(`${file.name} 上传失败`)
        }
      }
      
      const updatedImages = [...images, ...newImages]
      setImages(updatedImages)
      onImagesChange(updatedImages)
      setSelectedFiles([])
    } catch (error) {
      console.error("媒体文件上传失败:", error)
      alert("媒体文件上传失败")
    } finally {
      setIsUploading(false)
    }
  }

  const handleMediaLibrarySelect = (file: { url: string; name: string }) => {
    const updatedImages = [...images, file.url]
    setImages(updatedImages)
    onImagesChange(updatedImages)
    setIsMediaLibraryOpen(false)
  }

  const handleRemoveImage = async (index: number) => {
    const imageUrl = images[index]
    
    // 从Supabase Storage删除图片
    try {
      // 从URL中提取文件路径和文件名
      const urlParts = imageUrl.split('/')
      // URL格式: https://xxx.supabase.co/storage/v1/object/public/media/folder/filename
      // 我们需要提取folder/filename部分
      const pathParts = urlParts.slice(urlParts.indexOf('media') + 1)
      const filePath = pathParts.join('/')
      
      // 从Storage中删除文件
      const { error } = await supabase.storage
        .from('media')
        .remove([filePath])
      
      if (error) {
        console.error("删除图片失败:", error)
        // 即使删除失败，也从列表中移除
      }
    } catch (error) {
      console.error("删除图片失败:", error)
      // 即使删除失败，也从列表中移除
    }
    
    // 从图片列表中移除
    const updatedImages = images.filter((_, i) => i !== index)
    setImages(updatedImages)
    onImagesChange(updatedImages)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptFileTypes}
          onChange={handleFileSelect}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center space-x-1"
        >
          {isUploading ? (
            <>
              <Icon icon="lucide:loader" className="w-4 h-4 animate-spin" />
              <span>上传中...</span>
            </>
          ) : (
            <>
              <Icon icon="lucide:upload" className="w-4 h-4" />
              <span>上传媒体</span>
            </>
          )}
        </Button>
        
        <Dialog open={isMediaLibraryOpen} onOpenChange={setIsMediaLibraryOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="outline" className="flex items-center space-x-1">
              <Icon icon="lucide:folder-open" className="w-4 h-4" />
              <span>媒体库</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh]">
              <DialogHeader>
                <DialogTitle>选择媒体文件</DialogTitle>
                <DialogDescription>
                  从媒体库中选择文件，或上传新文件
                </DialogDescription>
              </DialogHeader>
              <div className="max-h-[60vh] overflow-y-auto">
                <MediaLibrary onSelectImage={handleMediaLibrarySelect} mode="list-only" />
              </div>
            </DialogContent>
        </Dialog>
      </div>

      {/* 分类选择对话框 */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>选择分类</DialogTitle>
            <DialogDescription>
              选择要上传到的媒体分类（共 {selectedFiles.length} 个文件）
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="category-select" className="text-sm font-medium">
                媒体分类
              </label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger id="category-select" className="w-full">
                  <SelectValue placeholder="选择分类" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name} ({category.count})
                    </SelectItem>
                  ))}
                  <SelectItem value="未分类">未分类</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={executeUpload} disabled={isUploading}>
              {isUploading ? (
                <>
                  <Icon icon="lucide:loader" className="w-4 h-4 animate-spin mr-2" />
                  上传中...
                </>
              ) : (
                "确认上传"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <Card key={index} className="relative overflow-hidden">
              <CardContent className="p-0">
                <div className="aspect-square relative">
                  <img
                    src={image}
                    alt={`上传的图片 ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 h-8 w-8 p-0 rounded-full"
                    onClick={() => handleRemoveImage(index)}
                  >
                    <Icon icon="lucide:x" className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {images.length === 0 && (
        <Card className="border-dashed border-slate-300">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Icon icon="lucide:file-image" className="w-12 h-12 text-slate-400 mb-4" />
            <p className="text-slate-500 text-center">
              点击"上传媒体"按钮上传文件，或点击"媒体库"选择已有文件<br />
              支持图片、视频、音频等多种格式
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}