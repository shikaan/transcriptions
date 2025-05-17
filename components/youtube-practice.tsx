"use client"

import type React from "react"

import {useState, useRef} from "react"
import ReactPlayer from "react-player/youtube"
import {Play, Pause, RotateCcw, RotateCw, Repeat} from "lucide-react"
import {Slider} from "@/components/ui/slider"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger} from "@/components/ui/accordion"

interface YouTubePracticeProps {
  defaultVideoUrl: string
}

export function YouTubePractice({defaultVideoUrl}: YouTubePracticeProps) {
  const [videoUrl, setVideoUrl] = useState(defaultVideoUrl)
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [played, setPlayed] = useState(0)
  const [seeking, setSeeking] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [videoTitle, setVideoTitle] = useState("")
  const [loopEnabled, setLoopEnabled] = useState(false)
  const [loopStart, setLoopStart] = useState(0)
  const [loopEnd, setLoopEnd] = useState(0)
  const [videoInputUrl, setVideoInputUrl] = useState(defaultVideoUrl)
  const [videoId, setVideoId] = useState("");

  const playerRef = useRef<ReactPlayer>(null)

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const formatLoopTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    const milliseconds = Math.floor((seconds % 1) * 1000)
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}.${milliseconds.toString().padStart(3, "0")}`
  }

  const parseLoopTime = (timeString: string) => {
    const parts = timeString.split(":")
    if (parts.length === 2) {
      const minutes = Number.parseInt(parts[0], 10)
      const secondsParts = parts[1].split(".")
      const seconds = Number.parseInt(secondsParts[0], 10)
      const milliseconds = secondsParts[1] ? Number.parseInt(secondsParts[1], 10) / 1000 : 0
      if (!isNaN(minutes) && !isNaN(seconds) && !isNaN(milliseconds)) {
        return minutes * 60 + seconds + milliseconds
      }
    }
    return 0
  }

  // Handle slider change
  const handleSeekChange = (value: number[]) => {
    setSeeking(true)
    setLoopEnabled(false)
    setPlayed(value[0] / 100)
  }

  // Handle slider after change
  const handleSeekMouseUp = () => {
    setSeeking(false)
    if (playerRef.current) {
      playerRef.current.seekTo(played)
    }
  }

  // Handle progress update
  const handleProgress = (state: { played: number; playedSeconds: number }) => {
    if (!seeking) {
      setPlayed(state.played)

      // Handle looping
      if (loopEnabled && state.playedSeconds >= loopEnd) {
        playerRef.current?.seekTo(loopStart)
      }
    }
  }

  // Handle video URL input
  const handleVideoUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setVideoUrl(videoInputUrl)
  }

  // Set loop start to the current position
  const setLoopStartToCurrent = () => {
    const currentTime = played * duration
    setLoopStart(currentTime)
    if (loopEnd <= currentTime) {
      setLoopEnd(duration)
    }
    setLoopEnabled(true)
  }

  // Set loop end to current position
  const setLoopEndToCurrent = () => {
    const currentTime = played * duration
    setLoopEnd(currentTime)
    if (loopStart >= currentTime) {
      setLoopStart(0)
    }
    setLoopEnabled(true)
  }

  // Toggle loop
  const toggleLoop = () => {
    if (!loopEnabled) {
      // If enabling loop for the first time, set default values
      if (loopStart === 0 && loopEnd === 0) {
        setLoopStart(played * duration)
        setLoopEnd(duration)
      }
    }
    setLoopEnabled(!loopEnabled)
  }

  // Jump back 5 seconds
  const jumpBack = () => {
    const newTime = Math.max(0, played * duration - 5)
    setPlayed(newTime / duration)
    playerRef.current?.seekTo(newTime)
  }

  // Jump forward 5 seconds
  const jumpForward = () => {
    const newTime = Math.min(duration, played * duration + 5)
    setPlayed(newTime / duration)
    playerRef.current?.seekTo(newTime)
  }

  return (
    <div className="grid gap-8 max-w-2xl mx-auto">
      <Accordion type="single" collapsible>
        <AccordionItem value="tips">
          <AccordionTrigger className="font-medium">Instructions</AccordionTrigger>
          <AccordionContent>
              <ul className="text-sm space-y-1">
                <li>• Paste a YouTube URL and click "Load"</li>
                <li>• Use the slider to navigate to specific parts of the song</li>
                <li>• Enable loop mode and set start/end points to practice difficult sections</li>
                <li>• Slow down the playback speed for detailed transcription</li>
                <li>• Use the 5-second jump buttons for quick navigation</li>
              </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="flex flex-col gap-8">
        <form onSubmit={handleVideoUrlSubmit} className="flex gap-2">
          <Input
            type="text"
            value={videoInputUrl}
            onChange={(e) => setVideoInputUrl(e.target.value)}
            placeholder="Enter YouTube URL"
            className="flex-1"
            disabled={!videoId && videoUrl !== defaultVideoUrl}
          />
          <Button type="submit" disabled={!videoId && videoUrl !== defaultVideoUrl}>
            Load
          </Button>
        </form>

        <div className="aspect-video bg-black rounded-lg overflow-hidden">
          {videoId != "" ? (
            <img
              src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
              alt="Video thumbnail"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-muted animate-pulse"/>
          )}
          <ReactPlayer
            ref={playerRef}
            url={videoUrl}
            width="0"
            height="0"
            playing={isPlaying}
            playbackRate={playbackRate}
            onDuration={setDuration}
            onProgress={handleProgress}
            onPause={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
            onReady={(player) => {
              // Get video title if available
              try {
                const videoData = player.getInternalPlayer()
                setVideoTitle(videoData?.getVideoData().title)
                setVideoId(videoData?.getVideoData().video_id)
                setLoopEnabled(false)
                setLoopStart(0)
                setLoopEnd(0)
              } catch (error) {
                console.error(error) // TODO: real error handling
              }
            }}
            config={{
              youtube: {
                playerVars: {
                  autoplay: 1,
                  modestbranding: 1,
                  controls: 0,
                  disablekb: 1,
                  fs: 0,
                  showinfo: 0,
                  rel: 0,
                },
              }
            }}
          />
        </div>

        {videoTitle ? (
          <h2 className="text-xl font-semibold mt-2 min-h-[32px]">{videoTitle}</h2>
        ) : (
          <div className="h-8 w-3/4 bg-muted animate-pulse rounded mt-2"/>
        )}
      </div>

      <div className="flex flex-col gap-8 space-y-8">
        <div className="grid gap-8">
          <div className="flex items-center justify-between">
            <div className="text-lg font-medium">Playback Controls</div>
            <div className="text-sm text-muted-foreground">
              {formatTime(played * duration)} / {formatTime(duration)}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Slider
              value={[played * 100]}
              min={0}
              max={100}
              step={0.1}
              onValueChange={handleSeekChange}
              onValueCommit={handleSeekMouseUp}
              className="flex-1"
            />
          </div>

          <div className="flex items-center justify-between gap-2">
            <Button variant="outline" size="icon" onClick={jumpBack}>
              <RotateCcw className="h-4 w-4"/>
            </Button>

            <Button variant="default" size="lg" onClick={() => setIsPlaying(!isPlaying)} className="flex-1">
              {isPlaying ? <Pause className="h-5 w-5 mr-2"/> : <Play className="h-5 w-5 mr-2"/>}
              {isPlaying ? "Pause" : "Play"}
            </Button>

            <Button variant="outline" size="icon" onClick={jumpForward}>
              <RotateCw className="h-4 w-4"/>
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm font-medium">Speed:</div>
            <Select
              value={playbackRate.toString()}
              onValueChange={(value) => setPlaybackRate(Number.parseFloat(value))}
            >
              <SelectTrigger className="w-24">
                <SelectValue placeholder="Speed"/>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0.25">0.25x</SelectItem>
                <SelectItem value="0.5">0.5x</SelectItem>
                <SelectItem value="0.75">0.75x</SelectItem>
                <SelectItem value="1">1x</SelectItem>
                <SelectItem value="1.25">1.25x</SelectItem>
                <SelectItem value="1.5">1.5x</SelectItem>
                <SelectItem value="2">2x</SelectItem>
              </SelectContent>
            </Select>

            <Button variant={loopEnabled ? "default" : "outline"} onClick={toggleLoop} className="ml-auto">
              <Repeat className={`h-4 w-4 mr-2 ${loopEnabled ? "text-white" : ""}`}/>
              {loopEnabled ? "Loop On" : "Loop Off"}
            </Button>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium mb-2">Loop Start</div>
              <div className="flex items-center gap-2">
                <Input
                  value={formatLoopTime(loopStart)}
                  onChange={(e) => {
                    const time = parseLoopTime(e.target.value)
                    if (!isNaN(time)) setLoopStart(time)
                  }}
                  className="flex-1"
                />
                <Button variant="outline" size="sm" onClick={setLoopStartToCurrent}>
                  Set Current
                </Button>
              </div>
            </div>

            <div>
              <div className="text-sm font-medium mb-2">Loop End</div>
              <div className="flex items-center gap-2">
                <Input
                  value={formatLoopTime(loopEnd)}
                  onChange={(e) => {
                    const time = parseLoopTime(e.target.value)
                    if (!isNaN(time)) setLoopEnd(time)
                  }}
                  className="flex-1"
                />
                <Button variant="outline" size="sm" onClick={setLoopEndToCurrent}>
                  Set Current
                </Button>
              </div>
            </div>
          </div>

          <div className="relative pt-2">
            <div className="h-2 bg-muted rounded-full">
              <div
                className="absolute h-2 bg-primary rounded-full"
                style={{
                  left: `${(loopStart / duration) * 100}%`,
                  width: `${((loopEnd - loopStart) / duration) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
