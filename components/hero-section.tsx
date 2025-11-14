"use client"
import Image from "next/image"

export default function HeroSection() {
  return (
    <section className="relative h-screen overflow-hidden w-full bg-sky-100">
      <Image src="/xcjs.jpg" alt="幸村精市" fill className="object-cover" priority />

      {/* Hero Text */}
      {/* Text overlay - mobile: CN top-left, EN bottom-right */}
      <div className="absolute inset-0 sm:hidden">
        {/* Left Top - Chinese */}
        <div className="text-white font-bold leading-tight hero-text-shadow absolute top-16 left-4" style={{ fontSize: 'clamp(28px, 8vw, 75px)' }}>
          {/* <div className="animate-fade-in-up">
          </div>
          <div className="ml-6 animate-fade-in-up animation-delay-200">
          </div> */}
        </div>
        {/* Right Bottom - English */}
        <div className="text-white text-right font-medium hero-text-shadow absolute bottom-4 right-4">
          {/* <div className="animate-fade-in-up animation-delay-400" 
               style={{ fontSize: 'clamp(18px, 5vw, 50px)', lineHeight: '1.2' }}>
          </div>
          <div className="animate-fade-in-up animation-delay-600" 
               style={{ fontSize: 'clamp(18px, 5vw, 50px)', lineHeight: '1.2' }}>
          </div> */}
        </div>
      </div>

      {/* Text overlay - tablet/desktop: original left-right layout */}
      <div className="absolute inset-0 hidden sm:flex items-center justify-between px-8 lg:px-16">
        {/* Left Text - Chinese */}
        <div className="text-white font-bold leading-tight hero-text-shadow" style={{ fontSize: 'clamp(28px, 8vw, 75px)' }}>
          {/* <div className="animate-fade-in-up">
          </div>
          <div className="ml-12 lg:ml-16 animate-fade-in-up animation-delay-200">
          </div> */}
        </div>

        {/* Right Text - English */}
        <div className="text-white text-right font-medium hero-text-shadow">
          {/* <div className="animate-fade-in-up animation-delay-400"
            style={{ fontSize: 'clamp(18px, 5vw, 50px)', lineHeight: '1.2' }}>
          </div>
          <div className="animate-fade-in-up animation-delay-600"
            style={{ fontSize: 'clamp(18px, 5vw, 50px)', lineHeight: '1.2' }}>
          </div> */}
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white animate-bounce">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 5V19M12 19L5 12M12 19L19 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </section>
  )
}