import * as React from "react";
import { motion } from "motion/react";

const SvgCourses = ({ active, ...props }: React.SVGProps<SVGSVGElement> & { active?: boolean }) => {
  const outlinePath = "M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25";
  const filledPath = "M11.25 4.533A9.707 9.707 0 0 0 6 3a9.735 9.735 0 0 0-3.25.555.75.75 0 0 0-.5.707v14.25a.75.75 0 0 0 1 .707A8.237 8.237 0 0 1 6 18.75c1.995 0 3.823.707 5.25 1.886V4.533ZM12.75 20.636A8.214 8.214 0 0 1 18 18.75c.966 0 1.89.166 2.75.47a.75.75 0 0 0 1-.708V4.262a.75.75 0 0 0-.5-.707A9.735 9.735 0 0 0 18 3a9.707 9.707 0 0 0-5.25 1.533v16.103Z";

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
        d={filledPath}
      />
    </svg>
  );
};

export default SvgCourses;
