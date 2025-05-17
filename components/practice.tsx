"use client"

import type React from "react"

import {useState, useRef} from "react"
import ReactPlayer from "react-player/youtube"
import {Play, Pause, RotateCcw, RotateCw, Repeat, Save, Pin} from "lucide-react"
import {Slider} from "@/components/ui/slider"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {Session, storageManager} from "@/lib/storage"

interface YouTubePracticeProps {
  defaultVideoUrl: string;
  setSessionAction: (session: Session) => void;
  session?: Session
}

const makeVideoUrlFromId = (videoId: string): string => `https://www.youtube.com/watch?v=${videoId}`;

export function Practice({defaultVideoUrl, setSessionAction, session}: YouTubePracticeProps) {
  const [videoUrl, setVideoUrl] = useState(session?.videoId ? makeVideoUrlFromId(session.videoId) : defaultVideoUrl)
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [played, setPlayed] = useState(0)
  const [seeking, setSeeking] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(session?.playbackRate ?? 1)
  const [videoTitle, setVideoTitle] = useState(session?.videoTitle ?? "")
  const [loopEnabled, setLoopEnabled] = useState(false)
  const [loopStart, setLoopStart] = useState(session?.loopStart ?? 0)
  const [loopEnd, setLoopEnd] = useState(session?.loopEnd ?? 0)
  const [videoInputUrl, setVideoInputUrl] = useState(session?.videoId ? makeVideoUrlFromId(session.videoId) : defaultVideoUrl)
  const [videoId, setVideoId] = useState(session?.videoId ?? "");
  const [isSaving, setIsSaving] = useState(false)

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

  // Save current session with note
  const handleSave = async () => {
    if (!videoId) return;

    let note = prompt("Add notes about this practice session\ntest", "Improved fluidity...");
    if (note == null || note == "") return;

    setIsSaving(true);
    try {
      const session = {
        timestamp: Date.now(),
        videoId,
        videoTitle,
        loopStart,
        loopEnd,
        playbackRate,
        note
      }
      await storageManager.saveSession(session);
      setSessionAction(session)
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid gap-8 max-w-2xl mx-auto">
      <div className="flex flex-col gap-8">
        <form onSubmit={handleVideoUrlSubmit} className="flex gap-2">
          <Input
            type="text"
            value={videoInputUrl}
            onChange={(e) => setVideoInputUrl(e.target.value)}
            placeholder="Enter YouTube URL"
            className="flex-1"
            disabled={isSaving || !videoId}
          />
          <Button type="submit" disabled={isSaving || !videoId}>
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
              try {
                const videoData = player.getInternalPlayer()
                setVideoTitle(videoData?.getVideoData().title)
                setVideoId(videoData?.getVideoData().video_id)
                setLoopEnabled(false)
                setLoopStart(session?.loopStart ?? 0)
                setLoopEnd(session?.loopEnd ?? 0)
                setPlaybackRate(session?.playbackRate ?? 1)
              } catch (error) {
                console.error(error) // TODO: real error handling
              }
            }}
            config={{
              // @ts-expect-error Bad Typings
              youtube: {
                playerVars: {
                  autoplay: 0,
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

      <div className="flex flex-col gap-8 space-y-4">
        <div className="grid gap-8">
          <div className="flex items-center justify-between">
            <div className="text-lg font-medium">Playback Controls</div>
            <div className="text-sm text-muted-foreground">
              {formatTime(played * duration)} / {formatTime(duration)}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              {loopEnabled && (
                <div
                  className="absolute top-1/2 -translate-y-1/2 h-2 bg-primary/20 rounded-full pointer-events-none"
                  style={{
                    left: `${(loopStart / duration) * 100}%`,
                    right: `${100 - (loopEnd / duration) * 100}%`,
                  }}
                />
              )}
              <Slider
                value={[played * 100]}
                min={0}
                max={100}
                step={0.1}
                onValueChange={handleSeekChange}
                onValueCommit={handleSeekMouseUp}
                className="relative"
              />
              {loopEnabled && (
                <>
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-1 h-4 bg-primary rounded"
                    style={{left: `${(loopStart / duration) * 100}%`}}
                  />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-1 h-4 bg-primary rounded"
                    style={{left: `${(loopEnd / duration) * 100}%`}}
                  />
                </>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <Button disabled={isSaving || !videoId} variant="outline" size="icon" onClick={jumpBack}>
              <RotateCcw className="h-4 w-4"/>
            </Button>

            <Button disabled={isSaving || !videoId} size="lg" onClick={() => setIsPlaying(!isPlaying)}
                    className="flex-1">
              {isPlaying ? <Pause className="h-5 w-5 mr-2"/> : <Play className="h-5 w-5 mr-2"/>}
              {isPlaying ? "Pause" : "Play"}
            </Button>

            <Button disabled={isSaving || !videoId} variant="outline" size="icon" onClick={jumpForward}>
              <RotateCw className="h-4 w-4"/>
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm font-medium">Speed:</div>
            <Select
              value={playbackRate.toString()}
              disabled={isSaving || !videoId}
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

            <Button disabled={isSaving || !videoId} variant={loopEnabled ? "default" : "outline"} onClick={toggleLoop}
                    className="ml-auto">
              <Repeat className={`h-4 w-4 mr-2 ${loopEnabled ? "text-white" : ""}`}/>
              {loopEnabled ? "Loop On" : "Loop Off"}
            </Button>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <div className="text-sm font-medium mb-2">Loop Start</div>
              <div className="flex items-center gap-2">
                <Input
                  disabled={isSaving || !videoId}
                  value={formatLoopTime(loopStart)}
                  onChange={(e) => {
                    const time = parseLoopTime(e.target.value)
                    if (!isNaN(time)) setLoopStart(time)
                  }}
                  className="flex-1"
                />
                <Button disabled={isSaving || !videoId} variant="outline" size="sm" onClick={setLoopStartToCurrent}>
                  <Pin className="h-4 w-4 mr-2"/>
                  Set Current
                </Button>
              </div>
            </div>

            <div>
              <div className="text-sm font-medium mb-2">Loop End</div>
              <div className="flex items-center gap-2">
                <Input
                  disabled={isSaving || !videoId}
                  value={formatLoopTime(loopEnd)}
                  onChange={(e) => {
                    const time = parseLoopTime(e.target.value)
                    if (!isNaN(time)) setLoopEnd(time)
                  }}
                  className="flex-1"
                />
                <Button disabled={isSaving || !videoId} variant="outline" size="sm" onClick={setLoopEndToCurrent}>
                  <Pin className="h-4 w-4 mr-2"/>
                  Set Current
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 pb-16">
          <Button onClick={handleSave} disabled={isSaving || !videoId} size="lg" className="md:w-1/3 mx-auto">
            <Save className="h-4 w-4 mr-2"/>
            Save Current Session
          </Button>
        </div>
      </div>
    </div>
  )
}
