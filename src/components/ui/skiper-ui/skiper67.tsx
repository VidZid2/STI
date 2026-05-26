"use client";

import { AnimatePresence, motion, useSpring } from "framer-motion";
import { Play, Plus } from "lucide-react";
import {
  MediaControlBar,
  MediaController,
  MediaMuteButton,
  MediaPlayButton,
  MediaSeekBackwardButton,
  MediaSeekForwardButton,
  MediaTimeDisplay,
  MediaTimeRange,
  MediaVolumeRange,
} from "media-chrome/react";
import type { ComponentProps } from "react";
import React, { useState } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

export type VideoPlayerProps = ComponentProps<typeof MediaController>;

export const VideoPlayer = ({ style, ...props }: VideoPlayerProps) => (
  <MediaController
    style={{
      ...style,
    }}
    {...props}
  />
);

export type VideoPlayerControlBarProps = ComponentProps<typeof MediaControlBar>;

export const VideoPlayerControlBar = (props: VideoPlayerControlBarProps) => (
  <MediaControlBar {...props} />
);

export type VideoPlayerTimeRangeProps = ComponentProps<typeof MediaTimeRange>;

export const VideoPlayerTimeRange = ({
  className,
  ...props
}: VideoPlayerTimeRangeProps) => (
  <MediaTimeRange
    className={cn(
      "[--media-range-thumb-opacity:0] [--media-range-track-height:2px]",
      className,
    )}
    {...props}
  />
);

export type VideoPlayerTimeDisplayProps = ComponentProps<
  typeof MediaTimeDisplay
>;

export const VideoPlayerTimeDisplay = ({
  className,
  ...props
}: VideoPlayerTimeDisplayProps) => (
  <MediaTimeDisplay className={cn("p-2.5", className)} {...props} />
);

export type VideoPlayerVolumeRangeProps = ComponentProps<
  typeof MediaVolumeRange
>;

export const VideoPlayerVolumeRange = ({
  className,
  ...props
}: VideoPlayerVolumeRangeProps) => (
  <MediaVolumeRange className={cn("p-2.5", className)} {...props} />
);

export type VideoPlayerPlayButtonProps = ComponentProps<typeof MediaPlayButton>;

export const VideoPlayerPlayButton = ({
  className,
  ...props
}: VideoPlayerPlayButtonProps) => (
  <MediaPlayButton className={cn("", className)} {...props} />
);

export type VideoPlayerSeekBackwardButtonProps = ComponentProps<
  typeof MediaSeekBackwardButton
>;

export const VideoPlayerSeekBackwardButton = ({
  className,
  ...props
}: VideoPlayerSeekBackwardButtonProps) => (
  <MediaSeekBackwardButton className={cn("p-2.5", className)} {...props} />
);

export type VideoPlayerSeekForwardButtonProps = ComponentProps<
  typeof MediaSeekForwardButton
>;

export const VideoPlayerSeekForwardButton = ({
  className,
  ...props
}: VideoPlayerSeekForwardButtonProps) => (
  <MediaSeekForwardButton className={cn("p-2.5", className)} {...props} />
);

export type VideoPlayerMuteButtonProps = ComponentProps<typeof MediaMuteButton>;

export const VideoPlayerMuteButton = ({
  className,
  ...props
}: VideoPlayerMuteButtonProps) => (
  <MediaMuteButton className={cn("", className)} {...props} />
);

export type VideoPlayerContentProps = ComponentProps<"video">;

export const VideoPlayerContent = ({
  className,
  ...props
}: VideoPlayerContentProps) => (
  <video className={cn("mb-0 mt-0", className)} {...props} />
);

export interface Skiper67Props {
  src?: string;
  placeholderText?: string;
  className?: string;
}

export const Skiper67 = ({ src, placeholderText = "Click to play", className }: Skiper67Props) => {
  const [showVideoPopOver, setShowVideoPopOver] = useState(false);
  const layoutId = React.useId();

  const SPRING = {
    mass: 0.1,
  };

  const x = useSpring(0, SPRING);
  const y = useSpring(0, SPRING);
  const opacity = useSpring(0, SPRING);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    opacity.set(1);
    const bounds = e.currentTarget.getBoundingClientRect();
    x.set(e.clientX - bounds.left);
    y.set(e.clientY - bounds.top);
  };

  return (
    <div className={cn("relative flex h-full w-full items-center justify-center overflow-hidden cursor-pointer", className)}>
      <AnimatePresence>
        {showVideoPopOver && (
          <VideoPopOver src={src || ""} setShowVideoPopOver={setShowVideoPopOver} layoutId={layoutId} />
        )}
      </AnimatePresence>
      <motion.div
        layoutId={layoutId}
        onMouseMove={handlePointerMove}
        onMouseLeave={() => {
          opacity.set(0);
        }}
        onClick={() => setShowVideoPopOver(true)}
        className="w-full h-full relative group"
      >
        <motion.div
          style={{ x, y, opacity }}
          className="absolute z-20 flex w-fit select-none items-center justify-center gap-2 p-3 rounded-full bg-black/50 backdrop-blur-md text-sm text-white pointer-events-none"
        >
          <Play className="size-4 fill-white" /> {placeholderText}
        </motion.div>
        {src ? (
          <video
            autoPlay
            muted
            playsInline
            loop
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          >
            <source src={src} />
          </video>
        ) : (
          <div className="h-full w-full bg-black/5 flex items-center justify-center">
            <span className="text-sm text-slate-400 font-medium">{placeholderText}</span>
          </div>
        )}
      </motion.div>
    </div>
  );
};

const VideoPopOver = ({
  src,
  setShowVideoPopOver,
  layoutId,
}: {
  src: string;
  setShowVideoPopOver: (showVideoPopOver: boolean) => void;
  layoutId: string;
}) => {
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-lg"
        onClick={() => setShowVideoPopOver(false)}
      ></motion.div>
      <motion.div
        layoutId={layoutId}
        transition={{
          duration: 0.6,
          type: "spring",
          stiffness: 250,
          damping: 30,
        }}
        className="relative aspect-video w-[95vw] max-w-6xl overflow-hidden rounded-xl shadow-2xl z-10"
      >
        <VideoPlayer style={{ width: "100%", height: "100%" }}>
          <VideoPlayerContent
            src={src}
            autoPlay
            slot="media"
            className="w-full h-full object-cover"
            style={{ width: "100%", height: "100%" }}
          />

          <span
            onClick={() => setShowVideoPopOver(false)}
            className="absolute right-4 top-4 z-50 cursor-pointer rounded-full p-2 bg-black/40 backdrop-blur-md transition-colors hover:bg-black/60"
          >
            <Plus className="size-6 rotate-45 text-white" />
          </span>
          <VideoPlayerControlBar className="absolute bottom-0 left-1/2 flex w-full max-w-6xl -translate-x-1/2 items-center justify-center px-5 py-4 bg-gradient-to-t from-black/80 to-transparent">
            <VideoPlayerPlayButton className="h-6 w-6 text-white hover:text-white/80 transition-colors" />
            <VideoPlayerTimeRange className="mx-4 flex-1 [--media-range-thumb-opacity:0] [--media-range-track-height:3px] text-white" />
            <VideoPlayerMuteButton className="size-6 text-white hover:text-white/80 transition-colors" />
          </VideoPlayerControlBar>
        </VideoPlayer>
      </motion.div>
    </div>,
    document.body
  );
};
