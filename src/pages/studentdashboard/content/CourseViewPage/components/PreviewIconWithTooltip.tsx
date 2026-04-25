/**
 * PreviewIconWithTooltip
 * Small icon button with a floating tooltip, used in the teacher grading preview.
 * Extracted from CourseViewPage.tsx during Phase 8.1
 */
import * as React from 'react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface PreviewIconWithTooltipProps {
    label: string;
    subtitle: string;
    color: string;
    bgColor: string;
    borderColor: string;
    children: React.ReactNode;
}

export const PreviewIconWithTooltip: React.FC<PreviewIconWithTooltipProps> = ({
    label, subtitle, color, bgColor, borderColor, children }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            style={{ position: 'relative', display: 'inline-flex' }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <motion.div
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                style={{
                    width: '32px', height: '32px', borderRadius: '8px',
                    background: bgColor, border: `1px solid ${borderColor}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer' }}
            >
                {children}
            </motion.div>

            <AnimatePresence>
                {isHovered && (
                    <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.15 }}
                        style={{
                            position: 'absolute',
                            bottom: 'calc(100% + 12px)',
                            left: '50%',
                            zIndex: 100,
                            pointerEvents: 'none' }}
                    >
                        <div style={{
                            position: 'relative', background: '#fff',
                            border: `1px solid ${color}30`, borderRadius: '10px',
                            padding: '8px 12px', boxShadow: `0 4px 16px ${color}15`,
                            whiteSpace: 'nowrap', transform: 'translateX(-50%)' }}>
                            <p style={{ margin: 0, fontSize: '12px', fontWeight: 600, color, textAlign: 'center' }}>{label}</p>
                            <p style={{ margin: '2px 0 0 0', fontSize: '10px', color: `${color}cc`, maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'center' }}>{subtitle}</p>
                            <div style={{
                                position: 'absolute', width: '10px', height: '10px', background: '#fff',
                                borderRight: `1px solid ${color}30`, borderBottom: `1px solid ${color}30`,
                                bottom: '-6px', left: '50%', transform: 'translateX(-50%) rotate(45deg)' }} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PreviewIconWithTooltip;
