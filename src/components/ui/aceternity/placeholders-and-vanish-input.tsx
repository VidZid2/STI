"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

export function PlaceholdersAndVanishInput({
  placeholders,
  onChange,
  onSubmit,
  externalValue,
  onValueChange,
  disabled = false,
}: {
  placeholders: string[];
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (value: string) => void;
  externalValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
}) {
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0);

  // Dark mode detection
  const [isDark, setIsDark] = useState(() =>
    typeof document !== 'undefined' && (
      document.documentElement.classList.contains('dark') ||
      document.body.classList.contains('dark-mode')
    )
  );
  const [isPink, setIsPink] = useState(() =>
    typeof document !== 'undefined' &&
    document.documentElement.classList.contains('pink-theme')
  );
  useEffect(() => {
    const check = () => {
      setIsDark(
        document.documentElement.classList.contains('dark') ||
        document.body.classList.contains('dark-mode')
      );
      setIsPink(document.documentElement.classList.contains('pink-theme'));
    };
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    obs.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startAnimation = () => {
    intervalRef.current = setInterval(() => {
      setCurrentPlaceholder((prev) => (prev + 1) % placeholders.length);
    }, 3000);
  };
  const handleVisibilityChange = () => {
    if (document.visibilityState !== "visible" && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    } else if (document.visibilityState === "visible") {
      startAnimation();
    }
  };

  useEffect(() => {
    startAnimation();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [placeholders]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const newDataRef = useRef<any[]>([]);
  const animationDataRef = useRef<any[]>([]); // Snapshot for animation
  const inputRef = useRef<HTMLInputElement>(null);
  const [internalValue, setInternalValue] = useState("");
  const [animating, setAnimating] = useState(false);

  // Use external value if provided, otherwise internal
  const value = externalValue !== undefined ? externalValue : internalValue;
  const updateValue = (newVal: string) => {
    if (externalValue !== undefined && onValueChange) {
      onValueChange(newVal);
    } else {
      setInternalValue(newVal);
    }
  };

  const draw = useCallback(() => {
    if (!inputRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 800;
    ctx.clearRect(0, 0, 800, 800);
    const computedStyles = getComputedStyle(inputRef.current);

    const fontSize = parseFloat(computedStyles.getPropertyValue("font-size"));
    ctx.font = `${fontSize * 2}px ${computedStyles.fontFamily}`;
    ctx.fillStyle = isPink ? "#ec4899" : "#003DA5";
    ctx.fillText(value, 16, 40);

    const imageData = ctx.getImageData(0, 0, 800, 800);
    const pixelData = imageData.data;
    const newData: any[] = [];

    for (let t = 0; t < 800; t++) {
      let i = 4 * t * 800;
      for (let n = 0; n < 800; n++) {
        let e = i + 4 * n;
        if (
          pixelData[e] !== 0 ||
          pixelData[e + 1] !== 0 ||
          pixelData[e + 2] !== 0
        ) {
          newData.push({
            x: n,
            y: t,
            color: [
              pixelData[e],
              pixelData[e + 1],
              pixelData[e + 2],
              pixelData[e + 3],
            ],
          });
        }
      }
    }

    newDataRef.current = newData.map(({ x, y, color }) => ({
      x,
      y,
      r: 1,
      color: `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3]})`,
    }));
  }, [value, isPink]);

  // Only redraw when NOT animating — prevents parent clearing value from wiping pixel data
  useEffect(() => {
    if (!animating) {
      draw();
    }
  }, [value, draw, animating]);

  const animate = (start: number) => {
    const animateFrame = (pos: number = 0) => {
      requestAnimationFrame(() => {
        const newArr = [];
        for (let i = 0; i < animationDataRef.current.length; i++) {
          const current = animationDataRef.current[i];
          if (current.x < pos) {
            newArr.push(current);
          } else {
            if (current.r <= 0) {
              current.r = 0;
              continue;
            }
            current.x += Math.random() > 0.5 ? 1 : -1;
            current.y += Math.random() > 0.5 ? 1 : -1;
            current.r -= 0.05 * Math.random();
            newArr.push(current);
          }
        }
        animationDataRef.current = newArr;
        const ctx = canvasRef.current?.getContext("2d");
        if (ctx) {
          ctx.clearRect(pos, 0, 800, 800);
          animationDataRef.current.forEach((t) => {
            const { x: n, y: i, r: s, color: color } = t;
            if (n > pos) {
              ctx.beginPath();
              ctx.rect(n, i, s, s);
              ctx.fillStyle = color;
              ctx.strokeStyle = color;
              ctx.stroke();
            }
          });
        }
        if (animationDataRef.current.length > 0) {
          animateFrame(pos - 8);
        } else {
          // Animation done — clean up
          setAnimating(false);
        }
      });
    };
    animateFrame(start);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !animating && !disabled) {
      e.preventDefault(); // Prevent native form submit to avoid double-fire
      vanishAndSubmit();
    }
  };

  const vanishAndSubmit = () => {
    if (animating) return;
    const currentVal = value.trim();
    if (!currentVal || disabled) return;

    // 1. Capture the value for the parent BEFORE clearing
    const submittedValue = currentVal;

    // 2. Draw the text to canvas to generate pixel data
    setAnimating(true);
    draw();

    // 3. Snapshot the pixel data for the animation (so draw() won't overwrite it)
    animationDataRef.current = newDataRef.current.map(item => ({ ...item }));

    // 4. Clear the input immediately (text becomes invisible due to animating state)
    updateValue("");

    // 5. Fire onSubmit with the captured value — parent can process immediately
    onSubmit(submittedValue);

    // 6. Start the vanish particle animation
    if (animationDataRef.current.length > 0) {
      const maxX = animationDataRef.current.reduce(
        (prev, current) => (current.x > prev ? current.x : prev),
        0
      );
      animate(maxX);
    } else {
      setAnimating(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    vanishAndSubmit();
  };

  return (
    <form
      style={{
        width: '100%',
        position: 'relative',
        backgroundColor: isDark ? (isPink ? 'rgba(236, 72, 153, 0.08)' : '#1e293b') : '#ffffff',
        height: '44px',
        borderRadius: '14px',
        overflow: 'hidden',
        border: isDark 
          ? (isPink ? '1px solid rgba(236, 72, 153, 0.2)' : '1px solid rgba(148, 163, 184, 0.2)') 
          : (isPink ? '1px solid rgba(236, 72, 153, 0.2)' : '1px solid rgba(0, 61, 165, 0.15)'),
        boxShadow: isDark 
          ? (isPink ? '0 1px 3px rgba(236, 72, 153, 0.1)' : '0 1px 3px rgba(0, 0, 0, 0.2)') 
          : (isPink ? '0 1px 3px rgba(236, 72, 153, 0.1)' : '0 1px 3px rgba(0, 0, 0, 0.06)'),
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        opacity: disabled ? 0.6 : 1,
      }}
      onSubmit={handleFormSubmit}
    >
      <canvas
        style={{
          position: 'absolute',
          pointerEvents: 'none',
          fontSize: '16px',
          transform: 'scale(0.5)',
          top: '20%',
          left: '12px',
          transformOrigin: 'top left',
          paddingRight: '80px',
          opacity: animating ? 1 : 0,
        }}
        ref={canvasRef}
      />
      <input
        onChange={(e) => {
          if (!animating && !disabled) {
            updateValue(e.target.value);
            onChange && onChange(e);
          }
        }}
        onKeyDown={handleKeyDown}
        ref={inputRef}
        value={value}
        type="text"
        disabled={disabled}
        style={{
          width: '100%',
          position: 'relative',
          fontSize: '13px',
          zIndex: 50,
          border: 'none',
          backgroundColor: 'transparent',
          color: animating ? 'transparent' : isDark ? '#e2e8f0' : '#334155',
          height: '100%',
          borderRadius: '14px',
          outline: 'none',
          paddingLeft: '14px',
          paddingRight: '52px',
          fontFamily: 'inherit',
        }}
      />

      <button
        disabled={!value.trim() || disabled}
        type="submit"
        style={{
          position: 'absolute',
          right: '4px',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 50,
          height: '34px',
          width: '34px',
          borderRadius: '10px',
          border: 'none',
          background: (!value.trim() || disabled)
            ? isDark 
              ? (isPink ? 'rgba(236, 72, 153, 0.15)' : 'rgba(148, 163, 184, 0.15)') 
              : (isPink ? 'rgba(236, 72, 153, 0.15)' : 'rgba(0, 61, 165, 0.25)')
            : isPink 
              ? 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)' 
              : 'linear-gradient(135deg, #003DA5 0%, #0050C8 100%)',
          cursor: (!value.trim() || disabled) ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <motion.svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <motion.path
            d="M5 12l14 0"
            initial={{
              strokeDasharray: "50%",
              strokeDashoffset: "50%",
            }}
            animate={{
              strokeDashoffset: value ? 0 : "50%",
            }}
            transition={{
              duration: 0.3,
              ease: "linear",
            }}
          />
          <path d="M13 18l6 -6" />
          <path d="M13 6l6 6" />
        </motion.svg>
      </button>

      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        borderRadius: '14px',
        pointerEvents: 'none',
      }}>
        <AnimatePresence mode="wait">
          {!value && !animating && (
            <motion.p
              initial={{
                y: 5,
                opacity: 0,
              }}
              key={`current-placeholder-${currentPlaceholder}`}
              animate={{
                y: 0,
                opacity: 1,
              }}
              exit={{
                y: -15,
                opacity: 0,
              }}
              transition={{
                duration: 0.3,
                ease: "linear",
              }}
              style={{
                color: isDark ? '#64748b' : '#94a3b8',
                fontSize: '13px',
                fontWeight: 400,
                paddingLeft: '14px',
                textAlign: 'left',
                width: 'calc(100% - 52px)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                margin: 0,
              }}
            >
              {placeholders[currentPlaceholder]}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </form>
  );
}
