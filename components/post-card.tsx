"use client"

import { useState, useEffect } from "react"
import { Icon } from '@iconify/react'

// 从 database.ts 导入 Post 类型和 supabase 客户端
import { Post } from "@/lib/database"
import { supabase } from "@/lib/supabase"
import { cacheUtils, CACHE_KEYS } from "@/lib/cache"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface PostCardProps {
  post: Post
  isOwner?: boolean
  onLike: (postId: number) => void
  onComment: (postId: number, content: string, author?: string) => void
  onDeleteComment?: (commentId: number) => void
  onReplyComment?: (postId: number, content: string, author?: string, parentId?: number) => void
}

export default function PostCard({ post, onLike, onComment, onDeleteComment, onReplyComment }: PostCardProps) {
  const [showComments, setShowComments] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [isLiking, setIsLiking] = useState(false)
  const [showCommentInput, setShowCommentInput] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [commentAuthor, setCommentAuthor] = useState('')
  const [commentError, setCommentError] = useState('')
  const [replyingTo, setReplyingTo] = useState<number | null>(null)
  const [replyText, setReplyText] = useState('')
  const [replyAuthor, setReplyAuthor] = useState('')
  const [replyError, setReplyError] = useState('')
  const [selectedMedia, setSelectedMedia] = useState<{url: string, type: string, name?: string} | null>(null)
  
  // 初始化点赞状态
  useEffect(() => {
    const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '{}')
    setIsLiked(likedPosts[post.id] || false)
  }, [post.id])

  // 从缓存或数据库查询媒体文件信息
  const fetchMediaFileInfo = async (url: string): Promise<string | undefined> => {
    try {
      // 先尝试从缓存获取媒体文件列表
      const cachedMediaFiles = cacheUtils.getMediaFiles()
      
      if (cachedMediaFiles) {
        // 从缓存中查找匹配的文件
        const mediaFile = cachedMediaFiles.find((file: any) => file.url === url)
        if (mediaFile) {
          return mediaFile.name
        }
      }

      // 缓存中没有，从数据库查询
      const { data, error } = await supabase
        .from('media_files')
        .select('name')
        .eq('url', url)
        .single()

      if (error) {
        console.error('查询媒体文件信息失败:', error)
        return undefined
      }

      return data?.name
    } catch (error) {
      console.error('查询媒体文件信息失败:', error)
      return undefined
    }
  }

  // 处理删除评论
  const handleDeleteComment = (commentId: number) => {
    if (onDeleteComment) {
      onDeleteComment(commentId)
    }
  }

  // 处理回复评论
  const handleReplyComment = (commentId: number) => {
    setReplyingTo(commentId)
    setReplyText("")
    setReplyAuthor("")
  }

  // 提交回复
  const handleSubmitReply = () => {
    // 验证用户名是否为空
    if (!replyAuthor.trim()) {
      setReplyError("请输入您的名字")
      return
    }
    
    // 验证回复内容是否为空
    if (!replyText.trim()) {
      setReplyError("请输入回复内容")
      return
    }
    
    // 清除错误信息
    setReplyError("")
    
    // 提交回复
    if (onReplyComment) {
      onReplyComment(post.id, replyText, replyAuthor, replyingTo ?? undefined)
      setReplyText("")
      setReplyAuthor("")
      setReplyingTo(null)
    }
  }

  // 处理点赞功能 - 乐观更新机制
  const handleLike = async () => {
    if (isLiking) return // 防止重复点击
    
    setIsLiking(true)
    
    // 保存当前状态用于回滚
    const previousLikedState = isLiked
    
    // 立即更新本地状态以提供即时反馈
    const newLikedState = !isLiked
    setIsLiked(newLikedState)
    
    // 后台异步操作数据库 - localStorage和点赞数更新由PostFeed组件处理
    try {
      await onLike(post.id)
    } catch (error) {
      console.error('点赞操作失败:', error)
      
      // 数据库操作失败，回滚UI状态
      setIsLiking(false)
      setIsLiked(previousLikedState)
      
      // 重新同步localStorage状态
      const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '{}')
      if (previousLikedState) {
        likedPosts[post.id] = true
      } else {
        delete likedPosts[post.id]
      }
      localStorage.setItem('likedPosts', JSON.stringify(likedPosts))
      
      // 显示错误提示
      console.warn('点赞操作失败，已回滚到之前状态')
    } finally {
      setIsLiking(false)
    }
  }

  const handleSubmitComment = () => {
    // 验证用户名是否为空
    if (!commentAuthor.trim()) {
      setCommentError("请输入您的名字")
      return
    }
    
    // 验证评论内容是否为空
    if (!commentText.trim()) {
      setCommentError("请输入评论内容")
      return
    }
    
    // 清除错误信息
    setCommentError("")
    
    // 提交评论
    onComment(post.id, commentText, commentAuthor)
    setCommentText("")
    setCommentAuthor("")
    setShowCommentInput(false)
  }

  const timeAgo = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)
    const minutes = Math.floor(diff / (1000 * 60))

    if (minutes < 1) return "刚刚"
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days === 1) return "昨天"
    return `${days}天前`
  }

  const moodEmoji: { [key: string]: string } = {
    开心: "😊",
    感慨: "💭",
    温暖: "🥰",
    期待: "✨",
    放松: "😌",
    浪漫: "💕",
    充实: "🌟",
    兴奋: "🎉",
    平静: "🌊",
    梦幻: "✨"
  }

  const moodColors: { [key: string]: string } = {
    开心: "bg-gradient-to-r from-pink-400 to-red-400",
    浪漫: "bg-gradient-to-r from-purple-400 to-pink-400",
    平静: "bg-gradient-to-r from-blue-400 to-cyan-400",
    充实: "bg-gradient-to-r from-green-400 to-teal-400",
    兴奋: "bg-gradient-to-r from-yellow-400 to-orange-400",
    梦幻: "bg-gradient-to-r from-indigo-400 to-purple-400",
    感慨: "bg-gradient-to-r from-indigo-400 to-blue-400",
    温暖: "bg-gradient-to-r from-orange-400 to-amber-400",
    期待: "bg-gradient-to-r from-teal-400 to-cyan-400",
    放松: "bg-gradient-to-r from-blue-400 to-indigo-400",
  }

  // 获取文件类型
  const getFileType = (url: string): string => {
    if (!url) return 'image'
    const extension = url.split('.').pop()?.toLowerCase()
    const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm']
    const audioExtensions = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a']
    
    if (extension && videoExtensions.includes(extension)) return 'video'
    if (extension && audioExtensions.includes(extension)) return 'audio'
    return 'image'
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-all duration-300 group">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <img 
            src="/placeholder-user.jpg" 
            alt={post.author} 
            className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm group-hover:scale-110 transition-transform duration-300"
          />
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-slate-800">{post.author || "安琪"}</p>
            </div>
            <p className="text-sm text-slate-500 flex items-center gap-1">
              <Icon icon="lucide:clock" className="w-3 h-3" />
              {timeAgo(new Date(post.created_at))}
            </p>
          </div>
        </div>
        
        {/* More Options */}
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all duration-300">
            <Icon icon="lucide:more-horizontal" className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="mb-3">
        <p className="text-slate-700 leading-relaxed text-base">
          {post.content || ""}
        </p>
      </div>

      {/* Image(s) */}
      {post.images && post.images.length > 0 && (
        <div className={`mb-4 gap-2 ${
          post.images.length === 1 ? 'grid grid-cols-1' : 
          post.images.length === 2 ? 'grid grid-cols-2' : 
          'grid grid-cols-3'
        }`}>
          {post.images.map((image, index) => {
            const fileType = getFileType(image)
            return (
              <div key={index} className="rounded-xl overflow-hidden shadow-sm aspect-square cursor-pointer hover:shadow-lg transition-shadow duration-300 relative">
                {/* 文件类型指示器 */}
                {fileType !== 'image' && (
                  <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                    {fileType === 'video' ? '视频' : fileType === 'audio' ? '音频' : '文件'}
                  </div>
                )}
                
                {/* 缩略图显示 */}
                {fileType === 'video' ? (
                  <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                    <Icon icon="lucide:play-circle" className="w-12 h-12 text-white opacity-80" />
                  </div>
                ) : fileType === 'audio' ? (
                  <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Icon icon="lucide:music" className="w-12 h-12 text-white opacity-80" />
                  </div>
                ) : (
                  <img
                    src={image || "/placeholder.svg"}
                    alt={`Post image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                )}
                
                {/* 点击区域 */}
                <div 
                  className="absolute inset-0"
                  onClick={async () => {
                    const mediaUrl = image || "/placeholder.svg"
                    const fileType = getFileType(mediaUrl)
                    
                    // 从缓存或数据库查询真实文件名
                    const realFileName = await fetchMediaFileInfo(mediaUrl)
                    
                    setSelectedMedia({
                      url: mediaUrl, 
                      type: fileType, 
                      name: realFileName
                    })
                  }}
                />
              </div>
            )
          })}
        </div>
      )}

      {/* Interactions */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <div className="flex items-center gap-3">
          {/* Like Button */}
          <button
            onClick={handleLike}
            disabled={isLiking}
            className={`flex items-center gap-1.5 text-sm transition-all duration-200 ${
              isLiked ? 'text-red-500' : 'text-slate-600 hover:text-red-500'
            } ${isLiking ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Icon 
              icon={isLiking ? "lucide:loader-2" : (isLiked ? "lucide:heart" : "lucide:heart-off")} 
              className={`w-4 h-4 transition-all duration-200 ${
                isLiking ? 'animate-spin' : (isLiked ? 'fill-current' : 'stroke-current')
              }`} 
            />
            <span className={isLiked ? 'font-semibold' : ''}>{post.thumbs || 0}</span>
          </button>

          {/* Comment Button */}
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-blue-500 transition-colors"
          >
            <Icon icon="lucide:message-circle" className="w-4 h-4" />
            <span>{post.comments ? post.comments.length : 0}</span>
          </button>

          {/* Share Button */}
          <button className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-green-500 transition-colors">
            <Icon icon="lucide:share-2" className="w-4 h-4" />
            <span>分享</span>
          </button>
        </div>

        {/* Comment Input Toggle */}
          <button 
            onClick={() => setShowCommentInput(!showCommentInput)}
            className="px-3 py-1.5 rounded-full text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
          >
            {showCommentInput ? "取消" : "评论"}
          </button>
      </div>

      {/* Comments Section */}
      {(showComments || post.comments && post.comments.length > 0) && (
        <div className="mt-3 space-y-3 pt-3 border-t border-slate-100">
          {post.comments && post.comments.map((comment: any) => (
            <div key={comment.id} className="bg-slate-50 rounded-lg p-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-300 to-purple-300 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {comment.author_name ? comment.author_name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-800">{comment.author_name || "用户"}</p>
                      <span className="text-xs text-slate-400">{timeAgo(new Date(comment.created_at))}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleReplyComment(comment.id)}
                        className="p-1 rounded-full text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                        title="回复"
                      >
                        <Icon icon="lucide:reply" className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="p-1 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="删除"
                      >
                        <Icon icon="lucide:trash-2" className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">{comment.content}</p>
                  
                  {/* Reply Input */}
                  {replyingTo === comment.id && (
                    <div className="mt-2 space-y-2">
                      {/* 用户名输入 */}
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-300 to-purple-300 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {replyAuthor ? replyAuthor.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <input
                          type="text"
                          value={replyAuthor}
                          onChange={(e) => setReplyAuthor(e.target.value)}
                          placeholder="请输入您的名字（必填）"
                          className="flex-1 px-3 py-1 rounded-full bg-white text-slate-700 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-300 border border-slate-200 focus:border-transparent text-sm"
                        />
                      </div>
                      
                      {/* 回复内容输入 */}
                      <div className="flex gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-300 to-purple-300 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {replyAuthor ? replyAuthor.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <input
                          type="text"
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && handleSubmitReply()}
                          placeholder="回复这条评论..."
                          className="flex-1 px-3 py-1.5 rounded-full bg-white text-slate-700 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-300 border border-slate-200 focus:border-transparent text-sm"
                        />
                        <button
                          onClick={handleSubmitReply}
                          className="px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold hover:shadow-lg transition-all duration-300 hover:from-blue-600 hover:to-purple-600"
                        >
                          <Icon icon="lucide:send" className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => {
                            setReplyingTo(null)
                            setReplyError("")
                          }}
                          className="px-3 py-1.5 rounded-full bg-slate-200 text-slate-600 hover:bg-slate-300 transition-colors"
                        >
                          取消
                        </button>
                      </div>
                      
                      {/* 错误提示 */}
                      {replyError && (
                        <div className="text-red-500 text-sm ml-8">
                          {replyError}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comment Input */}
      {showCommentInput && (
        <div className="mt-4 space-y-3">
          {/* 用户名输入 */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-300 to-purple-300 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {commentAuthor ? commentAuthor.charAt(0).toUpperCase() : 'U'}
            </div>
            <input
              type="text"
              value={commentAuthor}
              onChange={(e) => setCommentAuthor(e.target.value)}
              placeholder="请输入您的名字（必填）"
              className="flex-1 px-4 py-2 rounded-full bg-white text-slate-700 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-300 border border-slate-200 focus:border-transparent"
            />
          </div>
          
          {/* 评论内容输入 */}
          <div className="flex gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-300 to-purple-300 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {commentAuthor ? commentAuthor.charAt(0).toUpperCase() : 'U'}
            </div>
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSubmitComment()}
              placeholder="写下你的评论..."
              className="flex-1 px-4 py-2 rounded-full bg-white text-slate-700 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-300 border border-slate-200 focus:border-transparent"
            />
            <button
              onClick={handleSubmitComment}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold hover:shadow-lg transition-all duration-300 hover:from-blue-600 hover:to-purple-600"
            >
              <Icon icon="lucide:send" className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setShowCommentInput(false)
                setCommentError("")
              }}
              className="px-4 py-2 rounded-full bg-slate-200 text-slate-600 hover:bg-slate-300 transition-colors"
            >
              取消
            </button>
          </div>
          
          {/* 错误提示 */}
          {commentError && (
            <div className="text-red-500 text-sm ml-10">
              {commentError}
            </div>
          )}
        </div>
      )}
      
      {/* Media Preview Modal */}
      <Dialog open={!!selectedMedia} onOpenChange={(open) => !open && setSelectedMedia(null)}>
        <DialogContent className="sm:max-w-4xl" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedMedia?.name || selectedMedia?.url.split('/').pop() || '媒体预览'}</span>
              <button
                onClick={() => setSelectedMedia(null)}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <Icon icon="lucide:x" className="w-4 h-4" />
              </button>
            </DialogTitle>
          </DialogHeader>
          
          {selectedMedia && (
            <div className="space-y-4">
              <div className="flex justify-center">
                {/* 视频播放 */}
                {selectedMedia.type === 'video' && (
                  <video
                    src={selectedMedia.url}
                    controls
                    className="max-w-full max-h-[60vh] object-contain rounded-lg"
                    autoPlay
                    onError={(e) => {
                      const target = e.target as HTMLVideoElement
                      target.style.display = 'none'
                      const errorDiv = document.createElement('div')
                      errorDiv.className = 'bg-gray-800 text-white p-8 rounded-lg text-center'
                      errorDiv.innerHTML = `
                        <div class="text-6xl mb-4">🎬</div>
                        <p class="text-lg">视频加载失败</p>
                        <p class="text-sm text-gray-300 mt-2">${selectedMedia.url}</p>
                      `
                      target.parentNode?.appendChild(errorDiv)
                    }}
                  />
                )}
                
                {/* 音频播放 */}
                {selectedMedia.type === 'audio' && (
                  <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-8 rounded-lg text-center min-w-[400px]">
                    <div className="text-8xl mb-6">🎵</div>
                    <h3 className="text-white text-xl mb-4">音频播放</h3>
                    <audio
                      src={selectedMedia.url}
                      controls
                      className="w-full"
                      onError={(e) => {
                        const target = e.target as HTMLAudioElement
                        target.style.display = 'none'
                        const errorDiv = document.createElement('div')
                        errorDiv.className = 'text-white text-center'
                        errorDiv.innerHTML = `
                          <div class="text-4xl mb-2">❌</div>
                          <p>音频加载失败</p>
                        `
                        target.parentNode?.appendChild(errorDiv)
                      }}
                    />
                  </div>
                )}
                
                {/* 图片显示 */}
                {selectedMedia.type === 'image' && (
                  <img
                    src={selectedMedia.url}
                    alt="Preview"
                    className="max-w-full max-h-[60vh] object-contain rounded-lg"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      const errorDiv = document.createElement('div')
                      errorDiv.className = 'bg-gray-800 text-white p-8 rounded-lg text-center'
                      errorDiv.innerHTML = `
                        <div class="text-6xl mb-4">🖼️</div>
                        <p class="text-lg">图片加载失败</p>
                        <p class="text-sm text-gray-300 mt-2">${selectedMedia.url}</p>
                      `
                      target.parentNode?.appendChild(errorDiv)
                    }}
                  />
                )}
                
                {/* 其他文件类型 */}
                {selectedMedia.type === 'file' && (
                  <div className="bg-gray-800 text-white p-8 rounded-lg text-center min-w-[400px]">
                    <div className="text-8xl mb-6">📄</div>
                    <h3 className="text-2xl mb-4">文件预览</h3>
                    <p className="text-gray-300 mb-6">此文件类型暂不支持预览</p>
                    <a
                      href={selectedMedia.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg inline-flex items-center transition-colors"
                    >
                      <Icon icon="lucide:download" className="w-5 h-5 mr-2" />
                      下载文件
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
