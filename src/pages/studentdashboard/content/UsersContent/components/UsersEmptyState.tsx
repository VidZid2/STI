/**
 * UsersEmptyState
 * Empty state display for UsersContent.
 * Extracted from UsersContent.tsx during Phase 8.4
 */
import React from 'react';
import { motion } from 'motion/react';

// Empty State Component
const EmptyState: React.FC<{ searchQuery: string; colors: { textPrimary: string; textSecondary: string } }> = ({ searchQuery, colors }) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '60px 20px',
                textAlign: 'center',
            }}
        >
            <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '18px',
                    background: 'var(--bg-hover)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '20px',
                }}
            >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={'var(--text-muted)'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
            </motion.div>
            <h3 style={{
                margin: 0,
                fontSize: '16px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '8px',
            }}>
                {searchQuery ? 'No users found' : 'No users yet'}
            </h3>
            <p style={{
                margin: 0,
                fontSize: '13px',
                color: 'var(--text-secondary)',
                maxWidth: '300px',
            }}>
                {searchQuery 
                    ? `No users match "${searchQuery}". Try a different search term.`
                    : 'Users will appear here once they are added to the system.'
                }
            </p>
        </motion.div>
    );
};


export { EmptyState };
