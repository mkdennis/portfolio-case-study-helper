"use client";

import * as React from "react";
import { Mic } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";

interface VoiceMicButtonProps {
  onTranscript: (transcript: string) => void;
  className?: string;
  disabled?: boolean;
}

export function VoiceMicButton({
  onTranscript,
  className,
  disabled = false,
}: VoiceMicButtonProps) {
  const {
    isListening,
    isSupported,
    transcript,
    startListening,
    stopListening,
  } = useSpeechRecognition();

  const handleClick = () => {
    if (isListening) {
      stopListening();
      if (transcript.trim()) {
        onTranscript(transcript);
      }
    } else {
      startListening();
    }
  };

  // Don't render if browser doesn't support Speech Recognition
  if (!isSupported) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        "flex items-center gap-2 rounded-full transition-all duration-200",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        !isListening && [
          "bg-white text-foreground",
          "border border-border shadow-sm",
          "hover:bg-muted",
          "p-2",
        ],
        isListening && ["bg-foreground text-background", "px-4 py-2"],
        className
      )}
      aria-label={isListening ? "Stop recording" : "Start voice recording"}
    >
      {isListening ? (
        <>
          <div className="flex items-center gap-0.5 h-4">
            <span className="voice-wave-bar w-0.5 bg-current rounded-full animate-voice-wave-1" />
            <span className="voice-wave-bar w-0.5 bg-current rounded-full animate-voice-wave-2" />
            <span className="voice-wave-bar w-0.5 bg-current rounded-full animate-voice-wave-3" />
            <span className="voice-wave-bar w-0.5 bg-current rounded-full animate-voice-wave-4" />
            <span className="voice-wave-bar w-0.5 bg-current rounded-full animate-voice-wave-5" />
          </div>
          <span className="text-sm font-medium whitespace-nowrap">
            Start Speaking
          </span>
        </>
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </button>
  );
}
