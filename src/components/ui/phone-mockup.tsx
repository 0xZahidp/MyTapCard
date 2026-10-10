import React from "react";

interface PhoneMockupProps {
  children?: React.ReactNode;
  src?: string;
  className?: string;
}

export function PhoneMockup({ children, src, className = "" }: PhoneMockupProps) {
  return (
    <div className={`relative mx-auto flex items-center justify-center p-4 ${className}`}>
      {/* Outer Phone Frame */}
      <div className="relative w-[340px] sm:w-[380px] h-[680px] sm:h-[760px] rounded-[52px] bg-neutral-900 p-3.5 shadow-2xl ring-1 ring-white/20 shadow-neutral-950/50">
        {/* Subtle Outer Frame Buttons */}
        {/* Volume Up */}
        <div className="absolute -left-[3px] top-[125px] h-10 w-[3px] rounded-l-sm bg-neutral-700" />
        {/* Volume Down */}
        <div className="absolute -left-[3px] top-[180px] h-10 w-[3px] rounded-l-sm bg-neutral-700" />
        {/* Power Button */}
        <div className="absolute -right-[3px] top-[140px] h-14 w-[3px] rounded-r-sm bg-neutral-700" />

        {/* Inner Bezel */}
        <div className="relative h-full w-full overflow-hidden rounded-[40px] bg-background border border-neutral-800 shadow-inner">
          {/* Dynamic Island */}
          <div className="pointer-events-none absolute left-1/2 top-3 z-30 flex h-6 w-24 -translate-x-1/2 items-center justify-between rounded-full bg-black px-2 shadow-md">
            <div className="h-2.5 w-2.5 rounded-full bg-neutral-900/80 ring-1 ring-neutral-700/50" />
            <div className="h-2 w-2 rounded-full bg-blue-950/50 ring-1 ring-blue-500/20" />
          </div>

          {/* Screen Content */}
          <div className="h-full w-full overflow-y-auto overflow-x-hidden pt-7 scrollbar-none">
            {src ? (
              <iframe
                src={src}
                title="Interactive phone preview"
                className="h-full w-full border-none"
              />
            ) : (
              children
            )}
          </div>

          {/* Bottom Home Indicator Bar */}
          <div className="pointer-events-none absolute bottom-2 left-1/2 z-30 h-1 w-32 -translate-x-1/2 rounded-full bg-neutral-400/40 backdrop-blur" />
        </div>
      </div>
    </div>
  );
}
