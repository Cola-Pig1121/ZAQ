"use client"

import { useState } from "react"
import PostFeed from "@/components/post-feed"
import { PublishPost } from "@/components/publish-post"
import HeroSection from "@/components/hero-section"
import SimpleNav from "@/components/simple-nav"
import SlideController from "@/components/slide-controller"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export default function Home() {
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [showLanding, setShowLanding] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  return (
    <div className="min-h-screen bg-sky-50 overflow-hidden">
      {/* Hero Section and Landing Page Container */}
      <div className="relative h-[100svh]">
        {/* Hero Section */}
        <div className={`absolute inset-0 transition-transform duration-700 ${showLanding ? '-translate-y-full' : 'translate-y-0'}`}>
          <HeroSection />
        </div>

        {/* Landing Page */}
        <div className={`absolute inset-0 landing-scroll-container overflow-y-auto transition-transform duration-700 ${showLanding ? 'translate-y-0' : 'translate-y-full'}`}>
          {/* Simple Navigation */}
          <SimpleNav />
          
          {/* 占位高度，避免固定导航遮挡内容 */}
          <div className="h-16" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Main Content */}
            <main className="flex-1">
              <div className="space-y-6">
                {/* Post Feed */}
                <div className="space-y-6">
                  <PostFeed 
                    key={refreshTrigger}
                  />
                </div>
              </div>
            </main>
          </div>
      </div>
      </div>

      {/* Slide Controller */}
      <SlideController onSlideChange={setShowLanding} />

      {/* Publish Post Modal */}
      <Dialog open={showPublishModal} onOpenChange={setShowPublishModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white text-sm font-bold">
                用
              </div>
              <span>发布动态</span>
            </DialogTitle>
          </DialogHeader>
          <PublishPost
            onPostCreated={() => {
              setRefreshTrigger(prev => prev + 1)
              setShowPublishModal(false)
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
