/**
 * MessageEditForm Component
 * Inline edit form for editing message content
 */

import React from 'react';
import { motion } from 'motion/react';
import type { ChatColors } from '../types';

interface MessageEditFormProps {
    editingContent: string;
    setEditingContent: (content: string) => void;
    onSave: () => void;
    onCancel: () => void;
    isOwn: boolean;
    
    
}

export const MessageEditForm: React.FC<MessageEditFormProps> = ({
    editingContent,
    setEditingContent,
    onSave,
    onCancel,
    isOwn }) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <textarea
                value={editingContent}
                onChange={(e) => setEditingContent(e.target.value)}
                autoFocus
                style={{
                    width: '100%',
                    minHeight: '60px',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: `1px solid ${isOwn ? 'rgba(255,255,255,0.3)' : 'var(--border-color)'}`,
                    background: isOwn ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
                    color: isOwn ? '#fff' : 'var(--text-primary)',
                    fontSize: '14px',
                    lineHeight: 1.5,
                    resize: 'none',
                    outline: 'none',
                    fontFamily: 'inherit' }}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        onSave();
                    }
                    if (e.key === 'Escape') {
                        onCancel();
                    }
                }}
            />
            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onCancel}
                    style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: 'none',
                        background: isOwn ? 'rgba(255,255,255,0.15)' : ('var(--bg-hover)'),
                        color: isOwn ? 'rgba(255,255,255,0.9)' : 'var(--text-secondary)',
                        fontSize: '12px',
                        fontWeight: 500,
                        cursor: 'pointer' }}
                >
                    Cancel
                </motion.button>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onSave}
                    style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        border: 'none',
                        background: isOwn ? 'rgba(255,255,255,0.25)' : 'var(--accent-color)',
                        color: '#fff',
                        fontSize: '12px',
                        fontWeight: 500,
                        cursor: 'pointer' }}
                >
                    Save
                </motion.button>
            </div>
        </div>
    );
};
