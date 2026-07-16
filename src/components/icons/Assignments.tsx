import * as React from "react";
import { motion } from "motion/react";

const SvgAssignments = ({ active, ...props }: React.SVGProps<SVGSVGElement> & { active?: boolean }) => {
  const mainShape = "M4 8c0-2.828 0-4.243.879-5.121C5.757 2 7.172 2 10 2h4c2.828 0 4.243 0 5.121.879C20 3.757 20 5.172 20 8v8c0 2.828 0 4.243-.879 5.121C18.243 22 16.828 22 14 22h-4c-2.828 0-4.243 0-5.121-.879C4 20.243 4 18.828 4 16z";
  const innerLine1 = "M19.898 16h-12c-.93 0-1.395 0-1.777.102A3 3 0 0 0 4 18.224";
  const innerLine2 = "M8 7h8M8 10.5h5M19.5 19H8";

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      {...props}
    >
      <defs>
        {/* Mask to "punch out" the lines from the solid filled shape */}
        <mask id="assignment-mask">
          <rect width="24" height="24" fill="white" />
          <path stroke="black" strokeWidth={1.5} fill="none" d={innerLine1} />
          <path stroke="black" strokeLinecap="round" strokeWidth={1.5} fill="none" d={innerLine2} />
        </mask>
      </defs>

      {/* Outline state */}
      <motion.g
        initial={false}
        animate={{ opacity: active ? 0 : 1 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
      >
        <path fill="none" stroke="currentColor" strokeWidth={1.5} d={mainShape} />
        <path fill="none" stroke="currentColor" strokeWidth={1.5} d={innerLine1} />
        <path fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth={1.5} d={innerLine2} />
      </motion.g>

      {/* Filled state */}
      <motion.g
        initial={false}
        animate={{ opacity: active ? 1 : 0 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
      >
        <path fill="currentColor" mask="url(#assignment-mask)" d={mainShape} />
      </motion.g>
    </svg>
  );
};

export default SvgAssignments;
