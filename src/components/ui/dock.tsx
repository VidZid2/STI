import { cn } from "@/lib/utils";
import {
  AnimatePresence,
  MotionValue,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
import React, { useRef, useState, createContext, useContext } from "react";

interface DockContextValue {
  mouseX: MotionValue<number>;
  iconSize: number;
  iconMagnification: number;
  iconDistance: number;
}

const DockContext = createContext<DockContextValue | null>(null);

const useDock = () => {
  const context = useContext(DockContext);
  if (!context) {
    throw new Error("DockIcon must be used within a Dock");
  }
  return context;
};

interface DockProps {
  direction?: "top" | "bottom" | "left" | "right";
  iconSize?: number;
  iconMagnification?: number;
  iconDistance?: number;
  className?: string;
  children: React.ReactNode;
}

export const Dock: React.FC<DockProps> = ({
  direction = "bottom",
  iconSize = 48,
  iconMagnification = 80,
  iconDistance = 150,
  className,
  children,
}) => {
  const mouseX = useMotionValue(Infinity);

  const isHorizontal = direction === "top" || direction === "bottom";

  return (
    <DockContext.Provider value={{ mouseX, iconSize, iconMagnification, iconDistance }}>
      <motion.div
        onMouseMove={(e) => mouseX.set(isHorizontal ? e.pageX : e.pageY)}
        onMouseLeave={() => mouseX.set(Infinity)}
        className={cn(
          "mx-auto flex h-16 items-end gap-4 rounded-2xl border bg-gray-50 px-4 pb-3",
          isHorizontal ? "flex-row" : "flex-col",
          className
        )}
      >
        {children}
      </motion.div>
    </DockContext.Provider>
  );
};


interface DockIconProps {
  className?: string;
  title?: string;
  children: React.ReactNode;
}

const springConfig = { stiffness: 200, damping: 20, mass: 0.5 };

export const DockIcon: React.FC<DockIconProps> = ({ className, title, children }) => {
  const { mouseX, iconSize, iconMagnification, iconDistance } = useDock();
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const size = useTransform(
    distance,
    [-iconDistance, 0, iconDistance],
    [iconSize, iconMagnification, iconSize]
  );

  const animatedSize = useSpring(size, springConfig);

  return (
    <motion.div
      ref={ref}
      style={{ width: animatedSize, height: animatedSize }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "floating-dock-icon relative flex aspect-square items-center justify-center rounded-full bg-gray-200",
        className
      )}
    >
      <AnimatePresence>
        {hovered && title && (
          <motion.div
            initial={{ opacity: 0, y: 10, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 2, x: "-50%" }}
            className="floating-dock-tooltip absolute left-1/2 w-fit rounded-md border border-blue-700 bg-white px-2 py-0.5 text-xs whitespace-pre text-blue-700"
            style={{ bottom: "calc(100% + 8px)" }}
          >
            {title}
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </motion.div>
  );
};
