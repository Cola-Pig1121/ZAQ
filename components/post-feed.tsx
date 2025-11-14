"use client"

import { useState, useEffect } from 'react'
import PostCard from "./post-card"
import { getAllPosts, likePost, unlikePost, createComment, deleteComment, Post } from "@/lib/post-service"


export default function PostFeed() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const postsData = await getAllPosts()
        setPosts(postsData)
      } catch (error) {
        console.error("Error fetching posts:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [])

  // 处理点赞逻辑 - 为PostCard组件提供API
  const handleLike = async (postId: number) => {
    // 先获取当前的点赞状态，避免在PostCard组件更新后读取到新状态
    const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '{}')
    const wasLiked = likedPosts[postId]
    
    try {
      // 根据当前状态执行点赞或取消点赞操作
      if (wasLiked) {
        // 取消点赞
        await unlikePost(postId)
        // 移除localStorage中的记录
        delete likedPosts[postId]
      } else {
        // 点赞
        await likePost(postId)
        // 在localStorage中标记为已点赞
        likedPosts[postId] = true
      }
      
      // 更新localStorage
      localStorage.setItem('likedPosts', JSON.stringify(likedPosts))
      
      // 更新当前帖子的点赞数
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { ...post, thumbs: wasLiked ? Math.max(0, (post.thumbs || 0) - 1) : (post.thumbs || 0) + 1 }
            : post
        )
      )
    } catch (error) {
      console.error('点赞操作失败:', error)
      // 抛出错误，让PostCard组件处理UI回滚
      throw error
    }
  }

  const handleComment = async (postId: number, content: string, author?: string) => {
    try {
      await createComment(postId, content, author || "访客")
      // 重新获取帖子数据以更新评论
      const updatedPosts = await getAllPosts()
      setPosts(updatedPosts)
    } catch (error) {
      console.error('评论失败:', error, '详细信息:', error)
    }
  }

  const handleDeleteComment = async (commentId: number) => {
    try {
      await deleteComment(commentId)
      // 重新获取帖子数据以更新评论
      const updatedPosts = await getAllPosts()
      setPosts(updatedPosts)
    } catch (error) {
      console.error('删除评论失败:', error)
    }
  }

  const handleReplyComment = async (postId: number, content: string, author?: string, parentId?: number) => {
    try {
      await createComment(postId, content, author || "访客", parentId)
      // 重新获取帖子数据以更新评论
      const updatedPosts = await getAllPosts()
      setPosts(updatedPosts)
    } catch (error) {
      console.error('回复评论失败:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {posts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-lg">还没有发布任何动态呢～</p>
        </div>
      ) : (
        posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onLike={handleLike}
            onComment={handleComment}
            onDeleteComment={handleDeleteComment}
            onReplyComment={handleReplyComment}
          />
        ))
      )}
    </div>
  )
}
