import { cn } from "@/lib/utils";
import {
  AnimatePresence,
  MotionValue,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
import React, { useRef, useState, createContext, useContext, useEffect, useCallback } from "react";

// Hook to detect dark mode
function useDarkMode() {
    const [isDark, setIsDark] = useState(() => 
        typeof document !== 'undefined' && document.body.classList.contains('dark-mode')
    );
    
    useEffect(() => {
        const checkDarkMode = () => {
            setIsDark(document.body.classList.contains('dark-mode'));
        };
        checkDarkMode();
        
        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        
        return () => observer.disconnect();
    }, []);
    
    return isDark;
}

interface DockContextValue {
  mouseX: MotionValue<number>;
  iconSize: number;
  iconMagnification: number;
  iconDistance: number;
  isDarkMode: boolean;
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
  const isDarkMode = useDarkMode();

  const isHorizontal = direction === "top" || direction === "bottom";

  return (
    <DockContext.Provider value={{ mouseX, iconSize, iconMagnification, iconDistance, isDarkMode }}>
      <motion.div
        onMouseMove={(e) => mouseX.set(isHorizontal ? e.pageX : e.pageY)}
        onMouseLeave={() => mouseX.set(Infinity)}
        className={cn(
          "mx-auto flex h-16 items-end gap-4 rounded-2xl border px-4 pb-3",
          isDarkMode ? "bg-slate-800 border-slate-700" : "bg-gray-50 border-gray-200",
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
  const { mouseX, iconSize, iconMagnification, iconDistance, isDarkMode } = useDock();
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
        "floating-dock-icon relative flex aspect-square items-center justify-center rounded-full",
        isDarkMode ? "bg-slate-700" : "bg-white",
        className
      )}
    >
      <AnimatePresence>
        {hovered && title && (
          <motion.div
            initial={{ opacity: 0, y: 10, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 2, x: "-50%" }}
            className={cn(
              "floating-dock-tooltip absolute left-1/2 w-fit rounded-md border px-2 py-0.5 text-xs whitespace-pre",
              isDarkMode 
                ? "border-blue-500 bg-slate-800 text-blue-400" 
                : "border-blue-700 bg-white text-blue-700"
            )}
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


// Auto-hide dock wrapper - shows when hovering near bottom center
interface DockAutoHideProps {
  children: React.ReactNode;
  triggerHeight?: number; // Height of the trigger zone at bottom
  triggerWidth?: number; // Width of the trigger zone (centered)
}

export const DockAutoHide: React.FC<DockAutoHideProps> = ({
  children,
  triggerHeight = 80,
  triggerWidth = 400,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;
    const mouseY = e.clientY;
    const mouseX = e.clientX;
    
    // Check if mouse is in the trigger zone (bottom center)
    const isInTriggerZone = 
      mouseY >= windowHeight - triggerHeight &&
      mouseX >= (windowWidth - triggerWidth) / 2 &&
      mouseX <= (windowWidth + triggerWidth) / 2;
    
    if (isInTriggerZone) {
      // Clear any pending hide timeout
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
      setIsVisible(true);
    }
  }, [triggerHeight, triggerWidth]);

  const handleDockMouseEnter = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  };

  const handleDockMouseLeave = () => {
    // Delay hiding to allow moving back to dock
    hideTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 300);
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [handleMouseMove]);

  return (
    <>
      {/* Invisible trigger zone indicator (optional visual hint) */}
      <div 
        className="fixed bottom-0 left-1/2 -translate-x-1/2 z-[899] pointer-events-none"
        style={{ width: triggerWidth, height: 4 }}
      >
        <motion.div
          className="w-full h-full rounded-t-full bg-blue-500/20"
          initial={{ opacity: 0, scaleX: 0.3 }}
          animate={{ 
            opacity: isVisible ? 0 : 0.5, 
            scaleX: isVisible ? 0 : 0.3 
          }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Dock container */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ 
              type: "spring", 
              stiffness: 400, 
              damping: 30,
              mass: 0.8
            }}
            className="floating-dock-container fixed bottom-8 left-0 right-0 z-[900] flex justify-center pointer-events-none"
            onMouseEnter={handleDockMouseEnter}
            onMouseLeave={handleDockMouseLeave}
          >
            <div className="pointer-events-auto">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
