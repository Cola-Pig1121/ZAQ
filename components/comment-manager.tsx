"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { Comment, getCommentsByPostId, updateComment, deleteComment } from "@/lib/comment-service"
import { MessageSquare, Search, Edit, Trash2, Reply, Pin, Check, X, Clock } from "lucide-react"

interface CommentManagerProps {
  postId?: number
  className?: string
}

type CommentStatus = "approved" | "pending" | "rejected"
type SortBy = "newest" | "oldest" | "most_replies"

export function CommentManager({ postId, className }: CommentManagerProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [filteredComments, setFilteredComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<CommentStatus | "all">("all")
  const [sortBy, setSortBy] = useState<SortBy>("newest")
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null)
  const [replyContent, setReplyContent] = useState("")
  const [editContent, setEditContent] = useState("")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false)
  const [pinnedComments, setPinnedComments] = useState<number[]>([])

  // 获取评论列表
  useEffect(() => {
    const fetchComments = async () => {
      try {
        setLoading(true)
        if (postId) {
          const data = await getCommentsByPostId(postId)
          setComments(data)
        } else {
          // 如果没有指定postId，获取所有评论
          // 这里需要添加获取所有评论的API
          setComments([])
        }
      } catch (error) {
        console.error("获取评论失败:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchComments()
  }, [postId])

  // 过滤和排序评论
  useEffect(() => {
    let filtered = [...comments]

    // 按状态过滤
    if (statusFilter !== "all") {
      // 这里需要添加状态字段到评论数据结构
      // filtered = filtered.filter(comment => comment.status === statusFilter)
    }

    // 按搜索词过滤
    if (searchTerm) {
      filtered = filtered.filter(comment => 
        comment.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comment.author_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // 排序
    switch (sortBy) {
      case "newest":
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
      case "oldest":
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        break
      case "most_replies":
        // 这里需要添加回复数统计
        break
    }

    // 置顶评论优先显示
    filtered.sort((a, b) => {
      const aPinned = pinnedComments.includes(a.id) ? 1 : 0
      const bPinned = pinnedComments.includes(b.id) ? 1 : 0
      return bPinned - aPinned
    })

    setFilteredComments(filtered)
  }, [comments, searchTerm, statusFilter, sortBy, pinnedComments])

  // 格式化时间
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

  // 删除评论
  const handleDeleteComment = async (commentId: number) => {
    if (!confirm("确定要删除这条评论吗？")) return

    try {
      setLoading(true)
      await deleteComment(commentId)
      setComments(comments.filter(comment => comment.id !== commentId))
    } catch (error) {
      console.error("删除评论失败:", error)
      alert("删除评论失败")
    } finally {
      setLoading(false)
    }
  }

  // 编辑评论
  const handleEditComment = async () => {
    if (!selectedComment || !editContent.trim()) return

    try {
      setLoading(true)
      await updateComment(selectedComment.id, editContent)
      setComments(comments.map(comment => 
        comment.id === selectedComment.id 
          ? { ...comment, content: editContent }
          : comment
      ))
      setIsEditDialogOpen(false)
      setSelectedComment(null)
      setEditContent("")
    } catch (error) {
      console.error("更新评论失败:", error)
      alert("更新评论失败")
    } finally {
      setLoading(false)
    }
  }

  // 置顶/取消置顶评论
  const handleTogglePin = (commentId: number) => {
    setPinnedComments(prev => 
      prev.includes(commentId)
        ? prev.filter(id => id !== commentId)
        : [...prev, commentId]
    )
  }

  // 打开编辑对话框
  const openEditDialog = (comment: Comment) => {
    setSelectedComment(comment)
    setEditContent(comment.content)
    setIsEditDialogOpen(true)
  }

  // 打开回复对话框
  const openReplyDialog = (comment: Comment) => {
    setSelectedComment(comment)
    setReplyContent("")
    setIsReplyDialogOpen(true)
  }

  // 提交回复
  const handleSubmitReply = () => {
    // 这里需要实现回复功能
    alert("回复功能将在后续版本中实现")
    setIsReplyDialogOpen(false)
  }

  if (loading && comments.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            评论管理
            <Badge variant="secondary">{filteredComments.length}</Badge>
          </CardTitle>
          
          {/* 筛选和搜索控件 */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="搜索评论内容或作者..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={(value: CommentStatus | "all") => setStatusFilter(value)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="状态筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="approved">已通过</SelectItem>
                <SelectItem value="pending">待审核</SelectItem>
                <SelectItem value="rejected">已拒绝</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={(value: SortBy) => setSortBy(value)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="排序方式" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">最新优先</SelectItem>
                <SelectItem value="oldest">最早优先</SelectItem>
                <SelectItem value="most_replies">回复最多</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        
        <CardContent>
          {filteredComments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm || statusFilter !== "all" ? "没有找到符合条件的评论" : "暂无评论"}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredComments.map((comment) => (
                <div key={comment.id} className="border rounded-lg p-4 bg-white/50">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-3 flex-1">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src="" alt={comment.author_name} />
                        <AvatarFallback>
                          {comment.author_name ? comment.author_name.charAt(0).toUpperCase() : 'U'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{comment.author_name}</span>
                          {pinnedComments.includes(comment.id) && (
                            <Badge variant="outline" className="text-xs">
                              <Pin className="h-3 w-3 mr-1" />
                              置顶
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(comment.created_at)}
                          </span>
                          {comment.ip && (
                            <span className="text-xs text-muted-foreground">
                              IP: {comment.ip}
                            </span>
                          )}
                        </div>
                        
                        <div className="text-sm">{comment.content}</div>
                        
                        {/* 这里可以添加回复列表 */}
                      </div>
                    </div>
                    
                    <div className="flex gap-1 ml-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleTogglePin(comment.id)}
                        className="h-8 w-8 p-0"
                        title={pinnedComments.includes(comment.id) ? "取消置顶" : "置顶"}
                      >
                        <Pin className={`h-4 w-4 ${pinnedComments.includes(comment.id) ? 'fill-current' : ''}`} />
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => openReplyDialog(comment)}
                        className="h-8 w-8 p-0"
                        title="回复"
                      >
                        <Reply className="h-4 w-4" />
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => openEditDialog(comment)}
                        className="h-8 w-8 p-0"
                        title="编辑"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDeleteComment(comment.id)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        title="删除"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 编辑评论对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>编辑评论</DialogTitle>
            <DialogDescription>
              修改评论内容
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Textarea
                placeholder="评论内容..."
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleEditComment}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 回复评论对话框 */}
      <Dialog open={isReplyDialogOpen} onOpenChange={setIsReplyDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>回复评论</DialogTitle>
            <DialogDescription>
              回复 {selectedComment?.author_name} 的评论
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="bg-muted/50 p-3 rounded-md">
              <p className="text-sm">{selectedComment?.content}</p>
            </div>
            <div className="grid gap-2">
              <Textarea
                placeholder="输入回复内容..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReplyDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmitReply}>
              回复
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}