import { useState, useEffect } from 'react';

export function useDevicePerformance() {
  const [isLowEnd, setIsLowEnd] = useState(false);

  useEffect(() => {
    const checkPerformance = () => {
      // 1. Check OS Accessibility Settings (Reduced Motion)
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      // 2. Check Logical CPU Cores
      // Many modern low-end/budget phones have 4 or fewer cores available to the browser.
      const cores = navigator.hardwareConcurrency || 4;

      // 3. Check Device RAM (Chromium browsers only)
      // Devices with less than 4GB of RAM are typically older or budget tier.
      const memory = (navigator as any).deviceMemory || 4;

      // 4. Network connection type (optional heuristic)
      // If the user is on a slow 2G/3G network, disabling heavy animations might save battery/CPU.
      const connection = (navigator as any).connection;
      const isSlowNetwork = connection && (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g' || connection.saveData);

      if (prefersReducedMotion || cores < 4 || memory < 4 || isSlowNetwork) {
        setIsLowEnd(true);
      }
    };

    checkPerformance();
  }, []);

  return {
    isLowEnd,
    isHighEnd: !isLowEnd, // If it's not explicitly low-end, we assume it can handle animations
  };
}
