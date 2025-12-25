/**
 * Join Group Page - Handles invite link redirects
 * Minimalistic design matching the Groups page style
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { joinGroupByInvite } from '../../services/groupsService';
import type { JoinStatus } from './types';

const JoinGroupPage: React.FC = () => {
    const { inviteCode } = useParams<{ inviteCode: string }>();
    const navigate = useNavigate();
    const [status, setStatus] = useState<JoinStatus>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const processInvite = async () => {
            if (!inviteCode) {
                setStatus('error');
                setMessage('Invalid invite link');
                return;
            }

            const result = await joinGroupByInvite(inviteCode);
            
            if (result.success) {
                setStatus('success');
                setMessage('You have successfully joined the group!');
                setTimeout(() => {
                    navigate('/dashboard', { state: { activeTab: 'groups', joinedGroupId: result.groupId } });
                }, 2000);
            } else {
                if (result.error?.includes('already a member')) {
                    setStatus('already-member');
                    setMessage('You are already a member of this group');
                } else {
                    setStatus('error');
                    setMessage(result.error || 'Failed to join group');
                }
            }
        };

        processInvite();
    }, [inviteCode, navigate]);

    const getStatusIcon = () => {
        const iconSize = 40;
        switch (status) {
            case 'loading':
                return (
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        style={{
                            width: 48, height: 48, borderRadius: '12px',
                            background: 'rgba(59, 130, 246, 0.08)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                    >
                        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                        </svg>
                    </motion.div>
                );
            case 'success':
                return (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                        style={{
                            width: 48, height: 48, borderRadius: '12px',
                            background: 'rgba(16, 185, 129, 0.08)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                    >
                        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                    </motion.div>
                );
            case 'already-member':
                return (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                        dangerouslySetInnerHTML={{
                            __html: `<lord-icon
                                src="https://cdn.lordicon.com/juujmrhr.json"
                                trigger="in"
                                delay="500"
                                state="in-reveal"
                                colors="primary:#f59e0b,secondary:#f59e0b"
                                style="width:80px;height:80px">
                            </lord-icon>`
                        }}
                    />
                );
            case 'error':
                return (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                        style={{
                            width: 48, height: 48, borderRadius: '12px',
                            background: 'rgba(239, 68, 68, 0.08)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                    >
                        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="15" y1="9" x2="9" y2="15" />
                            <line x1="9" y1="9" x2="15" y2="15" />
                        </svg>
                    </motion.div>
                );
        }
    };

    const getButtonStyle = () => {
        const baseColor = status === 'already-member' ? '#f59e0b' : status === 'error' ? '#ef4444' : '#3b82f6';
        return {
            padding: '10px 20px',
            borderRadius: '10px',
            background: `${baseColor}10`,
            border: `1px solid ${baseColor}30`,
            color: baseColor,
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
        };
    };

    const getTitle = () => {
        switch (status) {
            case 'loading': return 'Joining Group...';
            case 'success': return 'Welcome!';
            case 'already-member': return 'Already a Member';
            case 'error': return 'Unable to Join';
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f8fafc',
            padding: '20px',
        }}>
            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    border: '1px solid rgba(0, 0, 0, 0.06)',
                    padding: '32px 40px',
                    textAlign: 'center',
                    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)',
                    maxWidth: '360px',
                    width: '100%',
                }}
            >
                <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
                    {getStatusIcon()}
                </div>

                <h1 style={{
                    margin: '0 0 8px',
                    fontSize: '18px',
                    fontWeight: 600,
                    color: '#0f172a',
                }}>
                    {getTitle()}
                </h1>

                <p style={{
                    margin: '0 0 20px',
                    fontSize: '13px',
                    color: '#64748b',
                    lineHeight: 1.5,
                }}>
                    {message || 'Processing your invite link...'}
                </p>

                {status === 'success' && (
                    <p style={{
                        margin: 0,
                        fontSize: '11px',
                        color: '#94a3b8',
                    }}>
                        Redirecting to dashboard...
                    </p>
                )}

                {(status === 'error' || status === 'already-member') && (
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <motion.button
                            whileHover={{ 
                                scale: 1.02,
                                boxShadow: status === 'already-member' 
                                    ? '0 6px 20px rgba(245, 158, 11, 0.25)'
                                    : '0 6px 20px rgba(239, 68, 68, 0.25)',
                            }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate('/dashboard', { state: { activeTab: 'groups' } })}
                            style={getButtonStyle() as React.CSSProperties}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                            Go to Groups
                        </motion.button>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default JoinGroupPage;
