/**
 * GroupChatPage Modal Types
 * Shared type definitions for modal components
 */

// Common colors type used by all modals
export type ModalColors = {
    cardBg: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    accent: string;
    border: string;
    bg: string;
};

// Base modal props
export interface BaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    colors: ModalColors;
}
