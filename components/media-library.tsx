"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs"
import {
  Upload,
  Search,
  Filter,
  Grid3X3,
  List,
  Trash2,
  Eye,
  Download,
  X,
  Plus,
  Folder,
  Image as ImageIcon,
  Check,
  Edit3
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { postService } from "@/lib/database"

interface MediaFile {
  id: string
  name: string
  url: string
  size: number
  type: string
  category: string
  created_at: string
}

interface MediaCategory {
  id: string
  name: string
}

interface MediaLibraryProps {
  className?: string
  onSelectImage?: (file: { url: string; name: string }) => void
  mode?: 'full' | 'list-only'  // full: 完整模式，包含上传功能；list-only: 仅列表模式
}

export function MediaLibrary({ className, onSelectImage, mode = 'full' }: MediaLibraryProps) {
  const [files, setFiles] = useState<MediaFile[]>([])
  const [categories, setCategories] = useState<MediaCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [editingFile, setEditingFile] = useState<string | null>(null)
  const [editFileName, setEditFileName] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 获取媒体文件列表
  useEffect(() => {
    fetchMediaFiles()
    fetchCategories()
  }, [])

  // 过滤文件
  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || file.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // 同步Storage中的文件到数据库
  const syncStorageFiles = async () => {
    try {
      setLoading(true)
      let totalSynced = 0
      
      // 首先获取所有分类
      const { data: categories, error: categoriesError } = await supabase
        .from('media_categories')
        .select('*')
      
      if (categoriesError) throw categoriesError
      
      // 如果没有分类，则使用默认分类
      const folderCategories = categories && categories.length > 0 
        ? categories.map(cat => cat.name)
        : ['images', 'videos', 'audios', 'documents', 'others']
      
      console.log("正在同步以下文件夹:", folderCategories)
      
      // 获取数据库中已有的文件URL列表
      const { data: dbFiles, error: dbError } = await supabase
        .from('media_files')
        .select('url')
      
      if (dbError) throw dbError
      
      const dbUrls = new Set(dbFiles?.map(f => f.url) || [])
      
      // 对每个分类/文件夹进行同步
      for (const category of folderCategories) {
        // 获取Storage中的文件
        const { data: storageFiles, error: storageError } = await supabase.storage
          .from('media')
          .list(category, {
            limit: 100,
            offset: 0,
            sortBy: { column: 'created_at', order: 'desc' }
          })
        
        if (storageError) {
          console.error(`获取 ${category} 文件夹失败:`, storageError)
          continue
        }
        
        // 找出Storage中有但数据库中没有的文件
        const filesToSync = (storageFiles || []).filter(storageFile => {
          const { data: { publicUrl } } = supabase.storage
            .from('media')
            .getPublicUrl(`${category}/${storageFile.name}`)
          
          return !dbUrls.has(publicUrl)
        })
        
        if (filesToSync.length === 0) {
          console.log(`${category} 文件夹没有需要同步的文件`)
          continue
        }
        
        // 将这些文件添加到数据库
        const syncPromises = filesToSync.map(async (file) => {
          const { data: { publicUrl } } = supabase.storage
            .from('media')
            .getPublicUrl(`${category}/${file.name}`)
          
          // 根据分类确定文件类型
          let fileType = 'unknown'
          if (category === 'images' || category === '图片') {
            fileType = file.metadata?.mimetype || 'image/jpeg'
          } else if (category === 'videos' || category === '视频') {
            fileType = file.metadata?.mimetype || 'video/mp4'
          } else if (category === 'audios' || category === '音频') {
            fileType = file.metadata?.mimetype || 'audio/mpeg'
          } else if (category === 'documents' || category === '文档') {
            fileType = file.metadata?.mimetype || 'application/pdf'
          } else {
            fileType = file.metadata?.mimetype || 'application/octet-stream'
          }
          
          return supabase
            .from('media_files')
            .insert({
              name: file.name,
              url: publicUrl,
              size: file.metadata?.size || 0,
              type: fileType,
              category: category
            })
            .select()
            .single()
        })
        
        const syncedFiles = await Promise.all(syncPromises)
        totalSynced += syncedFiles.length
        console.log(`${category} 文件夹同步了 ${syncedFiles.length} 个文件`)
      }
      
      // 刷新文件列表
      await fetchMediaFiles()
      
      // 刷新分类列表，确保新同步文件的分类可见，强制刷新缓存
      await fetchCategories(true)
      
      if (totalSynced > 0) {
        alert(`成功同步 ${totalSynced} 个文件`)
      } else {
        alert("没有需要同步的文件")
      }
    } catch (error) {
      console.error("同步文件失败:", error)
      alert("同步文件失败")
    } finally {
      setLoading(false)
    }
  }

  // 获取媒体文件列表
  const fetchMediaFiles = async () => {
    try {
      setLoading(true)
      
      // 从数据库获取
      const { data, error } = await supabase
        .from('media_files')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setFiles(data || [])
    } catch (error) {
      console.error("获取媒体文件失败:", error)
    } finally {
      setLoading(false)
    }
  }

  // 获取分类列表
  const fetchCategories = async (forceRefresh = false) => {
    try {
      // 从数据库获取所有已定义的分类
      const { data: definedCategories, error: categoriesError } = await supabase
        .from('media_categories')
        .select('*')

      if (categoriesError) throw categoriesError

      // 获取所有文件中使用的分类
      const { data: files, error: filesError } = await supabase
        .from('media_files')
        .select('category')

      if (filesError) throw filesError

      // 提取所有唯一的分类
      const allCategoryNames = new Set<string>()
      
      // 添加已定义的分类
      if (definedCategories) {
        definedCategories.forEach(cat => allCategoryNames.add(cat.name))
      }
      
      // 添加文件中使用的分类
      if (files) {
        files.forEach(file => {
          if (file.category) {
            allCategoryNames.add(file.category)
          }
        })
      }

      // 转换为分类对象数组
      const categories = Array.from(allCategoryNames).map(name => ({
        id: name,
        name: name
      }))

      // 添加"全部"分类
      const allCategories: MediaCategory[] = [
        { id: "all", name: "全部" },
        ...categories
      ]

      setCategories(allCategories)
    } catch (error) {
      console.error("获取分类失败:", error)
    }
  }

  // 上传文件
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files
    if (!selectedFiles || selectedFiles.length === 0) return
  }

  // 执行上传
  const executeUpload = async () => {
    if (!fileInputRef.current?.files || fileInputRef.current.files.length === 0) return

    const selectedFiles = fileInputRef.current.files

    try {
      setLoading(true)
      const uploadPromises = Array.from(selectedFiles).map(async (file) => {
        // 使用postService的uploadImage方法，它会自动处理文件夹分类
        const url = await postService.uploadImage(file, 'media')

        // 保存文件信息到数据库
        const { data: fileData, error: dbError } = await supabase
          .from('media_files')
          .insert({
            name: file.name,
            url: url,
            size: file.size,
            type: file.type,
            category: selectedCategory === "all" ? "未分类" : selectedCategory
          })
          .select()
          .single()

        if (dbError) throw dbError

        return fileData
      })

      const uploadedFiles = await Promise.all(uploadPromises)
      const newFiles = [...uploadedFiles, ...files]
      setFiles(newFiles)

      // 更新分类计数
      fetchCategories()

      // 重置文件输入
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      setIsUploadOpen(false)
    } catch (error) {
      console.error("上传文件失败:", error)
      alert("上传文件失败")
    } finally {
      setLoading(false)
    }
  }

  // 删除文件
  const handleDeleteFile = async (file: MediaFile) => {
    if (!confirm(`确定要删除文件 "${file.name}" 吗？`)) return

    try {
      setLoading(true)

      // 从数据库删除记录
      const { error: dbError } = await supabase
        .from('media_files')
        .delete()
        .eq('id', file.id)

      if (dbError) throw dbError

      // 从Storage删除文件
      const fileName = file.url.split('/').pop()
      if (fileName) {
        const { error: storageError } = await supabase.storage
          .from('media')
          .remove([fileName])

        if (storageError) console.error("删除存储文件失败:", storageError)
      }

      // 更新本地状态
      const newFiles = files.filter(f => f.id !== file.id)
      setFiles(newFiles)

      // 更新分类计数
      fetchCategories()
    } catch (error) {
      console.error("删除文件失败:", error)
      alert("删除文件失败")
    } finally {
      setLoading(false)
    }
  }

  // 编辑文件名
  const handleEditFile = (file: MediaFile) => {
    setEditingFile(file.id)
    setEditFileName(file.name)
  }

  // 保存文件名
  const handleSaveFileName = async (file: MediaFile) => {
    if (!editFileName.trim() || editFileName === file.name) {
      setEditingFile(null)
      return
    }

    try {
      const { error } = await supabase
        .from('media_files')
        .update({ name: editFileName.trim() })
        .eq('id', file.id)

      if (error) throw error

      const newFiles = files.map(f => f.id === file.id ? { ...f, name: editFileName.trim() } : f)
      setFiles(newFiles)

      setEditingFile(null)
      setEditFileName("")
    } catch (error) {
      console.error("重命名文件失败:", error)
      alert("重命名文件失败")
    }
  }

  // 取消编辑
  const handleCancelEdit = () => {
    setEditingFile(null)
    setEditFileName("")
  }

  // 创建新分类
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return

    try {
      const { data, error } = await supabase
        .from('media_categories')
        .insert({ name: newCategoryName })
        .select()
        .single()

      if (error) throw error

      const newCategories = [...categories, { ...data, count: 0 }]
      setCategories(newCategories)

      setNewCategoryName("")
      setIsCreateCategoryOpen(false)
    } catch (error) {
      console.error("创建分类失败:", error)
      alert("创建分类失败")
    }
  }

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 打开预览
  const openPreview = (file: MediaFile) => {
    setSelectedFile(file)
    setIsPreviewOpen(true)
  }

  // 选择图片
  const handleSelectImage = (file: MediaFile) => {
    if (onSelectImage) {
      onSelectImage({ url: file.url, name: file.name })
    }
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              媒体库
              <Badge variant="secondary">{files.length}</Badge>
            </CardTitle>

            {mode === 'full' && (
              <div className="flex gap-2">
                <Button variant="outline" onClick={syncStorageFiles} disabled={loading} className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  同步文件
                </Button>
                <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      上传文件
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>上传文件</DialogTitle>
                      <DialogDescription>
                        选择要上传的文件
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <label htmlFor="file-upload" className="text-sm font-medium">
                          选择文件
                        </label>
                        <input
                          id="file-upload"
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileUpload}
                          multiple
                          accept="image/*,video/*,audio/*"
                          className="block w-full text-sm text-gray-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-full file:border-0
                            file:text-sm file:font-semibold
                            file:bg-blue-50 file:text-blue-700
                            hover:file:bg-blue-100"
                        />
                      </div>

                      <div className="grid gap-2">
                        <label htmlFor="category-select" className="text-sm font-medium">
                          分类
                        </label>
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                          <SelectTrigger id="category-select">
                            <SelectValue placeholder="选择分类" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map(category => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsUploadOpen(false)}>
                        取消
                      </Button>
                      <Button onClick={executeUpload} disabled={loading}>
                        {loading ? '上传中...' : '确定上传'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog open={isCreateCategoryOpen} onOpenChange={setIsCreateCategoryOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      新建分类
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>新建分类</DialogTitle>
                      <DialogDescription>
                        创建新的媒体文件分类
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <label htmlFor="category-name" className="text-sm font-medium">
                          分类名称
                        </label>
                        <Input
                          id="category-name"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          placeholder="输入分类名称"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsCreateCategoryOpen(false)}>
                        取消
                      </Button>
                      <Button onClick={handleCreateCategory}>
                        创建
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>

          {/* 搜索和筛选控件 */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="搜索文件名..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="分类筛选" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {mode === 'full' && (
                <div className="flex border rounded-md">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className="rounded-r-none"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className="rounded-l-none"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading && filteredFiles.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm || selectedCategory !== "all" ? "没有找到符合条件的文件" : "暂无媒体文件"}
            </div>
          ) : (
            <div className={mode === 'list-only' || viewMode === "list" ? "space-y-2" : "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"}>
              {filteredFiles.map((file) => (
                <div
                  key={file.id}
                  className={mode === 'list-only' || viewMode === "list"
                    ? "border rounded-lg p-3 hover:bg-gray-50 transition-colors cursor-pointer group"
                    : "border rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
                  }
                  onClick={() => onSelectImage ? handleSelectImage(file) : openPreview(file)}
                >
                  {mode !== 'list-only' && viewMode === "grid" ? (
                    <div className="aspect-square bg-gray-100 relative">
                      <img
                        src={file.url}
                        alt={file.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="flex gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditFile(file)
                            }}
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          {onSelectImage ? (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleSelectImage(file)
                              }}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                openPreview(file)
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteFile(file)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                        <img
                          src={file.url}
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        {editingFile === file.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editFileName}
                              onChange={(e) => setEditFileName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleSaveFileName(file)
                                } else if (e.key === 'Escape') {
                                  handleCancelEdit()
                                }
                              }}
                              className="flex-1 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              onClick={(e) => e.stopPropagation()}
                              autoFocus
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleSaveFileName(file)
                              }}
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleCancelEdit()
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <p className="font-medium truncate">{file.name}</p>
                            <p className="text-sm text-gray-500">
                              {formatFileSize(file.size)} • {formatDate(file.created_at)}
                            </p>
                          </>
                        )}
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {editingFile !== file.id && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEditFile(file)
                              }}
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            {onSelectImage ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleSelectImage(file)
                                }}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openPreview(file)
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteFile(file)
                              }}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {mode !== 'list-only' && viewMode === "grid" && (
                    <div className="p-2">
                      {editingFile === file.id ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editFileName}
                            onChange={(e) => setEditFileName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSaveFileName(file)
                              } else if (e.key === 'Escape') {
                                handleCancelEdit()
                              }
                            }}
                            className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                          />
                          <div className="flex gap-1 justify-end">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleSaveFileName(file)
                              }}
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleCancelEdit()
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 文件预览对话框 */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-4xl" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedFile?.name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPreviewOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          {selectedFile && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <img
                  src={selectedFile.url}
                  alt={selectedFile.name}
                  className="max-w-full max-h-[60vh] object-contain rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">文件名:</span> {selectedFile.name}
                </div>
                <div>
                  <span className="font-medium">文件大小:</span> {formatFileSize(selectedFile.size)}
                </div>
                <div>
                  <span className="font-medium">文件类型:</span> {selectedFile.type}
                </div>
                <div>
                  <span className="font-medium">上传时间:</span> {formatDate(selectedFile.created_at)}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                {onSelectImage && (
                  <Button onClick={() => handleSelectImage(selectedFile)}>
                    选择此图片
                  </Button>
                )}
                <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
                  关闭
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}