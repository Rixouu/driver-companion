"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mic, Square, Play, Trash2 } from "lucide-react"
import { useLanguage } from "@/components/providers/language-provider"
import { useToast } from "@/components/ui/use-toast"
import { formatDuration } from "@/lib/utils"

interface VoiceRecorderProps {
  sectionId: string
  onRecordingAdd: (recording: VoiceRecording) => void
  onRecordingRemove: (recordingId: string) => void
}

interface VoiceRecording {
  id: string
  url: string
  timestamp: string
  duration: number
  sectionId: string
}

export function VoiceRecorder({ sectionId, onRecordingAdd, onRecordingRemove }: VoiceRecorderProps) {
  const { t } = useLanguage()
  const { toast } = useToast()
  const [isRecording, setIsRecording] = useState(false)
  const [recordings, setRecordings] = useState<VoiceRecording[]>([])
  const [currentTime, setCurrentTime] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout>()

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      
      mediaRecorderRef.current.ondataavailable = (e) => {
        chunksRef.current.push(e.data)
      }

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" })
        const url = URL.createObjectURL(blob)
        
        const recording: VoiceRecording = {
          id: Date.now().toString(),
          url,
          timestamp: new Date().toISOString(),
          duration: currentTime,
          sectionId,
        }

        setRecordings((prev) => [...prev, recording])
        onRecordingAdd(recording)
        chunksRef.current = []
        setCurrentTime(0)
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
      
      // Start timer
      timerRef.current = setInterval(() => {
        setCurrentTime((prev) => prev + 1)
      }, 1000)

    } catch (error) {
      toast({
        title: t("errors.error"),
        description: t("inspections.voice.microphoneError"),
        variant: "destructive",
      })
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
      clearInterval(timerRef.current)
      setIsRecording(false)
    }
  }

  const handleRemove = (recordingId: string) => {
    setRecordings(recordings.filter(r => r.id !== recordingId))
    onRecordingRemove(recordingId)
  }

  const playRecording = (url: string) => {
    const audio = new Audio(url)
    audio.play()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("inspections.voice.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            {isRecording ? (
              <>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={stopRecording}
                >
                  <Square className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium">
                  {formatDuration(currentTime)}
                </span>
              </>
            ) : (
              <Button
                variant="outline"
                size="icon"
                onClick={startRecording}
              >
                <Mic className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="space-y-2">
            {recordings.map((recording) => (
              <div
                key={recording.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => playRecording(recording.url)}
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                  <div>
                    <p className="text-sm font-medium">
                      {formatDuration(recording.duration)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(recording.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemove(recording.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 