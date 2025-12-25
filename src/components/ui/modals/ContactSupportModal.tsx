/**
 * Contact Support Modal - Minimalistic Design
 * Contact form with support options and FAQ quick links
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, LayoutGroup } from 'motion/react';

interface ContactSupportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const BLUE = '#3b82f6';

// SVG Icons
const CloseIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 6L6 18M6 6l12 12" />
    </svg>
);

const EmailIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
);

const ChatIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
);

const PhoneIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
);


const SendIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="22" y1="2" x2="11" y2="13" />
        <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
);

const CheckIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

interface SupportOption {
    id: string;
    icon: React.ReactNode;
    title: string;
    description: string;
    action: string;
    color: string;
}

const supportOptions: SupportOption[] = [
    {
        id: 'email',
        icon: <EmailIcon />,
        title: 'Email Support',
        description: 'Get a response within 24 hours',
        action: 'support@elms-sti.edu.ph',
        color: '#3b82f6',
    },
    {
        id: 'chat',
        icon: <ChatIcon />,
        title: 'Live Chat',
        description: 'Chat with our support team',
        action: 'Start Chat',
        color: '#10b981',
    },
    {
        id: 'phone',
        icon: <PhoneIcon />,
        title: 'Phone Support',
        description: 'Mon-Fri, 8AM-5PM',
        action: '(044) 123-4567',
        color: '#8b5cf6',
    },
];


// Arrow Icon for cards
const ArrowIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
);

// Support Option Card with enhanced animations
const SupportOptionCard: React.FC<{
    option: SupportOption;
    index: number;
    isDarkMode: boolean;
    onClick: () => void;
}> = ({ option, index, isDarkMode, onClick }) => {
    const [isHovered, setIsHovered] = React.useState(false);
    
    return (
        <motion.button
            layout
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ delay: index * 0.06, type: 'spring', damping: 25, stiffness: 300 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: '12px',
                border: `1px solid ${isHovered ? `${option.color}40` : isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}`,
                background: isHovered 
                    ? isDarkMode ? `${option.color}10` : `${option.color}05`
                    : isDarkMode ? 'rgba(255,255,255,0.02)' : '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                textAlign: 'left',
                boxShadow: isHovered 
                    ? `0 4px 16px ${option.color}15` 
                    : isDarkMode ? '0 1px 4px rgba(0,0,0,0.15)' : '0 1px 4px rgba(0,0,0,0.03)',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
            }}
        >
            <motion.div
                animate={{ 
                    scale: isHovered ? 1.08 : 1,
                    rotate: isHovered ? [0, -5, 5, 0] : 0,
                }}
                transition={{ duration: 0.3 }}
                style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: isHovered ? option.color : `${option.color}12`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isHovered ? '#ffffff' : option.color,
                    flexShrink: 0,
                    transition: 'all 0.25s ease',
                }}
            >
                {option.icon}
            </motion.div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={{
                    margin: 0,
                    fontSize: '13px',
                    fontWeight: 600,
                    color: isDarkMode ? '#f1f5f9' : '#0f172a',
                    transition: 'color 0.2s',
                }}>
                    {option.title}
                </h4>
                <p style={{
                    margin: '3px 0 0',
                    fontSize: '11px',
                    color: isDarkMode ? '#64748b' : '#94a3b8',
                }}>
                    {option.description}
                </p>
            </div>
            <motion.div
                animate={{ x: isHovered ? 4 : 0, opacity: isHovered ? 1 : 0.6 }}
                transition={{ duration: 0.2 }}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: option.color,
                }}
            >
                <span style={{
                    fontSize: '10px',
                    fontWeight: 500,
                    opacity: isHovered ? 1 : 0,
                    transform: isHovered ? 'translateX(0)' : 'translateX(-8px)',
                    transition: 'all 0.2s ease',
                }}>
                    {option.id === 'chat' ? 'Start' : 'Contact'}
                </span>
                <ArrowIcon />
            </motion.div>
        </motion.button>
    );
};


const ContactSupportModal: React.FC<ContactSupportModalProps> = ({ isOpen, onClose }) => {
    const [isDarkMode, setIsDarkMode] = useState(() => document.body.classList.contains('dark-mode'));
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    useEffect(() => {
        const checkDarkMode = () => setIsDarkMode(document.body.classList.contains('dark-mode'));
        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!isOpen) {
            setSubject('');
            setMessage('');
            setIsSubmitted(false);
        }
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subject.trim() || !message.trim()) return;
        
        setIsSubmitting(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsSubmitting(false);
        setIsSubmitted(true);
    };

    const handleOptionClick = (optionId: string) => {
        if (optionId === 'email') {
            window.location.href = 'mailto:support@elms-sti.edu.ph';
        } else if (optionId === 'chat') {
            // Could open a chat widget
            console.log('Opening chat...');
        } else if (optionId === 'phone') {
            window.location.href = 'tel:+63441234567';
        }
    };


    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 99998,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px',
                }}>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        style={{
                            position: 'absolute',
                            inset: 0,
                            background: isDarkMode ? 'rgba(0, 0, 0, 0.85)' : 'rgba(0, 0, 0, 0.6)',
                            backdropFilter: 'blur(12px)',
                        }}
                    />

                    {/* Modal */}
                    <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ 
                            type: 'spring', 
                            damping: 28, 
                            stiffness: 350,
                            layout: { type: 'spring', damping: 25, stiffness: 200 }
                        }}
                        style={{
                            position: 'relative',
                            width: '100%',
                            maxWidth: '520px',
                            maxHeight: '85vh',
                            background: isDarkMode ? '#0f172a' : '#f8fafc',
                            borderRadius: '20px',
                            boxShadow: isDarkMode 
                                ? '0 25px 80px rgba(0, 0, 0, 0.6)' 
                                : '0 25px 80px rgba(0, 0, 0, 0.2)',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                    >

                        {/* Header */}
                        <div style={{
                            padding: '20px 24px 16px',
                            borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                            background: isDarkMode ? '#1e293b' : '#ffffff',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <motion.div
                                        initial={{ scale: 0, rotate: -180 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ type: 'spring', delay: 0.1 }}
                                        style={{
                                            width: '42px',
                                            height: '42px',
                                            borderRadius: '12px',
                                            background: BLUE,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#ffffff',
                                            boxShadow: `0 4px 12px ${BLUE}40`,
                                        }}
                                    >
                                        <ChatIcon />
                                    </motion.div>
                                    <div>
                                        <h2 style={{
                                            margin: 0,
                                            fontSize: '18px',
                                            fontWeight: 700,
                                            color: isDarkMode ? '#f1f5f9' : '#0f172a',
                                        }}>
                                            Contact Support
                                        </h2>
                                        <p style={{
                                            margin: '2px 0 0',
                                            fontSize: '12px',
                                            color: isDarkMode ? '#64748b' : '#94a3b8',
                                        }}>
                                            We're here to help you
                                        </p>
                                    </div>
                                </div>
                                <motion.button
                                    onClick={onClose}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    style={{
                                        width: '36px',
                                        height: '36px',
                                        borderRadius: '10px',
                                        border: 'none',
                                        background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: isDarkMode ? '#94a3b8' : '#64748b',
                                    }}
                                >
                                    <CloseIcon />
                                </motion.button>
                            </div>
                        </div>


                        {/* Content */}
                        <motion.div 
                            layout
                            style={{
                                flex: 1,
                                overflowY: 'auto',
                                padding: '20px 24px',
                            }}
                        >
                            <LayoutGroup>
                                <AnimatePresence mode="wait">
                                    {isSubmitted ? (
                                        /* Success State */
                                        <motion.div
                                            key="success"
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            style={{
                                                textAlign: 'center',
                                                padding: '40px 20px',
                                            }}
                                        >
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ type: 'spring', delay: 0.2 }}
                                                style={{
                                                    width: '64px',
                                                    height: '64px',
                                                    margin: '0 auto 16px',
                                                    borderRadius: '50%',
                                                    background: '#10b98120',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: '#10b981',
                                                }}
                                            >
                                                <CheckIcon />
                                            </motion.div>
                                            <h3 style={{
                                                margin: '0 0 8px',
                                                fontSize: '18px',
                                                fontWeight: 600,
                                                color: isDarkMode ? '#f1f5f9' : '#0f172a',
                                            }}>
                                                Message Sent!
                                            </h3>
                                            <p style={{
                                                margin: '0 0 20px',
                                                fontSize: '13px',
                                                color: isDarkMode ? '#64748b' : '#94a3b8',
                                            }}>
                                                We'll get back to you within 24 hours.
                                            </p>
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={onClose}
                                                style={{
                                                    padding: '10px 24px',
                                                    borderRadius: '10px',
                                                    border: 'none',
                                                    background: BLUE,
                                                    color: '#ffffff',
                                                    fontSize: '13px',
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                Done
                                            </motion.button>
                                        </motion.div>
                                    ) : (

                                        /* Form State */
                                        <motion.div
                                            key="form"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                        >
                                            {/* Support Options */}
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                style={{ marginBottom: '20px' }}
                                            >
                                                <div style={{ 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    gap: '8px',
                                                    marginBottom: '14px',
                                                }}>
                                                    <div style={{
                                                        width: '4px',
                                                        height: '16px',
                                                        borderRadius: '2px',
                                                        background: `linear-gradient(180deg, ${BLUE} 0%, #60a5fa 100%)`,
                                                    }} />
                                                    <h4 style={{
                                                        margin: 0,
                                                        fontSize: '11px',
                                                        fontWeight: 600,
                                                        color: isDarkMode ? '#94a3b8' : '#64748b',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.08em',
                                                    }}>
                                                        Quick Contact
                                                    </h4>
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    {supportOptions.map((option, index) => (
                                                        <SupportOptionCard
                                                            key={option.id}
                                                            option={option}
                                                            index={index}
                                                            isDarkMode={isDarkMode}
                                                            onClick={() => handleOptionClick(option.id)}
                                                        />
                                                    ))}
                                                </div>
                                            </motion.div>

                                            {/* Divider */}
                                            <motion.div 
                                                initial={{ opacity: 0, scaleX: 0 }}
                                                animate={{ opacity: 1, scaleX: 1 }}
                                                transition={{ delay: 0.2, duration: 0.4 }}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '16px',
                                                    margin: '24px 0',
                                                }}
                                            >
                                                <div style={{ 
                                                    flex: 1, 
                                                    height: '1px', 
                                                    background: `linear-gradient(90deg, transparent 0%, ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'} 50%, transparent 100%)`,
                                                }} />
                                                <span style={{ 
                                                    fontSize: '10px', 
                                                    color: isDarkMode ? '#64748b' : '#94a3b8', 
                                                    fontWeight: 500,
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.05em',
                                                }}>
                                                    or send a message
                                                </span>
                                                <div style={{ 
                                                    flex: 1, 
                                                    height: '1px', 
                                                    background: `linear-gradient(90deg, transparent 0%, ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'} 50%, transparent 100%)`,
                                                }} />
                                            </motion.div>


                                            {/* Contact Form */}
                                            <form onSubmit={handleSubmit}>
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.25 }}
                                                    style={{ marginBottom: '12px' }}
                                                >
                                                    <label style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        fontSize: '11px',
                                                        fontWeight: 600,
                                                        color: isDarkMode ? '#94a3b8' : '#64748b',
                                                        marginBottom: '8px',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.05em',
                                                    }}>
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                                            <polyline points="22,6 12,13 2,6" />
                                                        </svg>
                                                        Subject
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={subject}
                                                        onChange={(e) => setSubject(e.target.value)}
                                                        placeholder="What do you need help with?"
                                                        style={{
                                                            width: '100%',
                                                            padding: '11px 14px',
                                                            borderRadius: '10px',
                                                            border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                                                            background: isDarkMode ? 'rgba(255,255,255,0.02)' : '#ffffff',
                                                            color: isDarkMode ? '#f1f5f9' : '#0f172a',
                                                            fontSize: '13px',
                                                            outline: 'none',
                                                            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                                        }}
                                                        onFocus={(e) => {
                                                            e.target.style.borderColor = BLUE;
                                                            e.target.style.boxShadow = `0 0 0 3px ${BLUE}15`;
                                                            e.target.style.background = isDarkMode ? 'rgba(255,255,255,0.04)' : '#ffffff';
                                                        }}
                                                        onBlur={(e) => {
                                                            e.target.style.borderColor = isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
                                                            e.target.style.boxShadow = 'none';
                                                            e.target.style.background = isDarkMode ? 'rgba(255,255,255,0.02)' : '#ffffff';
                                                        }}
                                                    />
                                                </motion.div>


                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.3 }}
                                                    style={{ marginBottom: '16px' }}
                                                >
                                                    <label style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        fontSize: '11px',
                                                        fontWeight: 600,
                                                        color: isDarkMode ? '#94a3b8' : '#64748b',
                                                        marginBottom: '8px',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.05em',
                                                    }}>
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                                        </svg>
                                                        Message
                                                    </label>
                                                    <textarea
                                                        value={message}
                                                        onChange={(e) => setMessage(e.target.value)}
                                                        placeholder="Describe your issue or question..."
                                                        rows={3}
                                                        style={{
                                                            width: '100%',
                                                            padding: '11px 14px',
                                                            borderRadius: '10px',
                                                            border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                                                            background: isDarkMode ? 'rgba(255,255,255,0.02)' : '#ffffff',
                                                            color: isDarkMode ? '#f1f5f9' : '#0f172a',
                                                            fontSize: '13px',
                                                            outline: 'none',
                                                            resize: 'none',
                                                            minHeight: '80px',
                                                            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                                            fontFamily: 'inherit',
                                                        }}
                                                        onFocus={(e) => {
                                                            e.target.style.borderColor = BLUE;
                                                            e.target.style.boxShadow = `0 0 0 3px ${BLUE}15`;
                                                            e.target.style.background = isDarkMode ? 'rgba(255,255,255,0.04)' : '#ffffff';
                                                        }}
                                                        onBlur={(e) => {
                                                            e.target.style.borderColor = isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
                                                            e.target.style.boxShadow = 'none';
                                                            e.target.style.background = isDarkMode ? 'rgba(255,255,255,0.02)' : '#ffffff';
                                                        }}
                                                    />
                                                </motion.div>

                                                {/* Character count */}
                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: 0.35 }}
                                                    style={{
                                                        display: 'flex',
                                                        justifyContent: 'flex-end',
                                                        marginBottom: '16px',
                                                    }}
                                                >
                                                    <span style={{
                                                        fontSize: '10px',
                                                        color: message.length > 500 
                                                            ? '#ef4444' 
                                                            : isDarkMode ? '#475569' : '#cbd5e1',
                                                        fontWeight: 500,
                                                    }}>
                                                        {message.length}/500
                                                    </span>
                                                </motion.div>

                                                <motion.button
                                                    type="submit"
                                                    disabled={isSubmitting || !subject.trim() || !message.trim()}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.4 }}
                                                    whileHover={subject.trim() && message.trim() ? { scale: 1.01, y: -1 } : {}}
                                                    whileTap={subject.trim() && message.trim() ? { scale: 0.99 } : {}}
                                                    style={{
                                                        width: '100%',
                                                        padding: '12px 16px',
                                                        borderRadius: '10px',
                                                        border: 'none',
                                                        background: (!subject.trim() || !message.trim()) 
                                                            ? isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
                                                            : `linear-gradient(135deg, ${BLUE} 0%, #2563eb 100%)`,
                                                        color: (!subject.trim() || !message.trim())
                                                            ? isDarkMode ? '#475569' : '#94a3b8'
                                                            : '#ffffff',
                                                        fontSize: '13px',
                                                        fontWeight: 600,
                                                        cursor: (!subject.trim() || !message.trim()) ? 'not-allowed' : 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '8px',
                                                        boxShadow: (!subject.trim() || !message.trim()) 
                                                            ? 'none' 
                                                            : `0 4px 14px ${BLUE}35`,
                                                        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                                    }}
                                                >
                                                    {isSubmitting ? (
                                                        <>
                                                            <motion.div
                                                                animate={{ rotate: 360 }}
                                                                transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                                                                style={{
                                                                    width: '16px',
                                                                    height: '16px',
                                                                    border: '2px solid rgba(255,255,255,0.3)',
                                                                    borderTopColor: '#ffffff',
                                                                    borderRadius: '50%',
                                                                }}
                                                            />
                                                            <span>Sending...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <SendIcon />
                                                            Send Message
                                                        </>
                                                    )}
                                                </motion.button>
                                            </form>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </LayoutGroup>
                        </motion.div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default ContactSupportModal;
