import * as React from 'react';
import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';

interface ToolsNavTooltipProps {
    children: React.ReactNode;
}

const ToolsNavTooltip: React.FC<ToolsNavTooltipProps> = ({ children }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
    const containerRef = useRef<HTMLAnchorElement>(null);

    const handleMouseEnter = (e: React.MouseEvent) => {
        const target = e.currentTarget as HTMLElement;
        const rect = target.getBoundingClientRect();
        setTooltipPosition({
            top: rect.top + rect.height / 2 - 20,
            left: rect.right + 12,
        });
        setIsHovered(true);
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
    };

    // Clone children and attach event handlers
    const childrenWithProps = React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
            return React.cloneElement(child as React.ReactElement<any>, {
                onMouseEnter: handleMouseEnter,
                onMouseLeave: handleMouseLeave,
                ref: containerRef,
            });
        }
        return child;
    });

    return (
        <>
            {childrenWithProps}
            {createPortal(
                <AnimatePresence>
                    {isHovered && (
                        <motion.div
                            className="tools-nav-tooltip"
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
                            <div className="tools-tooltip-arrow" />
                            <div className="tools-tooltip-content">
                                <div className="tools-tooltip-header">
                                    <div className="tools-tooltip-icon">
                                        <lord-icon
                                            src="https://cdn.lordicon.com/mudwpdhy.json"
                                            trigger="loop"
                                            colors="primary:#ffffff"
                                            style={{ width: '20px', height: '20px' }}
                                        />
                                    </div>
                                    <span className="tools-tooltip-title">Productivity Tools</span>
                                    <span className="tools-tooltip-new-badge">New</span>
                                </div>
                                <p className="tools-tooltip-desc">
                                    Access powerful utilities like Word Counter, Grammar Checker, File Converter, and more to boost your productivity.
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
};

export default ToolsNavTooltip;
