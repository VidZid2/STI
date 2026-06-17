import { cn } from "@/lib/utils";
import React from "react";
import { BentoGrid, BentoGridItem } from "./bento-grid";
import {
  Zap,
  MousePointerClick,
  Moon,
  Smartphone,
  Compass,
  Home,
  Briefcase,
  Calendar,
  Shield,
  Settings
} from "lucide-react";
import { CpuArchitecture } from "./cpu-architecture";
import Grainient from "./grainient";
import { InteractiveMenu, type InteractiveMenuItem } from "./modern-mobile-menu";
import { motion, useAnimate } from "motion/react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  useCarousel,
} from "./carousel";



const smarterNavigationMenuItems: InteractiveMenuItem[] = [
  { label: 'home', icon: Home },
  { label: 'modules', icon: Briefcase },
  { label: 'schedule', icon: Calendar },
  { label: 'grades', icon: Shield },
  { label: 'settings', icon: Settings },
];

function SmarterNavigationDemo() {
  return (
    <div className="flex flex-1 w-full h-full min-h-[6rem] items-center justify-center pointer-events-auto relative">
      <div className="absolute inset-0 bg-dot-black/[0.2] dark:bg-dot-white/[0.2] [mask-image:radial-gradient(ellipse_at_center,white,transparent)] pointer-events-none" />
      <div className="z-10 w-full flex justify-center items-center scale-[0.75] sm:scale-[0.85] md:scale-[0.70] lg:scale-[0.80] xl:scale-[0.85] origin-center transition-transform">
        <InteractiveMenu items={smarterNavigationMenuItems} accentColor="var(--color-rose-500)" />
      </div>
    </div>
  );
}

function FewerClicksDemo() {
  const [scope, animate] = useAnimate();

  React.useEffect(() => {
    animate(
      [
        ["#pointer", { left: "50%", top: "50%" }, { duration: 0 }],
        // Move to Modules
        [
          "#pointer",
          { left: "15%", top: "15%" },
          { at: "+0.3", duration: 0.5, ease: "easeInOut" },
        ],
        ["#modules", { opacity: 1, scale: 1.05 }, { duration: 0.2 }],
        ["#modules", { opacity: 0.5, scale: 1 }, { at: "+0.4", duration: 0.2 }],
        
        // Move to Schedules
        [
          "#pointer",
          { left: "75%", top: "25%" },
          { at: "+0.1", duration: 0.5, ease: "easeInOut" },
        ],
        ["#schedules", { opacity: 1, scale: 1.05 }, { duration: 0.2 }],
        ["#schedules", { opacity: 0.5, scale: 1 }, { at: "+0.4", duration: 0.2 }],
        
        // Move to Grades
        [
          "#pointer",
          { left: "25%", top: "65%" },
          { at: "+0.1", duration: 0.5, ease: "easeInOut" },
        ],
        ["#grades", { opacity: 1, scale: 1.05 }, { duration: 0.2 }],
        ["#grades", { opacity: 0.5, scale: 1 }, { at: "+0.4", duration: 0.2 }],
        
        // Move to Profile
        [
          "#pointer",
          { left: "75%", top: "80%" },
          { at: "+0.1", duration: 0.5, ease: "easeInOut" },
        ],
        ["#profile", { opacity: 1, scale: 1.05 }, { duration: 0.2 }],
        ["#profile", { opacity: 0.5, scale: 1 }, { at: "+0.4", duration: 0.2 }],
      ],
      {
        repeat: Number.POSITIVE_INFINITY,
      },
    );
  }, [animate]);

  return (
    <div className="relative flex flex-1 w-full h-full min-h-[6rem] items-center justify-center">
      <div ref={scope} className="relative w-full h-full flex items-center justify-center pointer-events-none">
        <MousePointerClick className="absolute h-8 w-8 text-neutral-300 dark:text-neutral-700 opacity-30" />
        
        <div id="modules" className="absolute top-2 left-2 rounded-full border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 px-3 py-1 text-[10px] font-medium text-neutral-600 dark:text-neutral-300 shadow-sm opacity-50">
          Modules
        </div>
        <div id="schedules" className="absolute top-6 right-2 rounded-full border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 px-3 py-1 text-[10px] font-medium text-neutral-600 dark:text-neutral-300 shadow-sm opacity-50">
          Schedules
        </div>
        <div id="grades" className="absolute bottom-6 left-6 rounded-full border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 px-3 py-1 text-[10px] font-medium text-neutral-600 dark:text-neutral-300 shadow-sm opacity-50">
          Grades
        </div>
        <div id="profile" className="absolute bottom-2 right-4 rounded-full border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 px-3 py-1 text-[10px] font-medium text-neutral-600 dark:text-neutral-300 shadow-sm opacity-50">
          Profile
        </div>

        <div id="pointer" className="absolute z-50">
          <svg width="16.8" height="18.2" viewBox="0 0 12 13" className="fill-blue-500" stroke="white" strokeWidth="1" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 5.50676L0 0L2.83818 13L6.30623 7.86537L12 5.50676V5.50676Z" />
          </svg>
          <span className="relative -top-1 left-3 rounded-full bg-blue-500 px-2 py-0.5 text-[8px] text-white">Student</span>
        </div>
      </div>
    </div>
  );
}

