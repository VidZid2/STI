import * as React from "react";
import { motion } from "motion/react";

const SvgCertificate = ({ active, ...props }: React.SVGProps<SVGSVGElement> & { active?: boolean }) => {
  const rectBody = "M18 10V5.75A2.75 2.75 0 0 0 15.25 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.25";
  const sealCircle = "M18 18a4 4 0 1 0 0-8 4 4 0 0 0 0 8z";
  const sealRibbon = "M15.8 17.34l-1.1 4.1 3.3-2.2 3.3 2.2-1.1-4.1";
  const innerLine1 = "M6.75 8h6";
  const innerLine2 = "M6.75 13h4.5";

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      {...props}
    >
      <defs>
        <mask id="certificate-mask">
          {/* Base solid white shapes to create the filled silhouette */}
          <rect x="2" y="3" width="16" height="15" rx="2.75" fill="white" />
          <path d={sealCircle} fill="white" />
          <path d={sealRibbon} fill="white" stroke="white" strokeWidth={1.5} strokeLinejoin="round" />
          
          {/* Punch out lines in black so they become transparent cutouts */}
          <path d={innerLine1} stroke="black" strokeLinecap="round" strokeWidth={1.5} fill="none" />
          <path d={innerLine2} stroke="black" strokeLinecap="round" strokeWidth={1.5} fill="none" />
          
          {/* Punch out the left arc of the seal to separate it from the diploma body */}
          <path d="M18 18a4 4 0 0 1 0-8" stroke="black" strokeWidth={1.5} fill="none" />
          
          {/* Punch out the bottom of the seal to separate it from the ribbon */}
          <path d="M14 14a4 4 0 0 0 8 0" stroke="black" strokeWidth={1.5} fill="none" />
        </mask>
      </defs>

      {/* Outline state */}
      <motion.g
        initial={false}
        animate={{ opacity: active ? 0 : 1 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
      >
        <path d={rectBody} stroke="currentColor" strokeWidth={1.5} fill="none" />
        <path d={sealCircle} stroke="currentColor" strokeWidth={1.5} fill="none" />
        <path d={sealRibbon} stroke="currentColor" strokeLinejoin="round" strokeWidth={1.5} fill="none" />
        <path d={innerLine1} stroke="currentColor" strokeLinecap="round" strokeWidth={1.5} fill="none" />
        <path d={innerLine2} stroke="currentColor" strokeLinecap="round" strokeWidth={1.5} fill="none" />
      </motion.g>

      {/* Filled state */}
      <motion.g
        initial={false}
        animate={{ opacity: active ? 1 : 0 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
      >
        <rect width="24" height="24" fill="currentColor" mask="url(#certificate-mask)" />
      </motion.g>
    </svg>
  );
};

export default SvgCertificate;
