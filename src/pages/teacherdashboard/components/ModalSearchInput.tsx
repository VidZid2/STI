import { motion, AnimatePresence } from 'motion/react';

interface ModalSearchInputProps {
    value: string;
    onChange: (value: string) => void;
    onClear: () => void;
    placeholder?: string;
    isSearching?: boolean;
    /** Accessible label for the search input */
    ariaLabel?: string;
    /** flex value for the wrapper div */
    flex?: number | string;
    minWidth?: string;
}

const ACCENT_COLOR = '#3b82f6';

/**
 * Shared search input with icon, animated loading spinner, and clear button.
 * Used by ActivityModal, AtRiskStudentsModal, StudentListModal, GradeSubmissionsModal.
 */
const ModalSearchInput: React.FC<ModalSearchInputProps> = ({
    value,
    onChange,
    onClear,
    placeholder = 'Search...',
    isSearching = false,
    ariaLabel = 'Search',
    flex = 1,
    minWidth = '200px',
}) => (
    <div style={{ flex, minWidth, position: 'relative' }}>
        {/* Search icon */}
        <div style={{
            position: 'absolute', left: '12px', top: 0, bottom: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none', zIndex: 1,
        }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ display: 'block' }}>
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
            </svg>
        </div>

        <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            aria-label={ariaLabel}
            style={{
                width: '100%',
                padding: '10px 40px 10px 40px',
                borderRadius: '10px',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-canvas)',
                fontSize: '13px',
                color: 'var(--text-primary)',
                outline: 'none',
                transition: 'all 0.2s ease',
                boxSizing: 'border-box',
            }}
            onFocus={(e) => {
                e.target.style.borderColor = ACCENT_COLOR;
                e.target.style.boxShadow = `0 0 0 3px ${ACCENT_COLOR}15`;
                e.target.style.background = 'var(--bg-surface)';
            }}
            onBlur={(e) => {
                e.target.style.borderColor = 'var(--border-subtle)';
                e.target.style.boxShadow = 'none';
                e.target.style.background = 'var(--bg-canvas)';
            }}
        />

        {/* Loading spinner */}
        <AnimatePresence>
            {isSearching && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.15 }}
                    style={{ position: 'absolute', right: '12px', top: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    <motion.svg
                        width="16" height="16" viewBox="0 0 16 16" fill="none"
                        style={{ display: 'block' }}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
                    >
                        <circle cx="8" cy="8" r="6" stroke="rgba(59,130,246,0.15)" strokeWidth="2" fill="none" />
                        <circle cx="8" cy="8" r="6" stroke={ACCENT_COLOR} strokeWidth="2" strokeLinecap="round" strokeDasharray="28" strokeDashoffset="21" fill="none" />
                    </motion.svg>
                </motion.div>
            )}
        </AnimatePresence>

        {/* Clear button */}
        <AnimatePresence>
            {value && !isSearching && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.15 }}
                    style={{ position: 'absolute', right: '10px', top: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    <motion.button
                        onClick={onClear}
                        aria-label="Clear search"
                        title="Clear search"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        style={{ background: 'rgba(0,0,0,0.06)', border: 'none', borderRadius: '6px', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </motion.button>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
);

export default ModalSearchInput;
