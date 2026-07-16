"use client";

import { TextShimmer } from "./ui/shimmer-text";

// Adapter component: the charts package expects a `text` prop,
// but TextShimmer uses `children`. This bridges the two APIs.
export function ShimmeringText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  return <TextShimmer className={className}>{text}</TextShimmer>;
}
