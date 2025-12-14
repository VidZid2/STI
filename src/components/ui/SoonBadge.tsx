import * as React from 'react';
import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';

interface SoonBadgeProps {
    tooltip: string;
}

const SoonBadge: React.FC<SoonBadgeProps> = ({ tooltip }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
    const badgeRef = useRef<HTMLSpanElement>(null);

    const handleMouseEnter = () => {
        if (badgeRef.current) {
            const rect = badgeRef.current.getBoundingClientRect();
            setTooltipPosition({
                top: rect.top - 15,
                left: rect.right + 12,
            });
        }
        setIsHovered(true);
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
    };

    return (
        <>
            <span
                ref={badgeRef}
                className="soon-badge"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                Soon
            </span>
            {createPortal(
                <AnimatePresence>
                    {isHovered && (
                        <motion.div
                            className="soon-tooltip"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                            style={{
                                position: 'fixed',
                                top: tooltipPosition.top,
                                left: tooltipPosition.left,
                                zIndex: 99999,
                            }}
                        >
                            <div className="soon-tooltip-arrow" />
                            <div className="soon-tooltip-content">
                                {tooltip}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
};

export default SoonBadge;
