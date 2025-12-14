import { cn } from "@/lib/utils";
import { IconLayoutNavbarCollapse } from "@tabler/icons-react";
import {
  AnimatePresence,
  MotionValue,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";

import { useRef, useState, memo, useEffect } from "react";

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

export const FloatingDock = ({
  items,
  desktopClassName,
  mobileClassName,
}: {
  items: { title: string; icon: React.ReactNode; href: string }[];
  desktopClassName?: string;
  mobileClassName?: string;
}) => {
  return (
    <>
      <FloatingDockDesktop items={items} className={desktopClassName} />
      <FloatingDockMobile items={items} className={mobileClassName} />
    </>
  );
};

const FloatingDockMobile = memo(({
  items,
  className,
}: {
  items: { title: string; icon: React.ReactNode; href: string }[];
  className?: string;
}) => {
  const [open, setOpen] = useState(false);
  const isDarkMode = useDarkMode();
  
  return (
    <div className={cn("relative block md:hidden", className)}>
      <AnimatePresence>
        {open && (
          <motion.div
            layoutId="nav"
            className="absolute inset-x-0 bottom-full mb-2 flex flex-col gap-2"
          >
            {items.map((item, idx) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  y: 10,
                  transition: {
                    delay: idx * 0.05,
                  },
                }}
                transition={{ delay: (items.length - 1 - idx) * 0.05 }}
              >
                <a
                  href={item.href}
                  key={item.title}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full",
                    isDarkMode ? "bg-slate-800" : "bg-gray-50"
                  )}
                >
                  <div className="h-4 w-4">{item.icon}</div>
                </a>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full",
          isDarkMode ? "bg-slate-800" : "bg-gray-50"
        )}
      >
        <IconLayoutNavbarCollapse className={cn(
          "h-5 w-5",
          isDarkMode ? "text-slate-400" : "text-neutral-500"
        )} />
      </button>
    </div>
  );
});

FloatingDockMobile.displayName = "FloatingDockMobile";

const FloatingDockDesktop = memo(({
  items,
  className,
}: {
  items: { title: string; icon: React.ReactNode; href: string }[];
  className?: string;
}) => {
  const mouseX = useMotionValue(Infinity);
  const isDarkMode = useDarkMode();

  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className={cn(
        "floating-dock mx-auto hidden h-16 items-end gap-4 rounded-2xl px-4 pb-3 md:flex",
        isDarkMode ? "bg-slate-800 border border-slate-700" : "bg-gray-50",
        className,
      )}
    >
      {items.map((item) => (
        <IconContainer mouseX={mouseX} key={item.title} {...item} isDarkMode={isDarkMode} />
      ))}
    </motion.div>
  );
});

FloatingDockDesktop.displayName = "FloatingDockDesktop";

// Memoized spring config to prevent recreation
const springConfig = { stiffness: 200, damping: 20, mass: 0.5 };

const IconContainer = memo(function IconContainer({
  mouseX,
  title,
  icon,
  href,
  isDarkMode,
}: {
  mouseX: MotionValue;
  title: string;
  icon: React.ReactNode;
  href: string;
  isDarkMode?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  // Simplified transforms - only calculate size once
  const size = useTransform(distance, [-150, 0, 150], [40, 70, 40]);
  const iconSize = useTransform(distance, [-150, 0, 150], [20, 35, 20]);

  // Use single spring for better performance
  const animatedSize = useSpring(size, springConfig);
  const animatedIconSize = useSpring(iconSize, springConfig);

  return (
    <a href={href}>
      <motion.div
        ref={ref}
        style={{ width: animatedSize, height: animatedSize }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={cn(
          "floating-dock-icon relative flex aspect-square items-center justify-center rounded-full",
          isDarkMode ? "bg-slate-700" : "bg-gray-200"
        )}
      >
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, y: 10, x: "-50%" }}
              animate={{ opacity: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, y: 2, x: "-50%" }}
              className={cn(
                "floating-dock-tooltip absolute -top-8 left-1/2 w-fit rounded-md border px-2 py-0.5 text-xs whitespace-pre",
                isDarkMode 
                  ? "border-blue-500 bg-slate-800 text-blue-400" 
                  : "border-blue-700 bg-white text-blue-700"
              )}
            >
              {title}
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div
          style={{ width: animatedIconSize, height: animatedIconSize }}
          className="flex items-center justify-center"
        >
          {icon}
        </motion.div>
      </motion.div>
    </a>
  );
});
