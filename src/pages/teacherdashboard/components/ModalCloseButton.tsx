import { motion } from 'motion/react';

interface ModalCloseButtonProps {
    onClose: () => void;
    size?: number;
    borderRadius?: string;
}

/**
 * Shared modal close button — the X in the top-right corner.
 * Used by ActivityModal, AtRiskStudentsModal, StudentListModal, GradeSubmissionsModal.
 */
const ModalCloseButton: React.FC<ModalCloseButtonProps> = ({
    onClose,
    size = 36,
    borderRadius = '10px',
}) => (
    <motion.button
        whileHover={{ scale: 1.1, background: 'rgba(0,0,0,0.08)' }}
        whileTap={{ scale: 0.95 }}
        onClick={onClose}
        aria-label="Close modal"
        className="flex items-center justify-center cursor-pointer shrink-0 border-none"
        style={{
            width: `${size}px`,
            height: `${size}px`,
            borderRadius,
            background: 'rgba(0,0,0,0.04)',
            color: 'var(--text-secondary)',
        }}
    >
        <svg
            width={size >= 36 ? 18 : 16}
            height={size >= 36 ? 18 : 16}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    </motion.button>
);

export default ModalCloseButton;
