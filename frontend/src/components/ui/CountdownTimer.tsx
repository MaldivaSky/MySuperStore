"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface CountdownTimerProps {
  initialSeconds: number;
  className?: string;
  onExpiry?: () => void;
}

export function CountdownTimer({ initialSeconds, className = "", onExpiry }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);

  useEffect(() => {
    if (initialSeconds <= 0) {
      setTimeLeft(0);
      return;
    }

    const targetTime = Date.now() + initialSeconds * 1000;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.round((targetTime - Date.now()) / 1000));
      setTimeLeft(remaining);

      if (remaining === 0) {
        clearInterval(interval);
        if (onExpiry) {
          onExpiry();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [initialSeconds, onExpiry]);

  if (timeLeft <= 0) {
    return (
      <span className="text-red-500 font-bold flex items-center gap-1">
        <Clock className="w-3.5 h-3.5" /> Oferta Encerrada
      </span>
    );
  }

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  const pad = (num: number) => String(num).padStart(2, "0");

  return (
    <div className={`flex items-center gap-1.5 font-mono text-xs font-extrabold tracking-wider ${className}`}>
      <Clock className="w-3.5 h-3.5 animate-pulse text-yellow-500" />
      <span>Termina em:</span>
      <span className="bg-black/40 text-yellow-400 px-1.5 py-0.5 rounded border border-yellow-500/25">
        {pad(hours)}h
      </span>
      <span className="text-neutral-400">:</span>
      <span className="bg-black/40 text-yellow-400 px-1.5 py-0.5 rounded border border-yellow-500/25">
        {pad(minutes)}m
      </span>
      <span className="text-neutral-400">:</span>
      <span className="bg-black/40 text-yellow-400 px-1.5 py-0.5 rounded border border-yellow-500/25 animate-pulse">
        {pad(seconds)}s
      </span>
    </div>
  );
}
