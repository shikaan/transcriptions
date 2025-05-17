"use client"
import {Practice} from "@/components/practice"
import React, {useState} from "react"
import {History} from "@/components/history";
import {Session} from "@/lib/storage";

export default function Home() {
  const [activeTab, setActiveTab] = useState<'practice' | 'history'>('practice')
  const [session, setSession] = useState<Session>();

  const goToPracticeAction = () => setActiveTab('practice');

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">YouTube Song Practice</h1>

      <div className="text-center py-4">
        <div role="tablist"
             className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground">
          <button
            role="tab"
            aria-selected={activeTab === 'practice'}
            onClick={() => setActiveTab('practice')}
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
              activeTab === 'practice' ? 'bg-background text-foreground shadow' : 'hover:bg-background/50'
            }`}
          >
            Practice
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'history'}
            onClick={() => setActiveTab('history')}
            className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
              activeTab === 'history' ? 'bg-background text-foreground shadow' : 'hover:bg-background/50'
            }`}
          >
            History
          </button>
        </div>
      </div>

      {activeTab === 'practice' ? (
        <Practice session={session} setSessionAction={setSession}
                  defaultVideoUrl="https://www.youtube.com/watch?v=dQw4w9WgXcQ"/>
      ) : (
        <History goToPracticeAction={goToPracticeAction} setSessionAction={setSession}/>
      )}
    </main>
  )
}
