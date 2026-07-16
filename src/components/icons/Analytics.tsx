import * as React from "react";
import { motion } from "motion/react";

const SvgAnalytics = ({ active, ...props }: React.SVGProps<SVGSVGElement> & { active?: boolean }) => {
  const outlinePath = "M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5m.75-9 3-3 2.148 2.148A12.061 12.061 0 0 1 16.5 7.605";
  const filledPath = "M2.25 2.25a.75.75 0 0 0 0 1.5H3v10.5a3 3 0 0 0 3 3h1.21l-1.172 3.513a.75.75 0 0 0 1.424.474l.329-.987h8.418l.33.987a.75.75 0 0 0 1.422-.474l-1.17-3.513H18a3 3 0 0 0 3-3V3.75h.75a.75.75 0 0 0 0-1.5H2.25Zm6.54 15h6.42l.5 1.5H8.29l.5-1.5Zm8.085-8.995a.75.75 0 1 0-.75-1.299 12.81 12.81 0 0 0-3.558 3.05L11.03 8.47a.75.75 0 0 0-1.06 0l-3 3a.75.75 0 1 0 1.06 1.06l2.47-2.47 1.617 1.618a.75.75 0 0 0 1.146-.102 11.312 11.312 0 0 1 3.612-3.321Z";

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
        animate={{ opacity: active ? 0 : 1 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        d={outlinePath}
      />
      <motion.path
        initial={false}
        animate={{ opacity: active ? 1 : 0 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
        d={filledPath}
      />
    </svg>
  );
};

export default SvgAnalytics;
