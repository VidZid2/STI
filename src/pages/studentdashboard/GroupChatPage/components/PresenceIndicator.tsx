/**
 * PresenceIndicator - Shows who's currently viewing the chat
 * Minimalistic design with avatars and count
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { PresenceUser } from '../../../../services/presenceService';
import type {} from '../types';

interface PresenceIndicatorProps {
    viewers: PresenceUser[];
    currentUserId: string;
    
    
    maxAvatars?: number;
}

export const PresenceIndicator: React.FC<PresenceIndicatorProps> = ({
    viewers,
    currentUserId,
    
    
    maxAvatars = 4 }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    // Filter out current user and get other viewers
    const otherViewers = viewers.filter(v => v.id !== currentUserId);
    const viewerCount = otherViewers.length;

    // Show minimal indicator even when alone (for visibility)
    if (viewerCount === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '5px 10px',
                    background: 'rgba(100, 116, 139, 0.1)',
                    border: `1px solid ${'rgba(100, 116, 139, 0.2)'}`,
                    borderRadius: '16px' }}
            >
                <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#64748b"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                </svg>
                <span style={{
                    fontSize: '11px',
                    fontWeight: 500,
                    color: '#64748b' }}>
                    Only you
                </span>
            </motion.div>
        );
    }

    const displayedViewers = otherViewers.slice(0, maxAvatars);
    const remainingCount = viewerCount - maxAvatars;

    return (
        <div style={{ position: 'relative' }}>
            {/* Compact View */}
            <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsExpanded(!isExpanded)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 12px',
                    background: 'rgba(34, 197, 94, 0.1)',
                    border: `1px solid ${'rgba(34, 197, 94, 0.2)'}`,
                    borderRadius: '20px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease' }}
            >
                {/* Eye Icon */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center' }}>
                    <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#22c55e"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                    </svg>
                </div>

                {/* Stacked Avatars */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center' }}>
                    {displayedViewers.map((viewer, idx) => (
                        <motion.div
                            key={viewer.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            style={{
                                width: 22,
                                height: 22,
                                borderRadius: '50%',
                                background: viewer.avatar ? 'transparent' : '#22c55e',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '9px',
                                fontWeight: 700,
                                color: '#fff',
                                border: `2px solid ${'var(--bg-hover)'}`,
                                marginLeft: idx > 0 ? '-8px' : 0,
                                overflow: 'hidden',
                                position: 'relative',
                                zIndex: maxAvatars - idx }}
                            title={viewer.name}
                        >
                            {viewer.avatar ? (
                                <img
                                    src={viewer.avatar}
                                    alt={viewer.name}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover' }}
                                />
                            ) : (
                                viewer.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                            )}
                            {/* Online dot */}
                            <div style={{
                                position: 'absolute',
                                bottom: -1,
                                right: -1,
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                background: '#22c55e',
                                border: `1.5px solid ${'var(--bg-hover)'}` }} />
                        </motion.div>
                    ))}
                    {remainingCount > 0 && (
                        <div
                            style={{
                                width: 22,
                                height: 22,
                                borderRadius: '50%',
                                background: 'var(--bg-hover)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '8px',
                                fontWeight: 700,
                                color: '#fff',
                                border: `2px solid ${'var(--bg-hover)'}`,
                                marginLeft: '-8px' }}
                        >
                            +{remainingCount}
                        </div>
                    )}
                </div>

                {/* Count Text */}
                <span style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#22c55e',
                    whiteSpace: 'nowrap' }}>
                    {viewerCount} viewing
                </span>

                {/* Expand Icon */}
                <motion.svg
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <polyline points="6 9 12 15 18 9" />
                </motion.svg>
            </motion.button>

            {/* Expanded Dropdown */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        style={{
                            position: 'absolute',
                            top: 'calc(100% + 8px)',
                            right: 0,
                            minWidth: '200px',
                            maxWidth: '280px',
                            background: 'var(--bg-primary)',
                            borderRadius: '12px',
                            border: `1px solid ${'rgba(255,255,255,0.08)'}`,
                            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                            overflow: 'hidden',
                            zIndex: 100 }}
                    >
                        {/* Header */}
                        <div style={{
                            padding: '12px 14px',
                            borderBottom: `1px solid ${'rgba(255,255,255,0.06)'}`,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px' }}>
                            <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke={'var(--text-muted)'}
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                            <span style={{
                                fontSize: '12px',
                                fontWeight: 600,
                                color: 'var(--text-primary)' }}>
                                Currently Viewing
                            </span>
                            <span style={{
                                marginLeft: 'auto',
                                fontSize: '10px',
                                fontWeight: 600,
                                color: '#22c55e',
                                background: 'rgba(34, 197, 94, 0.15)',
                                padding: '2px 6px',
                                borderRadius: '6px' }}>
                                {viewerCount}
                            </span>
                        </div>

                        {/* Viewer List */}
                        <div style={{
                            maxHeight: '200px',
                            overflowY: 'auto',
                            padding: '8px' }}>
                            {otherViewers.map((viewer, idx) => (
                                <motion.div
                                    key={viewer.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.03 }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        padding: '8px 6px',
                                        borderRadius: '8px',
                                        transition: 'background 0.15s ease' }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'rgba(0,0,0,0.03)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'transparent';
                                    }}
                                >
                                    {/* Avatar */}
                                    <div style={{
                                        width: 28,
                                        height: 28,
                                        borderRadius: '50%',
                                        background: viewer.avatar ? 'transparent' : '#22c55e',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '10px',
                                        fontWeight: 700,
                                        color: '#fff',
                                        overflow: 'hidden',
                                        position: 'relative',
                                        flexShrink: 0 }}>
                                        {viewer.avatar ? (
                                            <img
                                                src={viewer.avatar}
                                                alt={viewer.name}
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover' }}
                                            />
                                        ) : (
                                            viewer.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                                        )}
                                        {/* Online indicator */}
                                        <div style={{
                                            position: 'absolute',
                                            bottom: 0,
                                            right: 0,
                                            width: 8,
                                            height: 8,
                                            borderRadius: '50%',
                                            background: '#22c55e',
                                            border: `2px solid ${'var(--bg-hover)'}` }} />
                                    </div>

                                    {/* Name */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{
                                            fontSize: '12px',
                                            fontWeight: 500,
                                            color: 'var(--text-primary)',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis' }}>
                                            {viewer.name}
                                        </div>
                                        <div style={{
                                            fontSize: '10px',
                                            color: '#22c55e',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px' }}>
                                            <span style={{
                                                width: 4,
                                                height: 4,
                                                borderRadius: '50%',
                                                background: '#22c55e',
                                                animation: 'pulse 2s ease-in-out infinite' }} />
                                            Online now
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Click outside to close */}
            {isExpanded && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 99 }}
                    onClick={() => setIsExpanded(false)}
                />
            )}
        </div>
    );
};

export default PresenceIndicator;
