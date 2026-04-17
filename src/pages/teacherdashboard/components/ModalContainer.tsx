import React from 'react';
import { motion } from 'motion/react';

interface ModalContainerProps {
    children: React.ReactNode;
    maxWidth?: string;
    maxHeight?: string;
    onClick?: (e: React.MouseEvent) => void;
    style?: React.CSSProperties;
    /** Accessible label ID — should match the modal's h2 heading ID */
    labelledById?: string;
}

/**
 * Shared modal container — spring-animated wrapper with standard shadow/radius.
 * Phase 14.1: Added role="dialog", aria-modal="true", aria-labelledby support.
 */
const ModalContainer: React.FC<ModalContainerProps> = ({
    children,
    maxWidth = '900px',
    maxHeight = '85vh',
    onClick,
    style,
    labelledById,
}) => (
    <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledById}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        onClick={onClick ?? ((e) => e.stopPropagation())}
        style={{
            width: '100%',
            maxWidth,
            maxHeight,
            background: 'var(--bg-surface)',
            borderRadius: '20px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            ...style,
        }}
    >
        {children}
    </motion.div>
);

export default ModalContainer;
