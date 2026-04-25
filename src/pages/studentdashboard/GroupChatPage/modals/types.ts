/**
 * GroupChatPage Modal Types
 * Shared type definitions for modal components
 */

// Common type used by all modals
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
    
}

// File data for file sharing
export interface FileShareData {
    name: string;
    type: string;
    size: number;
    lastModified: number;
    preview?: string;
    file?: File;
}
