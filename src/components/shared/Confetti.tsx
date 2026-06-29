import React, { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

const Confetti: React.FC<{ active: boolean }> = ({ active }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!active || !canvasRef.current) return;

        const myConfetti = confetti.create(canvasRef.current, {
            resize: true,
            useWorker: true // Uses a web worker so it hits 60fps effortlessly
        });

        const duration = 4000;
        const end = Date.now() + duration;
        let isMounted = true;

        const frame = () => {
            if (!isMounted) return;
            
            myConfetti({
                particleCount: 5,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444']
            });
            myConfetti({
                particleCount: 5,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444']
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        };

        frame();

        return () => {
            isMounted = false;
            myConfetti.reset();
        };
    }, [active]);

    return (
        <canvas 
            ref={canvasRef} 
            id="confetti" 
            className={`fixed inset-0 z-[10000] pointer-events-none w-full h-full transition-opacity duration-500 ${active ? 'opacity-100' : 'opacity-0'}`}
        />
    );
};

export default Confetti;
