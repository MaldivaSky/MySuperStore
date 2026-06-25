"use client";

import React from "react";

interface LoaderProps {
  fullScreen?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  text?: string;
}

export function BrandLoader({ fullScreen = false, size = "md", text }: LoaderProps) {
  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-32 h-32",
    lg: "w-48 h-48",
    xl: "w-64 h-64",
  };

  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className={`relative ${sizeClasses[size]} flex items-center justify-center`}>
        <video 
          autoPlay 
          loop 
          muted 
          playsInline
          className="w-full h-full object-contain"
        >
          {/* Prioriza o WebM transparente, se suportado, senão cai no MP4 padrão */}
          <source src="/brand/MySuperStore-Vinheta-1080x1080-transparente.webm" type="video/webm" />
          <source src="/brand/MySuperStore-Loading-1080x1080.mp4" type="video/mp4" />
        </video>
      </div>
      {text && <p className="text-sm font-semibold text-muted-foreground animate-pulse">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[9999] bg-background/80 backdrop-blur-md flex items-center justify-center">
        {content}
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8">
      {content}
    </div>
  );
}
