import React from "react";

interface MarqueeProps {
  children: React.ReactNode;
  direction?: "left" | "right";
  pauseOnHover?: boolean;
  speed?: number; // duration in seconds
  className?: string;
}

export function Marquee({
  children,
  direction = "left",
  pauseOnHover = true,
  speed = 28,
  className = "",
}: MarqueeProps) {
  return (
    <div
      className={`group relative flex overflow-hidden select-none [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)] ${className}`}
    >
      <div
        className={`flex min-w-full shrink-0 items-center justify-around gap-6 animate-marquee ${
          direction === "right" ? "animate-marquee-reverse" : ""
        } ${pauseOnHover ? "group-hover:[animation-play-state:paused]" : ""}`}
        style={{ animationDuration: `${speed}s` }}
      >
        {children}
      </div>
      <div
        aria-hidden="true"
        className={`flex min-w-full shrink-0 items-center justify-around gap-6 animate-marquee ${
          direction === "right" ? "animate-marquee-reverse" : ""
        } ${pauseOnHover ? "group-hover:[animation-play-state:paused]" : ""}`}
        style={{ animationDuration: `${speed}s` }}
      >
        {children}
      </div>
    </div>
  );
}