function CrossFadeHoverTrigger({ index, activeIndex, children }: { index: number, activeIndex: number, children: (isActive: boolean) => React.ReactNode }) {
  const [isActive, setIsActive] = React.useState(false);

  React.useEffect(() => {
    if (activeIndex === index) {
      const timer = setTimeout(() => setIsActive(true), 400); // 400ms delay to simulate 'waking up'
      return () => clearTimeout(timer);
    } else {
      setIsActive(false);
    }
  }, [activeIndex, index]);

  return <>{children(isActive)}</>;
}

function WorksEverywhereDemo() {
  const [activeIndex, setActiveIndex] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % 3);
    }, 4500); // 4.5s gives enough time for the wake-up animation
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-1 w-full h-full min-h-[6rem] items-center justify-center pointer-events-auto relative">
      <div className="relative w-[220px] h-[150px] translate-y-4 flex items-center justify-center z-10">
        
        {/* Slide 0: iPad */}
        <motion.div 
          className="absolute inset-0 flex items-center justify-center"
          animate={{ opacity: activeIndex === 0 ? 1 : 0, filter: activeIndex === 0 ? 'blur(0px)' : 'blur(10px)', scale: activeIndex === 0 ? 1 : 0.95 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          style={{ pointerEvents: activeIndex === 0 ? 'auto' : 'none' }}
        >
          <CrossFadeHoverTrigger index={0} activeIndex={activeIndex}>
            {(isHovered) => (
              <div className="relative w-[154px] h-[115px] flex items-center justify-center">
                <div className="absolute origin-center scale-[0.55]">
                  <div className="relative w-[280px] h-[210px]">
                    {/* Outer Aluminum Chassis Frame */}
                    <div className="absolute inset-0 rounded-[30px] bg-neutral-800 border border-[#242426]/60 p-[8px] transition-all duration-300">
                      {/* HARDWARE BUTTONS */}
                      <div className="absolute top-[-4px] right-[40px] w-[34px] h-[4px] bg-neutral-500 rounded-t-[2px] transition-colors duration-200 z-20" />
                      <div className="absolute right-[-4px] top-[40px] w-[4px] h-[22px] bg-neutral-500 rounded-r-[2px] z-20" />
                      <div className="absolute right-[-4px] top-[68px] w-[4px] h-[22px] bg-neutral-500 rounded-r-[2px] z-20" />
                      
                      {/* Dark Matte Screen Bezel Frame */}
                      <div className="w-full h-full rounded-[22px] bg-[#0a0a0b] overflow-hidden relative border border-[#111112] flex items-center justify-center">
                        {/* Inner Active Screen Display Panel */}
                        <div className="w-[calc(100%-4px)] h-[calc(100%-4px)] rounded-[20px] bg-[#040405] overflow-hidden flex flex-col items-center justify-center relative">
                          <img 
                            src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80" 
                            alt="iPad OS Premium Wallpaper Preview"
                            className={cn(
                              "absolute inset-0 w-full h-full object-cover transition-all duration-1000 ease-out pointer-events-none",
                              isHovered ? "opacity-80 blur-0 scale-100" : "opacity-0 blur-xl scale-105"
                            )}
                          />
                          <div 
                            className="absolute inset-0 pointer-events-none transition-opacity duration-700"
                            style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.015) 0%, rgba(255,255,255,0.003) 45%, transparent 46%, transparent 100%)' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CrossFadeHoverTrigger>
        </motion.div>

        {/* Slide 1: iPhone */}
        <motion.div 
          className="absolute inset-0 flex items-center justify-center"
          animate={{ opacity: activeIndex === 1 ? 1 : 0, filter: activeIndex === 1 ? 'blur(0px)' : 'blur(10px)', scale: activeIndex === 1 ? 1 : 0.95 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          style={{ pointerEvents: activeIndex === 1 ? 'auto' : 'none' }}
        >
          <CrossFadeHoverTrigger index={1} activeIndex={activeIndex}>
            {(isHovered) => (
              <div className="relative w-[154px] h-[115px] flex items-center justify-center">
                <div className="absolute origin-center scale-[0.55]">
                  <div className="relative w-[140px] h-[256px] transition-all duration-350">
                    {/* Outer Aluminum Chassis Frame */}
                    <div className="absolute inset-0 rounded-[38px] bg-neutral-800 border border-[#232325]/80 p-[7px] transition-all duration-300">
                      {/* IPHONE HARDWARE BUTTONS */}
                      <div className="absolute left-[-3.5px] top-[19%] w-[3.5px] h-[5%] bg-neutral-500 rounded-l-[1.5px] z-20" />
                      <div className="absolute left-[-3.5px] top-[26%] w-[3.5px] h-[8.5%] bg-neutral-500 rounded-l-[1.5px] z-20" />
                      <div className="absolute left-[-3.5px] top-[37%] w-[3.5px] h-[8.5%] bg-neutral-500 rounded-l-[1.5px] z-20" />
                      <div className="absolute right-[-3.5px] top-[31%] w-[3.5px] h-[12.5%] bg-neutral-500 rounded-r-[1.5px] z-20" />
                      
                      {/* Dark Matte Screen Bezel Frame */}
                      <div className="w-full h-full rounded-[31px] bg-[#070708] overflow-hidden relative border border-[#141416] flex items-center justify-center">
                        {/* Inner Active Screen Display Panel */}
                        <div className="w-[calc(100%-4px)] h-[calc(100%-4px)] rounded-[29px] bg-[#030304] overflow-hidden flex flex-col items-center justify-between relative p-2.5">
                          <img 
                            src="https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=800&q=80" 
                            alt="iOS Premium Wallpaper Preview"
                            className={cn(
                              "absolute inset-0 w-full h-full object-cover transition-all duration-1000 ease-out pointer-events-none",
                              isHovered ? "opacity-80 blur-0 scale-100" : "opacity-0 blur-xl scale-105"
                            )}
                          />
                          <div 
                            className="absolute inset-0 pointer-events-none transition-opacity duration-700 z-10"
                            style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.012) 0%, rgba(255,255,255,0.003) 45%, transparent 46%, transparent 100%)' }}
                          />
                          <div className="h-1 w-full" />
                          <div className={cn(
                            "w-[42px] h-[2.5px] rounded-full z-20 mb-0.5 transition-colors duration-1000",
                            isHovered ? "bg-[#3d3d40]" : "bg-[#1a1a1c]"
                          )} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CrossFadeHoverTrigger>
        </motion.div>

        {/* Slide 2: MacBook */}
        <motion.div 
          className="absolute inset-0 flex items-center justify-center"
          animate={{ opacity: activeIndex === 2 ? 1 : 0, filter: activeIndex === 2 ? 'blur(0px)' : 'blur(10px)', scale: activeIndex === 2 ? 1 : 0.95 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          style={{ pointerEvents: activeIndex === 2 ? 'auto' : 'none' }}
        >
          <CrossFadeHoverTrigger index={2} activeIndex={activeIndex}>
            {(isHovered) => (
              <div className="relative w-[154px] h-[115px] flex items-center justify-center">
                <div className="absolute origin-center scale-[0.55]">
                  <div className="flex flex-col items-center justify-center relative">
                    {/* Display Screen Lid with 3D perspective */}
                    <div className="relative w-[340px] h-[198px] z-10" style={{ perspective: '1100px' }}>
                      {/* Outer aluminum screen lid rim */}
                      <div 
                        className="absolute inset-0 rounded-t-[16px] bg-neutral-800 border-t border-x border-[#232325]/85 p-[6px]"
                        style={{ 
                          transformOrigin: 'bottom center',
                          transform: isHovered ? 'rotateX(-3deg)' : 'rotateX(-64deg)',
                          transition: 'transform 1500ms cubic-bezier(0.5, 0.05, 0.1, 1)',
                          willChange: 'transform'
                        }}
                      >
                        {/* Display Bezel */}
                        <div className="w-full h-full rounded-t-[11px] bg-[#080809] relative overflow-hidden flex items-center justify-center border border-[#141416]/90">
                          {/* Inner Active Screen Display Panel */}
                          <div className="w-[calc(100%-2px)] h-[calc(100%-2px)] rounded-t-[9px] bg-[#030304] overflow-hidden relative">
                            {/* High-Fidelity Vector OS Wave Wallpaper */}
                            <svg 
                              viewBox="0 0 400 240" 
                              className="absolute inset-0 w-full h-full"
                              preserveAspectRatio="none"
                              style={{
                                transition: 'all 1500ms cubic-bezier(0.5, 0.05, 0.1, 1)',
                                opacity: isHovered ? 1 : 0,
                                filter: isHovered ? 'blur(0px)' : 'blur(20px)',
                                transform: isHovered ? 'scale(1)' : 'scale(1.04)',
                                willChange: 'opacity, filter, transform'
                              }}
                            >
                              <defs>
                                <linearGradient id="warmBase" x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" stopColor="#e37139" />
                                  <stop offset="50%" stopColor="#d9544c" />
                                  <stop offset="100%" stopColor="#87297e" />
                                </linearGradient>
                                <linearGradient id="purpleRibbon" x1="10%" y1="0%" x2="90%" y2="100%">
                                  <stop offset="0%" stopColor="#a336ab" />
                                  <stop offset="50%" stopColor="#6e24b3" />
                                  <stop offset="100%" stopColor="#300d8c" />
                                </linearGradient>
                                <linearGradient id="tealRibbon" x1="0%" y1="30%" x2="100%" y2="100%">
                                  <stop offset="0%" stopColor="#25b7ca" />
                                  <stop offset="100%" stopColor="#086fa1" />
                                </linearGradient>
                              </defs>
                              <rect width="400" height="240" fill="url(#warmBase)" />
                              <path d="M -20,240 C 60,180 120,60 260,110 C 340,140 370,190 420,130 L 420,240 Z" fill="url(#purpleRibbon)" />
                              <path d="M -20,240 C 40,210 70,120 140,140 C 210,160 250,220 310,240 Z" fill="url(#tealRibbon)" />
                            </svg>

                            {/* Glossy Diagonal Reflection Overlay */}
                            <div 
                              className="absolute inset-0 pointer-events-none transition-opacity duration-700 z-10"
                              style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.005) 45%, transparent 46%, transparent 100%)' }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Horizontal Keyboard Base Deck */}
                    <div className="relative w-[384px] h-[12px] bg-gradient-to-b from-neutral-700 to-neutral-800 border-t border-[#232325] rounded-b-[12px] z-20 flex justify-center">
                      {/* Soft interior indentation notch */}
                      <div className="w-[44px] h-[3.5px] bg-[#050506] border-b border-[#2d2d30]/60 rounded-b-[4px] shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CrossFadeHoverTrigger>
        </motion.div>

      </div>
    </div>
  );
}


function AutoThemeDemo() {
  const [isDark, setIsDark] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const rawId = React.useId();
  const maskId = `att${rawId.replace(/:/g, "")}`;
  const spring = { type: "spring" as const, stiffness: 380, damping: 30 };

  React.useEffect(() => {
    // Traverse up to the parent bento card and toggle a custom data attribute, not .dark!
    const parent = containerRef.current?.closest('.group\\/bento');
    if (parent) {
      if (isDark) {
        parent.setAttribute('data-theme', 'dark');
      } else {
        parent.removeAttribute('data-theme');
      }
    }
  }, [isDark]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setIsDark((prev) => !prev);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div ref={containerRef} className="flex flex-1 w-full h-full min-h-[6rem] items-center justify-center pointer-events-none">
      
      {/* LIGHT LAYER (Base) */}
      <div className="absolute inset-0 bg-white transition-colors duration-500 z-0" />
      <div className="absolute inset-0 bg-neutral-100 bg-dot-black/[0.2] z-0 pointer-events-none" />

      {/* DARK LAYER (Animated Expanding Circle Mask) */}
      <div 
        className="absolute inset-0 bg-black bg-dot-white/[0.2] transition-[clip-path] duration-700 ease-in-out z-0"
        style={{
          clipPath: isDark ? "circle(150% at 50% 40%)" : "circle(0% at 50% 40%)"
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
      </div>

      {/* Localized Mock Toggler Button */}
      <button 
        onClick={() => setIsDark(!isDark)}
        className={cn(
          "relative z-20 w-16 h-16 flex items-center justify-center rounded-full shadow-lg backdrop-blur-sm transition-all duration-500 hover:scale-110 pointer-events-auto translate-y-6 md:translate-y-8",
          isDark ? "bg-neutral-800 text-neutral-200 border-transparent" : "bg-white text-neutral-800 border border-neutral-200"
        )}
      >
        <motion.svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          initial={false}
          animate={{ rotate: isDark ? 270 : 0 }}
          transition={spring}
          style={{ overflow: "visible" }}
        >
          <mask id={maskId}>
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <motion.circle
              initial={false}
              animate={{ cx: isDark ? 17 : 33, cy: isDark ? 8 : 0 }}
              transition={spring}
              r="9"
              fill="black"
            />
          </mask>

          <motion.circle
            cx="12"
            cy="12"
            fill="currentColor"
            stroke="none"
            mask={`url(#${maskId})`}
            initial={false}
            animate={{ r: isDark ? 9 : 5 }}
            transition={spring}
          />

          <motion.g
            initial={false}
            animate={{
              opacity: isDark ? 0 : 1,
              scale: isDark ? 0 : 1,
              rotate: isDark ? -30 : 0,
            }}
            transition={spring}
            style={{ transformOrigin: "12px 12px" }}
          >
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="5.64" y1="5.64" x2="4.22" y2="4.22" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            <line x1="5.64" y1="18.36" x2="4.22" y2="19.78" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          </motion.g>
        </motion.svg>
      </button>
    </div>
  );
}

const items = [
  {
    title: "Powerful Infrastructure",
    description: "Built for stability, ensuring smooth and reliable access for all students, even during peak hours.",
    header: (
      <>
        <div className="absolute -inset-4 pointer-events-none rounded-xl overflow-hidden z-0">
          <div className="absolute inset-0 w-full h-full">
            <Grainient
              className="absolute inset-0 w-full h-full"
              color1="#9fa9ff"
              color2="#fefefe"
              color3="#ffffff"
              timeSpeed={0.25}
              colorBalance={0.0}
              warpStrength={1.0}
              warpFrequency={5.0}
              warpSpeed={2.0}
              warpAmplitude={50.0}
              blendAngle={0.0}
              blendSoftness={0.05}
              rotationAmount={500.0}
              noiseScale={2.0}
              grainAmount={0.1}
              grainScale={2.0}
              grainAnimated={false}
              contrast={1.5}
              gamma={1.0}
              saturation={1.0}
              centerX={0.0}
              centerY={0.0}
              zoom={0.9}
            />
          </div>
        </div>
        <div className="absolute -inset-4 flex items-center justify-center pointer-events-none z-0">
          <CpuArchitecture text="CORE" className="w-full h-auto min-w-[300px] lg:w-[80%] scale-[1.8] sm:scale-[1.5] lg:scale-[1.8] translate-x-[10%] sm:translate-x-[20%] lg:translate-x-[25%] -translate-y-[30px] sm:-translate-y-[20px] lg:-translate-y-[10px]" />
        </div>
        {/* Elegant bottom blur to protect text readability from the CPU lines */}
        <div className="absolute -bottom-4 -left-4 -right-4 h-32 bg-white/40 dark:bg-black/40 backdrop-blur-md pointer-events-none z-0 [mask-image:linear-gradient(to_top,black_40%,transparent)]" />
        {/* Spacer to maintain card layout and keep text at the bottom */}
        <div className="flex flex-1 w-full h-full min-h-[6rem] pointer-events-none" />
      </>
    ),
    className: "md:col-span-2 relative overflow-hidden",
    icon: <Zap className="h-4 w-4 text-amber-500 relative z-10" />,
  },
  {
    title: "Fewer Clicks",
    description: "Get to your modules and schedules with zero friction.",
    header: <FewerClicksDemo />,
    className: "md:col-span-1",
    icon: <MousePointerClick className="h-4 w-4 text-blue-500" />,
  },
  {
    title: <span className="transition-colors duration-500 group-data-[theme=dark]/bento:text-neutral-200">Reduced Eye Strain</span>,
    description: <span className="transition-colors duration-500 group-data-[theme=dark]/bento:text-neutral-400">A gorgeous dark mode designed for late-night study sessions.</span>,
    header: <AutoThemeDemo />,
    className: "md:col-span-1 relative overflow-hidden transition-colors duration-500",
    icon: <Moon className="h-4 w-4 text-indigo-500 relative z-10 transition-colors duration-500 group-data-[theme=dark]/bento:text-indigo-400" />,
  },
  {
    title: "Works Everywhere",
    description: "Fully optimized for phones, tablets, and desktops.",
    header: <WorksEverywhereDemo />,
    className: "md:col-span-1 overflow-hidden relative",
    icon: <Smartphone className="h-4 w-4 text-emerald-500" />,
    background: (
      <div className="absolute -inset-4 z-0 pointer-events-none rounded-xl overflow-hidden">
        <div className="absolute inset-0 w-full h-full">
          <Grainient
            className="absolute inset-0 w-full h-full"
            color1="#9fa9ff"
            color2="#fefefe"
            color3="#9fa9ff"
            timeSpeed={0.25}
            colorBalance={0.0}
            warpStrength={1.0}
            warpFrequency={5.0}
            warpSpeed={2.0}
            warpAmplitude={50.0}
            blendAngle={0.0}
            blendSoftness={0.05}
            rotationAmount={500.0}
            noiseScale={2.0}
            grainAmount={0.1}
            grainScale={2.0}
            grainAnimated={false}
            contrast={1.5}
            gamma={1.0}
            saturation={1.0}
            centerX={0.0}
            centerY={0.0}
            zoom={0.9}
          />
        </div>
        {/* Elegant bottom blur to protect text readability from the animated background */}
        <div className="absolute -bottom-4 -left-4 -right-4 h-32 bg-white/60 dark:bg-black/60 backdrop-blur-lg pointer-events-none [mask-image:linear-gradient(to_top,black_40%,transparent)]" />
      </div>
    ),
  },
  {
    title: "Smarter Navigation",
    description: "A redesigned sidebar and quick-access shortcuts mean less searching, more learning.",
    header: <SmarterNavigationDemo />,
    className: "md:col-span-1",
    icon: <Compass className="h-4 w-4 text-rose-500" />,
  },
];

export interface AdvantagesBentoProps {
  className?: string;
}

export function AdvantagesBento({ className }: AdvantagesBentoProps) {
  return (
    <div className={cn("pb-4 sm:pb-8", className)}>
      <BentoGrid className="w-full mx-auto md:auto-rows-[16rem]">
        {items.map((item, i) => (
          <BentoGridItem
            key={i}
            title={item.title}
            description={item.description}
            header={item.header}
            className={item.className}
            icon={item.icon}
            background={item.background}
          />
        ))}
      </BentoGrid>
    </div>
  );
}

export default AdvantagesBento;
