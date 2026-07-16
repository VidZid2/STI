import * as React from "react";
import { motion } from "motion/react";

const SvgDiscussions = ({ active, ...props }: React.SVGProps<SVGSVGElement> & { active?: boolean }) => {
  const innerPath = "M9 9c0-3.5 5.5-3.5 5.5 0 0 2.5-2.5 2-2.5 5M12 18.01l.01-.011";
  const outerPath = "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12c0 1.821.487 3.53 1.338 5L2.5 21.5l4.5-.838A9.96 9.96 0 0 0 12 22";

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      {...props}
    >
      <defs>
        <mask id="discussions-mask">
          <rect width="24" height="24" fill="white" />
          <path stroke="black" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} fill="none" d={innerPath} />
        </mask>
      </defs>

      {/* Outline state */}
      <motion.g
        initial={false}
        animate={{ opacity: active ? 0 : 1 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
      >
        <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={innerPath} />
        <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={outerPath} />
      </motion.g>

      {/* Filled state */}
      <motion.g
        initial={false}
        animate={{ opacity: active ? 1 : 0 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
      >
        <path fill="currentColor" mask="url(#discussions-mask)" d={outerPath} />
      </motion.g>
    </svg>
  );
};

export default SvgDiscussions;
