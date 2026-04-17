import { motion } from 'motion/react';

interface ModalBackdropProps {
    onClose: () => void;
    zIndex?: number;
    blur?: string;
    background?: string;
}

/**
 * Shared modal backdrop — semi-transparent overlay with blur.
 * Used by ActivityModal, AtRiskStudentsModal, StudentListModal, GradeSubmissionsModal.
 */
const ModalBackdrop: React.FC<ModalBackdropProps> = ({
    onClose,
    zIndex = 1000,
    blur = '4px',
    background = 'rgba(0, 0, 0, 0.5)',
}) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="fixed inset-0"
        style={{ background, backdropFilter: `blur(${blur})`, zIndex }}
    />
);

export default ModalBackdrop;
