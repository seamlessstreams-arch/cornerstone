"use client";

import { Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DictationControlsProps {
  isListening: boolean;
  onStart: () => void;
  onStop: () => void;
  mode: "append" | "replace";
  onModeChange: (mode: "append" | "replace") => void;
}

export function DictationControls({
  isListening,
  onStart,
  onStop,
  mode,
  onModeChange,
}: DictationControlsProps) {
  return (
    <div className="flex items-center gap-2">
      <Button size="sm" variant={isListening ? "destructive" : "outline"} onClick={isListening ? onStop : onStart}>
        {isListening ? <MicOff className="h-4 w-4 mr-1" /> : <Mic className="h-4 w-4 mr-1" />}
        {isListening ? "Stop" : "Dictate"}
      </Button>
      <select
        className="h-8 rounded-md border bg-white px-2 text-xs"
        value={mode}
        onChange={(e) => onModeChange(e.target.value as "append" | "replace")}
      >
        <option value="append">Append Mode</option>
        <option value="replace">Replace Mode</option>
      </select>
      {isListening && <span className="text-xs text-red-600">Listening...</span>}
    </div>
  );
}
