"use client"

import type React from "react"

import { useState, useRef } from "react"
import ReactPlayer from "react-player/youtube"
import { Play, Pause, RotateCcw, RotateCw, Repeat } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

interface YouTubePracticeProps {
  defaultVideoUrl: string
}

export function YouTubePractice({ defaultVideoUrl }: YouTubePracticeProps) {
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
  const [inputTime, setInputTime] = useState("0:00")
  const [videoInputUrl, setVideoInputUrl] = useState(defaultVideoUrl)

  const playerRef = useRef<ReactPlayer>(null)

  // Format seconds to mm:ss
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  // Parse mm:ss to seconds
  const parseTime = (timeString: string) => {
    const parts = timeString.split(":")
    if (parts.length === 2) {
      const minutes = Number.parseInt(parts[0], 10)
      const seconds = Number.parseInt(parts[1], 10)
      if (!isNaN(minutes) && !isNaN(seconds)) {
        return minutes * 60 + seconds
      }
    }
    return 0
  }

  // Handle slider change
  const handleSeekChange = (value: number[]) => {
    setSeeking(true)
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
      setInputTime(formatTime(state.playedSeconds))

      // Handle looping
      if (loopEnabled && state.playedSeconds >= loopEnd) {
        playerRef.current?.seekTo(loopStart)
      }
    }
  }

  // Handle direct time input
  const handleTimeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputTime(e.target.value)
  }

  const handleTimeInputBlur = () => {
    const seconds = parseTime(inputTime)
    if (seconds <= duration) {
      setPlayed(seconds / duration)
      playerRef.current?.seekTo(seconds)
    } else {
      setInputTime(formatTime(played * duration))
    }
  }

  // Handle video URL input
  const handleVideoUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setVideoUrl(videoInputUrl)
  }

  // Set loop start to current position
  const setLoopStartToCurrent = () => {
    const currentTime = played * duration
    setLoopStart(currentTime)
    if (loopEnd <= currentTime) {
      setLoopEnd(duration)
    }
  }

  // Set loop end to current position
  const setLoopEndToCurrent = () => {
    const currentTime = played * duration
    setLoopEnd(currentTime)
    if (loopStart >= currentTime) {
      setLoopStart(0)
    }
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
    <div className="grid gap-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-4">
          <form onSubmit={handleVideoUrlSubmit} className="flex gap-2">
            <Input
              type="text"
              value={videoInputUrl}
              onChange={(e) => setVideoInputUrl(e.target.value)}
              placeholder="Enter YouTube URL"
              className="flex-1"
            />
            <Button type="submit">Load</Button>
          </form>

          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            <ReactPlayer
              ref={playerRef}
              url={videoUrl}
              width="100%"
              height="100%"
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
                  if (videoData && videoData.getVideoData) {
                    setVideoTitle(videoData.getVideoData().title)
                  }
                } catch (error) {
                  console.error("Could not get video title:", error)
                }
              }}
              config={{
                youtube: {
                  playerVars: {
                    autoplay: 0,
                    modestbranding: 1,
                    controls: 0,
                    disablekb: 1,
                  },
                },
              }}
            />
          </div>

          {videoTitle && <h2 className="text-xl font-semibold mt-2">{videoTitle}</h2>}
        </div>

        <div className="flex flex-col gap-6">
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <div className="text-lg font-medium">Playback Controls</div>
              <div className="text-sm text-muted-foreground">
                {formatTime(played * duration)} / {formatTime(duration)}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Input
                value={inputTime}
                onChange={handleTimeInputChange}
                onBlur={handleTimeInputBlur}
                onKeyDown={(e) => e.key === "Enter" && handleTimeInputBlur()}
                className="w-20"
              />
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
                <RotateCcw className="h-4 w-4" />
              </Button>

              <Button variant="default" size="lg" onClick={() => setIsPlaying(!isPlaying)} className="flex-1">
                {isPlaying ? <Pause className="h-5 w-5 mr-2" /> : <Play className="h-5 w-5 mr-2" />}
                {isPlaying ? "Pause" : "Play"}
              </Button>

              <Button variant="outline" size="icon" onClick={jumpForward}>
                <RotateCw className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-sm font-medium">Speed:</div>
              <Select
                value={playbackRate.toString()}
                onValueChange={(value) => setPlaybackRate(Number.parseFloat(value))}
              >
                <SelectTrigger className="w-24">
                  <SelectValue placeholder="Speed" />
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
                <Repeat className={`h-4 w-4 mr-2 ${loopEnabled ? "text-white" : ""}`} />
                {loopEnabled ? "Loop On" : "Loop Off"}
              </Button>
            </div>
          </div>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="loop-settings">
              <AccordionTrigger>Loop Settings</AccordionTrigger>
              <AccordionContent>
                <div className="grid gap-4 pt-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium mb-2">Loop Start</div>
                      <div className="flex items-center gap-2">
                        <Input
                          value={formatTime(loopStart)}
                          onChange={(e) => {
                            const time = parseTime(e.target.value)
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
                          value={formatTime(loopEnd)}
                          onChange={(e) => {
                            const time = parseTime(e.target.value)
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
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-medium mb-2">Tips:</h3>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Use the slider or time input to navigate to specific parts of the song</li>
              <li>• Enable loop mode and set start/end points to practice difficult sections</li>
              <li>• Slow down the playback speed for detailed transcription</li>
              <li>• Use the 5-second jump buttons for quick navigation</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
