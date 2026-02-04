/**
 * Leaderboard Modal Component
 * Displays member rankings by XP with minimalistic professional design
 */

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import type { ModalColors } from './types';
import type { MemberStats } from '../types';

interface LeaderboardModalProps {
    isOpen: boolean;
    onClose: () => void;
    members: MemberStats[];
    currentUserId: string;
    colors: ModalColors;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ isOpen, onClose, members, currentUserId, colors }) => {
    const [hoveredMember, setHoveredMember] = useState<string | null>(null);
    
    if (!isOpen) return null;

    const isDarkMode = colors.cardBg !== '#ffffff';
    const sortedMembers = [...members].sort((a, b) => b.xp - a.xp);
    
    const getRankStyle = (index: number) => {
        if (index === 0) return { bg: isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: isDarkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)', icon: '🥇' };
        if (index === 1) return { bg: isDarkMode ? 'rgba(100, 116, 139, 0.15)' : 'rgba(100, 116, 139, 0.1)', color: '#64748b', border: isDarkMode ? 'rgba(100, 116, 139, 0.3)' : 'rgba(100, 116, 139, 0.2)', icon: '🥈' };
        if (index === 2) return { bg: isDarkMode ? 'rgba(180, 83, 9, 0.12)' : 'rgba(180, 83, 9, 0.08)', color: '#b45309', border: isDarkMode ? 'rgba(180, 83, 9, 0.25)' : 'rgba(180, 83, 9, 0.15)', icon: '🥉' };
        return { bg: 'transparent', color: colors.textMuted, border: colors.border, icon: '' };
    };

    return createPortal(
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0, background: isDarkMode ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.3)',
                backdropFilter: 'blur(8px)', zIndex: 1001,
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
            }}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: colors.cardBg, 
                    borderRadius: '14px',
                    width: '100%', 
                    maxWidth: '380px', 
                    maxHeight: '75vh',
                    boxShadow: isDarkMode ? '0 25px 50px rgba(0,0,0,0.5)' : '0 20px 40px rgba(0,0,0,0.1)',
                    border: `1.5px solid #3b82f6`,
                    overflow: 'hidden',
                }}
            >
                {/* Header */}
                <div style={{ 
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 18px',
                    borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <motion.div 
                            whileHover={{ scale: 1.05 }}
                            style={{
                                width: 34, height: 34, borderRadius: '10px',
                                border: '1.5px solid #3b82f6',
                                background: isDarkMode ? 'rgba(30, 41, 59, 1)' : '#ffffff',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                <path d="M15 21H9V12.6C9 12.2686 9.26863 12 9.6 12H14.4C14.7314 12 15 12.2686 15 12.6V21Z" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M20.4 21H15V18.1C15 17.7686 15.2686 17.5 15.6 17.5H20.4C20.7314 17.5 21 17.7686 21 18.1V20.4C21 20.7314 20.7314 21 20.4 21Z" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M9 21V16.1C9 15.7686 8.73137 15.5 8.4 15.5H3.6C3.26863 15.5 3 15.7686 3 16.1V20.4C3 20.7314 3.26863 21 3.6 21H9Z" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M10.8056 5.11325L11.7147 3.1856C11.8314 2.93813 12.1686 2.93813 12.2853 3.1856L13.1944 5.11325L15.2275 5.42427C15.4884 5.46418 15.5923 5.79977 15.4035 5.99229L13.9326 7.4917L14.2797 9.60999C14.3243 9.88202 14.0515 10.0895 13.8181 9.96099L12 8.96031L10.1819 9.96099C9.94851 10.0895 9.67568 9.88202 9.72026 9.60999L10.0674 7.4917L8.59651 5.99229C8.40766 5.79977 8.51163 5.46418 8.77248 5.42427L10.8056 5.11325Z" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="rgba(59, 130, 246, 0.15)"/>
                            </svg>
                        </motion.div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: colors.textPrimary, letterSpacing: '-0.01em' }}>
                                Leaderboard
                            </h3>
                            <p style={{ margin: 0, fontSize: '11px', color: colors.textMuted }}>
                                {sortedMembers.length} member{sortedMembers.length !== 1 ? 's' : ''} ranked
                            </p>
                        </div>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.05, background: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onClose}
                        style={{
                            width: 30, height: 30, borderRadius: '8px',
                            border: '1.5px solid #3b82f6',
                            background: isDarkMode ? 'rgba(30, 41, 59, 1)' : '#ffffff',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#3b82f6',
                        }}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </motion.button>
                </div>

                {/* Members List */}
                <div style={{ overflowY: 'auto', maxHeight: 'calc(75vh - 80px)', padding: '10px 14px' }}>
                    {sortedMembers.map((member, index) => {
                        const isCurrentUser = member.odId === currentUserId;
                        const rankStyle = getRankStyle(index);
                        const isHovered = hoveredMember === member.odId;
                        
                        return (
                            <motion.div
                                key={member.odId}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.025, duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                                whileHover={{ scale: 1.01, x: 2 }}
                                onHoverStart={() => setHoveredMember(member.odId)}
                                onHoverEnd={() => setHoveredMember(null)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    padding: '10px 12px', borderRadius: '10px', marginBottom: '4px',
                                    background: isCurrentUser 
                                        ? (isDarkMode ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.04)')
                                        : isHovered ? (isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)') : 'transparent',
                                    border: isCurrentUser 
                                        ? `1px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)'}`
                                        : '1px solid transparent',
                                    cursor: 'pointer',
                                }}
                            >
                                <motion.div 
                                    whileHover={{ scale: 1.1 }}
                                    style={{ 
                                        width: 26, height: 26, borderRadius: '8px',
                                        background: index < 3 ? rankStyle.bg : (isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'),
                                        border: `1px solid ${index < 3 ? rankStyle.border : 'transparent'}`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: index < 3 ? '12px' : '10px', fontWeight: 600, color: rankStyle.color, flexShrink: 0,
                                    }}
                                >
                                    {index < 3 ? rankStyle.icon : index + 1}
                                </motion.div>
                                
                                <motion.div 
                                    whileHover={{ scale: 1.05 }}
                                    style={{
                                        width: 34, height: 34, borderRadius: '9px',
                                        background: isDarkMode ? 'rgba(59, 130, 246, 0.12)' : 'rgba(59, 130, 246, 0.08)',
                                        border: `1px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.12)'}`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '13px', fontWeight: 600, color: '#3b82f6', flexShrink: 0,
                                    }}
                                >
                                    {member.odName.charAt(0).toUpperCase()}
                                </motion.div>
                                
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{ 
                                            fontSize: '12.5px', fontWeight: 500, color: colors.textPrimary,
                                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                        }}>
                                            {member.odName}
                                        </span>
                                        {isCurrentUser && (
                                            <span style={{
                                                fontSize: '8px', fontWeight: 600, color: '#3b82f6',
                                                background: isDarkMode ? 'rgba(59, 130, 246, 0.12)' : 'rgba(59, 130, 246, 0.08)',
                                                padding: '2px 5px', borderRadius: '4px', textTransform: 'uppercase',
                                            }}>
                                                You
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: colors.textMuted, marginTop: '1px' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                                            <svg width="9" height="9" viewBox="0 0 24 24" fill="#3b82f6" stroke="none">
                                                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                                            </svg>
                                            Lv.{member.level}
                                        </span>
                                        {member.streak > 0 && (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '2px', color: '#f97316' }}>
                                                <svg width="9" height="9" viewBox="0 0 24 24" fill="#f97316" stroke="none">
                                                    <path d="M12 2c-1.5 4-4 6-4 10a4 4 0 0 0 8 0c0-4-2.5-6-4-10z" />
                                                </svg>
                                                {member.streak}d
                                            </span>
                                        )}
                                    </div>
                                </div>
                                
                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                    <motion.div 
                                        animate={{ scale: isHovered ? 1.05 : 1 }}
                                        style={{ fontSize: '13px', fontWeight: 600, color: index < 3 ? rankStyle.color : '#3b82f6' }}
                                    >
                                        {member.xp.toLocaleString()}
                                    </motion.div>
                                    <div style={{ fontSize: '9px', color: colors.textMuted, fontWeight: 500 }}>XP</div>
                                </div>
                            </motion.div>
                        );
                    })}
                    
                    {sortedMembers.length === 0 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '32px 20px', color: colors.textMuted }}>
                            <div style={{
                                width: 48, height: 48, borderRadius: '12px',
                                border: '1.5px solid #3b82f6',
                                background: isDarkMode ? 'rgba(30, 41, 59, 1)' : '#ffffff',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 12px',
                            }}>
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.5">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                            </div>
                            <p style={{ fontSize: '12px', margin: 0, fontWeight: 500 }}>No members yet</p>
                        </motion.div>
                    )}
                </div>
            </motion.div>
        </motion.div>,
        document.body
    );
};
