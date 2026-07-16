import * as React from "react";
import { motion } from "motion/react";

const SvgVideo = ({ active, ...props }: React.SVGProps<SVGSVGElement> & { active?: boolean }) => {
  const pathData = "m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z";

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      {...props}
    >
      <motion.path
        initial={false}
        animate={{ fill: active ? "currentColor" : "transparent" }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        d={pathData}
      />
    </svg>
  );
};

export default SvgVideo;
