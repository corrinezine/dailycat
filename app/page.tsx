"use client"

import MarioCat from '@/mario-cat'
import Navbar from '@/components/Navbar'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* 游戏区域 */}
      <div className="pt-16">
        <div className="max-w-[1340px] mx-auto">
          <div className="sticky top-16">
            <MarioCat />
          </div>
        </div>
      </div>
    </main>
  )
}