import { YouTubePractice } from "@/components/youtube-practice"

export default function Home() {
  return (
    <main className="min-h-screen p-4 md:p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">YouTube Song Practice</h1>
      <p className="mb-8 text-muted-foreground">
        Practice and transcribe songs by controlling playback, looping sections, and adjusting speed.
      </p>

      <YouTubePractice defaultVideoUrl="https://www.youtube.com/watch?v=dQw4w9WgXcQ" />
    </main>
  )
}
