"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageSquare, Send } from "lucide-react"
import { Comment, getCommentsByPostId, createComment } from "@/lib/comment-service"
import { getUserIP } from "@/lib/ip-utils"

interface CommentSectionProps {
  postId: number
  className?: string
}

export function CommentSection({ postId, className }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [authorName, setAuthorName] = useState("")
  const [loading, setLoading] = useState(false)


  // 获取评论列表
  useEffect(() => {
    const fetchComments = async () => {
      try {
        setLoading(true)
        const data = await getCommentsByPostId(postId)
        setComments(data)
      } catch (error) {
        console.error("获取评论失败:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchComments()
  }, [postId])

  // 提交新评论
  const handleSubmitComment = async () => {
    if (!newComment.trim()) {
      alert("请输入评论内容")
      return
    }

    if (!authorName.trim()) {
      alert("请输入您的名字")
      return
    }

    try {
      setLoading(true)
      const userIP = await getUserIP()
      
      const comment = await createComment({
        post_id: postId,
        content: newComment,
        author_name: authorName,
        ip: userIP
      })
      
      setComments([...comments, comment])
      setNewComment("")
    } catch (error) {
      console.error("提交评论失败:", error)
      alert("提交评论失败")
    } finally {
      setLoading(false)
    }
  }



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

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <Card className="flex-1 flex flex-col bg-white/80 backdrop-blur-md border-slate-200 shadow-sm">
        <CardHeader className="flex-shrink-0">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            评论 ({comments.length})
          </CardTitle>
        </CardHeader>
        
        {/* 评论输入区域 - 直接放在CardHeader后面 */}
        <div className="px-6 py-4 border-b border-border bg-muted/20 flex-shrink-0">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              {/* 名字输入框 */}
              <input
                placeholder="请输入您的名字（必填）"
                className="flex-1 px-4 py-2 rounded-full bg-white text-slate-700 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-300 border border-slate-200 focus:border-transparent"
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
              />
              
              {/* 头像标识 */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-300 to-purple-300 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {authorName ? authorName.charAt(0).toUpperCase() : 'U'}
              </div>
            </div>
            
            {/* 评论输入区域 */}
            <div className="flex items-end gap-3">
              <input
                placeholder="写下你的评论..."
                className="flex-1 px-4 py-2 rounded-full bg-white text-slate-700 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-300 border border-slate-200 focus:border-transparent"
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmitComment()
                  }
                }}
              />
              
              {/* 提交按钮 */}
              <button
                onClick={handleSubmitComment}
                disabled={loading || !newComment.trim() || !authorName.trim()}
                className="px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold hover:shadow-lg transition-all duration-300 hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img" className="iconify iconify--lucide w-4 h-4" width="1em" height="1em" viewBox="0 0 24 24">
                  <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11zm7.318-19.539l-10.94 10.939"></path>
                </svg>
              </button>
              
              {/* 取消按钮 */}
              <button
                onClick={() => {
                  setNewComment("")
                  setAuthorName("")
                }}
                className="px-4 py-2 rounded-full bg-slate-200 text-slate-600 hover:bg-slate-300 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
        
        {/* 评论列表 - 设置为可滚动区域 */}
        <CardContent className="flex-1 overflow-y-auto min-h-0 p-0">
          <div className="px-6 py-4 space-y-4">
            {comments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                暂无评论，快来发表第一条评论吧！
              </div>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3 p-3 rounded-lg bg-muted/50">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="" alt={comment.author_name} />
                        <AvatarFallback>
                          {comment.author_name ? comment.author_name.charAt(0).toUpperCase() : 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-sm">{comment.author_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(comment.created_at)}
                        </div>
                      </div>
                      <div className="text-sm">{comment.content}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}