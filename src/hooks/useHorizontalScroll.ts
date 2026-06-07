import { useRef, useState, useCallback, useEffect } from 'react';

interface UseHorizontalScrollOptions {
    totalPanels: number;
    sensitivity?: number;
    snapDuration?: number;
}

interface UseHorizontalScrollReturn {
    containerRef: React.RefObject<HTMLDivElement | null>;
    currentPanel: number;
    progress: number;
    isMobile: boolean;
    goToPanel: (index: number) => void;
    hasScrolled: boolean;
}

export function useHorizontalScroll({
    totalPanels,
    snapDuration = 850,
}: UseHorizontalScrollOptions): UseHorizontalScrollReturn {
    const containerRef = useRef<HTMLDivElement>(null);
    const [currentPanel, setCurrentPanel] = useState(0);
    const [progress, setProgress] = useState(0);
    const [isMobile, setIsMobile] = useState(false);
    const [hasScrolled, setHasScrolled] = useState(false);

    // Keep active panel in a ref so the event listeners can read it without rebuilding
    const currentPanelRef = useRef(0);
    currentPanelRef.current = currentPanel;

    const isSnappingRef = useRef(false);
    const lastScrollTimeRef = useRef(0);
    const scrollCooldown = 900; // time in ms to block consecutive scrolls

    // Refs for buttery smooth carousel scrolling
    const targetScrollRef = useRef<number | null>(null);
    const rafRef = useRef<number | null>(null);

    // Detect mobile/tablet viewport
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 1024);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Transition to a specific panel
    const goToPanel = useCallback((index: number) => {
        const clamped = Math.max(0, Math.min(totalPanels - 1, index));
        isSnappingRef.current = true;

        const container = containerRef.current;
        if (container) {
            if (window.innerWidth <= 1024) {
                const targetPanel = container.children[clamped] as HTMLElement;
                if (targetPanel) {
                    targetPanel.scrollIntoView({ behavior: 'smooth' });
                }
                setTimeout(() => {
                    isSnappingRef.current = false;
                }, snapDuration);
            } else {
                container.classList.add('snapping');
                container.style.transform = `translateX(-${clamped * 100}vw)`;

                // Remove snapping class after transition completes
                setTimeout(() => {
                    if (container) {
                        container.classList.remove('snapping');
                    }
                    isSnappingRef.current = false;
                }, snapDuration);
            }
        }

        setProgress(clamped);
        setCurrentPanel(clamped);
    }, [totalPanels, snapDuration]);

    // Discrete mouse wheel & trackpad swipe handler
    useEffect(() => {
        if (isMobile) return;

        const handleWheel = (e: WheelEvent) => {
            const now = Date.now();
            // Block all scrolling during panel transition cooldown
            if (now - lastScrollTimeRef.current < scrollCooldown) {
                e.preventDefault();
                return;
            }

            let scrollableArea = ((e.target as Element)?.closest?.('.carousel-scroll-area') || null) as HTMLElement | null;
            
            // Redirect wheel events to the carousel if we are on panel 1 (WhyPanel) and scrolling elsewhere on the slide
            if (!scrollableArea && currentPanelRef.current === 1) {
                scrollableArea = document.querySelector('.carousel-scroll-area') as HTMLElement | null;
            }
            
            if (scrollableArea) {
                const { scrollLeft, scrollWidth, clientWidth } = scrollableArea;
                const maxScroll = scrollWidth - clientWidth;
                
                const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
                const scrollingForward = delta > 0;
                const scrollingBackward = delta < 0;
                
                // If carousel cannot scroll (fits on screen), fall through to global panel navigation
                if (maxScroll <= 5) {
                    if (rafRef.current !== null) {
                        cancelAnimationFrame(rafRef.current);
                        rafRef.current = null;
                    }
                    targetScrollRef.current = null;
                } else {
                    // Use targetScrollRef if animation is in progress to get the "intended" position
                    const effectiveScroll = targetScrollRef.current !== null ? targetScrollRef.current : scrollLeft;
                    
                    // Slightly larger threshold to account for subpixel rounding and layout spacing
                    const atStart = effectiveScroll <= 10;
                    const atEnd = maxScroll - effectiveScroll <= 10;
                    
                    const isOutboundForward = scrollingForward && atEnd;
                    const isOutboundBackward = scrollingBackward && atStart;
                    
                    if (isOutboundForward || isOutboundBackward) {
                        // Kill any lingering carousel animation
                        if (rafRef.current !== null) {
                            cancelAnimationFrame(rafRef.current);
                            rafRef.current = null;
                        }
                        targetScrollRef.current = null;
                        
                        // Fall through to global panel navigation below
                    } else {
                        // Carousel consumes this scroll to move horizontally
                        e.preventDefault();
                        
                        if (targetScrollRef.current === null) {
                            targetScrollRef.current = scrollLeft;
                        }
                        
                        targetScrollRef.current += delta * 1.5;
                        targetScrollRef.current = Math.max(0, Math.min(targetScrollRef.current, maxScroll));
                        
                        if (rafRef.current === null) {
                            const animateScroll = () => {
                                if (targetScrollRef.current === null) {
                                    rafRef.current = null;
                                    return;
                                }
                                
                                const current = scrollableArea.scrollLeft;
                                const distance = targetScrollRef.current - current;
                                
                                if (Math.abs(distance) < 0.5) {
                                    scrollableArea.scrollLeft = targetScrollRef.current;
                                    targetScrollRef.current = null;
                                    rafRef.current = null;
                                    return;
                                }
                                
                                scrollableArea.scrollLeft += distance * 0.12; // buttery smooth interpolation factor
                                rafRef.current = requestAnimationFrame(animateScroll);
                            };
                            rafRef.current = requestAnimationFrame(animateScroll);
                        }
                        return;
                    }
                }
            }
            
            // ── STEP 2: Global panel navigation ──
            e.preventDefault();

            const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
            if (Math.abs(delta) < 18) return;

            const activePanel = currentPanelRef.current;

            if (delta > 0) {
                if (activePanel < totalPanels - 1) {
                    goToPanel(activePanel + 1);
                    lastScrollTimeRef.current = now;
                    if (!hasScrolled) setHasScrolled(true);
                }
            } else if (delta < 0) {
                if (activePanel > 0) {
                    goToPanel(activePanel - 1);
                    lastScrollTimeRef.current = now;
                    if (!hasScrolled) setHasScrolled(true);
                }
            }
        };

        // Standard event listener with passive: false to allow preventDefault()
        window.addEventListener('wheel', handleWheel, { passive: false });

        return () => {
            window.removeEventListener('wheel', handleWheel);
            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, [isMobile, totalPanels, goToPanel, hasScrolled]);

    // Keyboard Arrow navigation with discrete timing
    useEffect(() => {
        if (isMobile) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            const activePanel = currentPanelRef.current;
            const now = Date.now();
            
            if (now - lastScrollTimeRef.current < scrollCooldown) {
                if (['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(e.key)) {
                    e.preventDefault();
                }
                return;
            }

            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                if (activePanel < totalPanels - 1) {
                    goToPanel(activePanel + 1);
                    lastScrollTimeRef.current = now;
                }
                if (!hasScrolled) setHasScrolled(true);
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                if (activePanel > 0) {
                    goToPanel(activePanel - 1);
                    lastScrollTimeRef.current = now;
                }
                if (!hasScrolled) setHasScrolled(true);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isMobile, totalPanels, goToPanel, hasScrolled]);

    // Mobile/Trackpad Swipe support
    useEffect(() => {
        if (isMobile) return;

        let touchStartX = 0;
        let touchStartY = 0;

        const handleTouchStart = (e: TouchEvent) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        };

        const handleTouchEnd = (e: TouchEvent) => {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const diffX = touchStartX - touchEndX;
            const diffY = touchStartY - touchEndY;

            // Only trigger if horizontal swipe is prominent and exceeds noise threshold
            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 40) {
                const activePanel = currentPanelRef.current;
                const now = Date.now();
                if (now - lastScrollTimeRef.current < scrollCooldown) return;

                if (diffX > 0) {
                    if (activePanel < totalPanels - 1) {
                        goToPanel(activePanel + 1);
                        lastScrollTimeRef.current = now;
                    }
                } else {
                    if (activePanel > 0) {
                        goToPanel(activePanel - 1);
                        lastScrollTimeRef.current = now;
                    }
                }
                if (!hasScrolled) setHasScrolled(true);
            }
        };

        window.addEventListener('touchstart', handleTouchStart, { passive: true });
        window.addEventListener('touchend', handleTouchEnd, { passive: true });

        return () => {
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchend', handleTouchEnd);
        };
    }, [isMobile, totalPanels, goToPanel, hasScrolled]);

    // IntersectionObserver fallback for mobile vertical flow activation
    useEffect(() => {
        if (!isMobile) return;

        const panels = containerRef.current?.querySelectorAll('.hz-panel');
        if (!panels) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('panel-active');
                        const index = Array.from(panels).indexOf(entry.target as HTMLElement);
                        if (index !== -1) {
                            setCurrentPanel(index);
                            setProgress(index);
                        }
                    }
                });
            },
            { threshold: 0.3 }
        );

        panels.forEach((panel) => observer.observe(panel));

        return () => observer.disconnect();
    }, [isMobile]);

    return {
        containerRef,
        currentPanel,
        progress,
        isMobile,
        goToPanel,
        hasScrolled,
    };
}
