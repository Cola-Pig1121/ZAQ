"use client"
import Image from "next/image"

export default function SimpleNav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-sky-500/90 backdrop-blur-sm px-4 sm:px-6 lg:px-8 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <Image src="/avatar.jpg" alt="Logo" width={32} height={32} className="w-8 h-8 rounded-full" />
          <div className="text-center">
            <h1 className="text-lg font-bold text-white">ZAQ</h1>
            <p className="text-xs text-sky-100">记录美好的时光地方</p>
          </div>
        </div>
      </div>
    </nav>
  )
}