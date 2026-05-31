import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Tooltip } from '../ui/primitives/tooltip-card';

interface WelcomeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose }) => {
    const [activeFeature, setActiveFeature] = useState('animations');
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isCloseHovered, setIsCloseHovered] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        const checkDark = () => {
            setIsDarkMode(document.body.classList.contains('dark-mode') || document.documentElement.classList.contains('dark-mode'));
        };
        checkDark();
        const observer = new MutationObserver(checkDark);
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);


    // Auto-rotate slides for engagement feature
    useEffect(() => {
        let interval: any;
        if (activeFeature === 'engagement') {
            interval = setInterval(() => {
                setCurrentSlide((prev) => (prev + 1) % 6);
            }, 5000);
        }
        return () => clearInterval(interval);
    }, [activeFeature]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className={`welcome-modal-overlay ${isOpen ? 'active' : ''}`} id="welcomeModalOverlay">
            <div className="welcome-modal">
                <motion.button 
                    className="modal-close-btn-minimal"
                    onClick={onClose}
                    onMouseEnter={() => setIsCloseHovered(true)}
                    onMouseLeave={() => setIsCloseHovered(false)}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.1, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        width: '36px',
                        height: '36px',
                        border: 'none',
                        background: 'transparent',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 99998,
                    }}
                >
                    <motion.svg 
                        width="20" 
                        height="20" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        animate={{ color: isCloseHovered ? '#ef4444' : '#666' }}
                        transition={{ duration: 0.2 }}
                    >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </motion.svg>
                </motion.button>

                {/* Left Side - Updates List */}
                <div className="modal-left">
                    <div className="modal-header">
                        <h2>Welcome to the Brand New UI of STI!</h2>
                        <p>We've completely redesigned your learning experience</p>
                    </div>

                    <div className="updates-list">
                        {/* Animations */}
                        <div className={`update-item ${activeFeature === 'animations' ? 'active' : ''}`} onClick={() => setActiveFeature('animations')}>
                            <div className="update-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M15 4V2" />
                                    <path d="M15 16v-2" />
                                    <path d="M8 9h2" />
                                    <path d="M20 9h2" />
                                    <path d="M17.8 11.8 19 13" />
                                    <path d="M15 9h0" />
                                    <path d="M17.8 6.2 19 5" />
                                    <path d="m3 21 9-9" />
                                    <path d="M12.2 6.2 11 5" />
                                </svg>
                            </div>
                            <div className="update-content">
                                <div className="update-title">Animations</div>
                                <div className="update-description">Smooth transitions and engaging effects</div>
                            </div>
                        </div>

                        {/* Bugs & Issues Fixed */}
                        <div className={`update-item ${activeFeature === 'bugs' ? 'active' : ''}`} onClick={() => setActiveFeature('bugs')}>
                            <div className="update-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="m8 2 1.88 1.88" />
                                    <path d="M14.12 3.88 16 2" />
                                    <path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1" />
                                    <path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6" />
                                    <path d="M12 20v-9" />
                                    <path d="M6.53 9C4.6 8.8 3 7.1 3 5" />
                                    <path d="M6 13H2" />
                                    <path d="M3 21c0-2.1 1.7-3.9 3.8-4" />
                                    <path d="M20.97 5c0 2.1-1.6 3.8-3.5 4" />
                                    <path d="M22 13h-4" />
                                    <path d="M17.2 17c2.1.1 3.8 1.9 3.8 4" />
                                </svg>
                            </div>
                            <div className="update-content">
                                <div className="update-title">Bugs & Issues Fixed</div>
                                <div className="update-description">Resolved critical issues and improvements</div>
                            </div>
                        </div>

                        {/* Layouts */}
                        <div className={`update-item ${activeFeature === 'layouts' ? 'active' : ''}`} onClick={() => setActiveFeature('layouts')}>
                            <div className="update-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <rect width="7" height="7" x="3" y="3" rx="1" />
                                    <rect width="7" height="7" x="14" y="3" rx="1" />
                                    <rect width="7" height="7" x="14" y="14" rx="1" />
                                    <rect width="7" height="7" x="3" y="14" rx="1" />
                                </svg>
                            </div>
                            <div className="update-content">
                                <div className="update-title">Layouts</div>
                                <div className="update-description">Modern and responsive design structure</div>
                            </div>
                        </div>

                        {/* More Settings */}
                        <div className={`update-item ${activeFeature === 'settings' ? 'active' : ''}`} onClick={() => setActiveFeature('settings')}>
                            <div className="update-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                                    <circle cx="12" cy="12" r="3" />
                                </svg>
                            </div>
                            <div className="update-content">
                                <div className="update-title">More Settings</div>
                                <div className="update-description">Enhanced customization options</div>
                            </div>
                        </div>

                        {/* Overhaul Systems */}
                        <div className={`update-item ${activeFeature === 'overhaul' ? 'active' : ''}`} onClick={() => setActiveFeature('overhaul')}>
                            <div className="update-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
                                    <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
                                    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
                                    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
                                </svg>
                            </div>
                            <div className="update-content">
                                <div className="update-title">Overhaul Systems</div>
                                <div className="update-description">Complete system architecture redesign</div>
                            </div>
                        </div>

                        {/* Quick Access */}
                        <div className={`update-item ${activeFeature === 'quick' ? 'active' : ''}`} onClick={() => setActiveFeature('quick')}>
                            <div className="update-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                                </svg>
                            </div>
                            <div className="update-content">
                                <div className="update-title">Quick Access</div>
                                <div className="update-description">Faster navigation to your tools</div>
                            </div>
                        </div>

                        {/* Flexible to Use */}
                        <div className={`update-item ${activeFeature === 'flexible' ? 'active' : ''}`} onClick={() => setActiveFeature('flexible')}>
                            <div className="update-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="5 9 2 12 5 15" />
                                    <polyline points="9 5 12 2 15 5" />
                                    <polyline points="15 19 12 22 9 19" />
                                    <polyline points="19 9 22 12 19 15" />
                                    <line x1="2" x2="22" y1="12" y2="12" />
                                    <line x1="12" x2="12" y1="2" y2="22" />
                                </svg>
                            </div>
                            <div className="update-content">
                                <div className="update-title">Flexible to Use</div>
                                <div className="update-description">Adaptable interface for your workflow</div>
                            </div>
                        </div>

                        {/* Customizable Profile */}
                        <div className={`update-item ${activeFeature === 'profile' ? 'active' : ''}`} onClick={() => setActiveFeature('profile')}>
                            <div className="update-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                            </div>
                            <div className="update-content">
                                <div className="update-title">Customizable Profile</div>
                                <div className="update-description">Personalize your experience</div>
                            </div>
                        </div>

                        {/* More Engagement */}
                        <div className={`update-item ${activeFeature === 'engagement' ? 'active' : ''}`} onClick={() => setActiveFeature('engagement')}>
                            <div className="update-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="12" x2="12" y1="20" y2="10" />
                                    <line x1="18" x2="18" y1="20" y2="4" />
                                    <line x1="6" x2="6" y1="20" y2="16" />
                                </svg>
                            </div>
                            <div className="update-content">
                                <div className="update-title">More Engagement</div>
                                <div className="update-description">Interactive features and analytics</div>
                            </div>
                        </div>

                        {/* Many More */}
                        <div className={`update-item ${activeFeature === 'more' ? 'active' : ''}`} onClick={() => setActiveFeature('more')}>
                            <div className="update-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="1" />
                                    <circle cx="19" cy="12" r="1" />
                                    <circle cx="5" cy="12" r="1" />
                                </svg>
                            </div>
                            <div className="update-content">
                                <div className="update-title">Many More</div>
                                <div className="update-description">Discover additional improvements</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Feature Details */}
                <div className="modal-right">
                    <div className="feature-details-container">
                        {/* Animations Feature — Redesigned */}
                        <div className={`feature-detail ${activeFeature === 'animations' ? 'active' : ''}`} data-feature="animations">
                            <div className="feature-description">
                                <span className="feature-category">Animations</span>
                                <h3>Everything Moves Beautifully</h3>
                                <p className="feature-intro">
                                    Every tap, click, and scroll feels alive. We use <strong>Framer Motion</strong> — the same animation engine used by Vercel, Linear, and Stripe — to bring smooth, physics-based animations to every corner of the platform.
                                </p>

                                {/* Hero Preview Image */}
                                <div style={{
                                    borderRadius: '12px',
                                    overflow: 'hidden',
                                    border: '1px solid rgba(0,0,0,0.06)',
                                    marginBottom: '20px',
                                    boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                                }}>
                                    <img
                                        src="/changelog-animations.png"
                                        alt="Animation transitions preview"
                                        style={{
                                            width: '100%',
                                            height: 'auto',
                                            display: 'block',
                                        }}
                                    />
                                </div>

                                {/* Live Animation Demos */}
                                <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>
                                    Live Demos — Watch Them Move
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>

                                    {/* Demo 1: Spring Bounce */}
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '14px',
                                        padding: '14px 16px',
                                        borderRadius: '12px',
                                        background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                                        border: '1px solid #bfdbfe',
                                    }}>
                                        <div style={{ position: 'relative', width: '52px', height: '52px', flexShrink: 0 }}>
                                            <motion.div
                                                animate={{ y: [0, -6, 0], boxShadow: ['0 2px 8px rgba(59,130,246,0.15)', '0 8px 20px rgba(59,130,246,0.3)', '0 2px 8px rgba(59,130,246,0.15)'] }}
                                                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                                                style={{
                                                    width: '52px',
                                                    height: '52px',
                                                    borderRadius: '10px',
                                                    background: 'white',
                                                    border: '1px solid #93c5fd',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                <motion.svg
                                                    width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                                    animate={{ rotate: [0, -15, 0, 15, 0] }}
                                                    transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                                                >
                                                    <path d="M12 19V5M5 12l7-7 7 7" />
                                                </motion.svg>
                                            </motion.div>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '15px', fontWeight: 700, color: '#1e40af', marginBottom: '2px' }}>Spring Physics</div>
                                            <div style={{ fontSize: '13px', color: '#3b82f6', lineHeight: 1.4 }}>
                                                Cards, buttons, and tooltips use <strong>spring-based</strong> motion — they overshoot slightly then settle, just like real objects.
                                            </div>
                                        </div>
                                    </div>

                                    {/* Demo 2: Page Slide */}
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '14px',
                                        padding: '14px 16px',
                                        borderRadius: '12px',
                                        background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
                                        border: '1px solid #bbf7d0',
                                    }}>
                                        <div style={{ position: 'relative', width: '52px', height: '52px', flexShrink: 0, borderRadius: '10px', background: 'white', border: '1px solid #86efac', overflow: 'hidden', padding: '8px' }}>
                                            <motion.div
                                                animate={{ x: [20, 0, 20] }}
                                                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                                                style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}
                                            >
                                                <motion.div animate={{ width: ['50%', '80%', '50%'] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }} style={{ height: '4px', borderRadius: '2px', background: '#22c55e' }} />
                                                <motion.div animate={{ width: ['70%', '60%', '70%'] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.1 }} style={{ height: '4px', borderRadius: '2px', background: '#86efac' }} />
                                                <motion.div animate={{ width: ['40%', '90%', '40%'] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }} style={{ height: '4px', borderRadius: '2px', background: '#22c55e' }} />
                                                <motion.div animate={{ width: ['80%', '45%', '80%'] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }} style={{ height: '4px', borderRadius: '2px', background: '#86efac' }} />
                                                <motion.div animate={{ width: ['55%', '70%', '55%'] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }} style={{ height: '4px', borderRadius: '2px', background: '#22c55e' }} />
                                            </motion.div>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '15px', fontWeight: 700, color: '#15803d', marginBottom: '2px' }}>Page Transitions</div>
                                            <div style={{ fontSize: '13px', color: '#16a34a', lineHeight: 1.4 }}>
                                                Content <strong>slides in from the right</strong> and fades simultaneously. Old content exits left. Feels like swiping between screens.
                                            </div>
                                        </div>
                                    </div>

                                    {/* Demo 3: Scale + Glow */}
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '14px',
                                        padding: '14px 16px',
                                        borderRadius: '12px',
                                        background: 'linear-gradient(135deg, #faf5ff, #f3e8ff)',
                                        border: '1px solid #e9d5ff',
                                    }}>
                                        <div style={{ position: 'relative', width: '52px', height: '52px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <motion.div
                                                animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
                                                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                                                style={{
                                                    position: 'absolute',
                                                    width: '48px',
                                                    height: '48px',
                                                    borderRadius: '10px',
                                                    background: 'rgba(147, 51, 234, 0.15)',
                                                    border: '1px solid rgba(147, 51, 234, 0.2)',
                                                }}
                                            />
                                            <motion.div
                                                animate={{ scale: [1, 1.06, 1] }}
                                                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                                                style={{
                                                    width: '36px',
                                                    height: '36px',
                                                    borderRadius: '8px',
                                                    background: 'white',
                                                    border: '1px solid #c084fc',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    zIndex: 1,
                                                }}
                                            >
                                                <motion.svg
                                                    width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                                                    animate={{ rotate: [0, 360] }}
                                                    transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                                                >
                                                    <circle cx="12" cy="12" r="10" />
                                                    <circle cx="12" cy="12" r="4" />
                                                </motion.svg>
                                            </motion.div>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '15px', fontWeight: 700, color: '#7e22ce', marginBottom: '2px' }}>Hover & Focus States</div>
                                            <div style={{ fontSize: '13px', color: '#9333ea', lineHeight: 1.4 }}>
                                                Interactive elements <strong>grow with a glow ring</strong> on hover. Focus states pulse softly to guide your attention without being distracting.
                                            </div>
                                        </div>
                                    </div>

                                    {/* Demo 4: Staggered Lists — cascading cards */}
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '14px',
                                        padding: '14px 16px',
                                        borderRadius: '12px',
                                        background: 'linear-gradient(135deg, #fff7ed, #ffedd5)',
                                        border: '1px solid #fed7aa',
                                    }}>
                                        <div style={{ position: 'relative', width: '52px', height: '52px', flexShrink: 0, borderRadius: '10px', background: 'white', border: '1px solid #fdba74', overflow: 'hidden', padding: '6px', display: 'flex', flexDirection: 'column', gap: '3px', justifyContent: 'center' }}>
                                            {[0, 1, 2, 3].map((i) => (
                                                <motion.div
                                                    key={i}
                                                    animate={{ x: [-30, 0], opacity: [0, 1] }}
                                                    transition={{ duration: 0.5, delay: i * 0.15, repeat: Infinity, repeatDelay: 2.5, ease: 'easeOut' }}
                                                    style={{
                                                        height: '7px',
                                                        borderRadius: '3px',
                                                        background: i % 2 === 0 ? '#f97316' : '#fdba74',
                                                        width: i === 0 ? '90%' : i === 1 ? '70%' : i === 2 ? '80%' : '55%',
                                                    }}
                                                />
                                            ))}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '15px', fontWeight: 700, color: '#c2410c', marginBottom: '2px' }}>Staggered Lists</div>
                                            <div style={{ fontSize: '13px', color: '#ea580c', lineHeight: 1.4 }}>
                                                Course cards, sidebar items, and notifications <strong>cascade in one-by-one</strong> with a slight delay — like a deck of cards being dealt out.
                                            </div>
                                        </div>
                                    </div>

                                    {/* Demo 5: Skeleton Loading — shimmer effect */}
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '14px',
                                        padding: '14px 16px',
                                        borderRadius: '12px',
                                        background: 'linear-gradient(135deg, #fdf2f8, #fce7f3)',
                                        border: '1px solid #fbcfe8',
                                    }}>
                                        <div style={{ position: 'relative', width: '52px', height: '52px', flexShrink: 0, borderRadius: '10px', background: 'white', border: '1px solid #f9a8d4', overflow: 'hidden', padding: '7px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                            {/* Skeleton shimmer bars */}
                                            <motion.div
                                                animate={{ opacity: [0.3, 0.7, 0.3] }}
                                                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                                                style={{ height: '10px', width: '100%', borderRadius: '3px', background: 'linear-gradient(90deg, #f9a8d4 0%, #fbcfe8 50%, #f9a8d4 100%)' }}
                                            />
                                            <motion.div
                                                animate={{ opacity: [0.3, 0.7, 0.3] }}
                                                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
                                                style={{ height: '6px', width: '75%', borderRadius: '3px', background: 'linear-gradient(90deg, #f9a8d4 0%, #fbcfe8 50%, #f9a8d4 100%)' }}
                                            />
                                            <motion.div
                                                animate={{ opacity: [0.3, 0.7, 0.3] }}
                                                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
                                                style={{ height: '6px', width: '55%', borderRadius: '3px', background: 'linear-gradient(90deg, #f9a8d4 0%, #fbcfe8 50%, #f9a8d4 100%)' }}
                                            />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '15px', fontWeight: 700, color: '#be185d', marginBottom: '2px' }}>Skeleton Loading</div>
                                            <div style={{ fontSize: '13px', color: '#db2777', lineHeight: 1.4 }}>
                                                Instead of blank screens, you see <strong>animated shimmer placeholders</strong> that pulse while content loads. The layout never shifts or jumps.
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Feature Details */}
                                <div className="feature-benefits">
                                    <div className="benefit-item">
                                        <div className="benefit-icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="13 17 18 12 13 7"></polyline>
                                                <polyline points="6 17 11 12 6 7"></polyline>
                                            </svg>
                                        </div>
                                        <div className="benefit-content">
                                            <h4>Page Transitions</h4>
                                            <p>Switch between Home, Courses, and Tools with a <strong>smooth slide + fade</strong>. No jarring page reloads — everything flows naturally.</p>
                                        </div>
                                    </div>

                                    <div className="benefit-item">
                                        <div className="benefit-icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"></path>
                                                <path d="M13 13l6 6"></path>
                                            </svg>
                                        </div>
                                        <div className="benefit-content">
                                            <h4>Hover & Tap Feedback</h4>
                                            <p>Buttons gently <strong>scale up on hover</strong> and <strong>press down on click</strong>. Cards lift with a subtle shadow. Every interaction feels tactile.</p>
                                        </div>
                                    </div>

                                    <div className="benefit-item">
                                        <div className="benefit-icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                <rect width="18" height="18" x="3" y="3" rx="2"></rect>
                                                <path d="M3 9h18"></path>
                                                <path d="M9 21V9"></path>
                                            </svg>
                                        </div>
                                        <div className="benefit-content">
                                            <h4>Skeleton Loading</h4>
                                            <p>Instead of blank screens, you see <strong>animated placeholder shapes</strong> that pulse while content loads. The layout never jumps around.</p>
                                        </div>
                                    </div>

                                    <div className="benefit-item">
                                        <div className="benefit-icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                <rect width="18" height="18" x="3" y="3" rx="2"></rect>
                                                <path d="M9 3v18"></path>
                                                <path d="m16 15-3-3 3-3"></path>
                                            </svg>
                                        </div>
                                        <div className="benefit-content">
                                            <h4>Modals & Dropdowns</h4>
                                            <p>Pop-ups <strong>scale in from center</strong> with a backdrop blur. Dropdowns <strong>slide down with spring physics</strong>. Closing them reverses the animation smoothly.</p>
                                        </div>
                                    </div>

                                    <div className="benefit-item">
                                        <div className="benefit-icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M12 20h9"></path>
                                                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                                            </svg>
                                        </div>
                                        <div className="benefit-content">
                                            <h4>Staggered Lists</h4>
                                            <p>Course cards, notifications, and sidebar items <strong>cascade in one by one</strong> with a slight delay — like a deck of cards being dealt.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Tech Stack Note */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    marginTop: '8px',
                                    padding: '10px 14px',
                                    borderRadius: '10px',
                                    background: '#f8fafc',
                                    border: '1px solid #e2e8f0',
                                }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                                        <circle cx="12" cy="12" r="10" />
                                        <path d="M12 16v-4M12 8h.01" />
                                    </svg>
                                    <span style={{ fontSize: '13px', color: '#475569', lineHeight: 1.4 }}>
                                        Powered by <strong>Framer Motion</strong> for React — the same engine behind Linear, Vercel, and Stripe's interfaces.
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Bugs Feature — Redesigned v2 */}
                        <div className={`feature-detail ${activeFeature === 'bugs' ? 'active' : ''}`} data-feature="bugs">
                            <div className="feature-description">
                                <span className="feature-category" style={{ color: isDarkMode ? '#60a5fa' : '#1e40af' }}>Bugs & Issues Fixed</span>
                                <h3 style={{ color: isDarkMode ? '#f1f5f9' : '#1e293b' }}>50+ Problems Squashed</h3>
                                <p className="feature-intro" style={{ color: isDarkMode ? '#cbd5e1' : '#6B7280' }}>
                                    The old STI eLMS had dozens of frustrating bugs — slow loads, broken links, lost submissions, and confusing errors. We tracked down <strong>every single one</strong> and fixed them. Here's a detailed look at what was broken and how we fixed it.
                                </p>

                                {/* Stats Summary Bar */}
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                                    {[
                                        { num: '50+', label: 'Bugs Fixed', color: '#ef4444', bg: isDarkMode ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2' },
                                        { num: '3×', label: 'Faster Load', color: '#3b82f6', bg: isDarkMode ? 'rgba(59, 130, 246, 0.15)' : '#eff6ff' },
                                        { num: '0', label: 'Crashes Now', color: '#22c55e', bg: isDarkMode ? 'rgba(34, 197, 94, 0.15)' : '#f0fdf4' },
                                        { num: '99.9%', label: 'Uptime', color: '#8b5cf6', bg: isDarkMode ? 'rgba(139, 92, 246, 0.15)' : '#faf5ff' },
                                    ].map((stat, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, y: 12 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.08, duration: 0.35 }}
                                            style={{
                                                flex: '1 1 0',
                                                minWidth: '70px',
                                                padding: '10px 8px',
                                                borderRadius: '10px',
                                                background: stat.bg,
                                                border: `1px solid ${stat.color}${isDarkMode ? '44' : '22'}`,
                                                textAlign: 'center',
                                            }}
                                        >
                                            <div style={{ fontSize: '22px', fontWeight: 800, color: stat.color, lineHeight: 1 }}>{stat.num}</div>
                                            <div style={{ fontSize: '11px', fontWeight: 600, color: isDarkMode ? '#a1a1aa' : '#94a3b8', marginTop: '3px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{stat.label}</div>
                                        </motion.div>
                                    ))}
                                </div>

                                {/* Bug Fix Categories */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                                    {/* Category 1: Speed & Performance */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 16 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1, duration: 0.4 }}
                                        style={{
                                            borderRadius: '12px',
                                            border: `1px solid ${isDarkMode ? 'rgba(239, 68, 68, 0.25)' : '#fecaca'}`,
                                            overflow: 'hidden',
                                            background: isDarkMode ? '#1e293b' : 'white',
                                            borderLeft: '3px solid #ef4444'
                                        }}
                                    >
                                        <div style={{ padding: '12px 14px', background: isDarkMode ? 'rgba(239, 68, 68, 0.12)' : '#fef2f2', borderBottom: `1px solid ${isDarkMode ? 'rgba(239, 68, 68, 0.25)' : '#fecaca'}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                                            </svg>
                                            <span style={{ fontSize: '16px', fontWeight: 700, color: isDarkMode ? '#f1f5f9' : '#0f172a', flex: 1 }}>Speed & Performance</span>
                                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#ef4444', background: isDarkMode ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2', padding: '2px 8px', borderRadius: '6px' }}>5 fixes</span>
                                        </div>
                                        <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            {[
                                                { old: 'Pages took 8-12 seconds to fully load. Students had to refresh 2-3 times, often thinking the site was down. Some gave up and used their phone instead.', fixed: 'Pages now load in under 2 seconds. We use React lazy-loading, code splitting, and skeleton placeholders so content appears instantly while data fetches in the background.' },
                                                { old: 'The course viewer had a memory leak — every time you opened a lesson, it kept old data in memory. After 20-30 minutes of browsing, the browser would slow to a crawl and eventually crash.', fixed: 'All components properly clean up after themselves. Memory usage stays constant no matter how long you browse. We tested 4+ hour sessions with zero degradation.' },
                                                { old: 'Every click triggered a full page reload from the server. This meant losing your scroll position, form inputs, and any unsaved notes. It also consumed unnecessary bandwidth.', fixed: 'React Router handles all navigation client-side. Pages swap instantly with smooth animations. Your scroll position, form data, and state are all preserved between views.' },
                                                { old: 'The dashboard rendered all 9 course cards at once with full-resolution images, causing visible lag and frame drops — especially on older laptops and budget phones.', fixed: 'Course cards use intersection-based lazy loading. Only visible cards render images. We also stagger mount animations across 30ms intervals so nothing blocks the main thread.' },
                                                { old: 'Database queries were unoptimized — fetching your grades pulled every student\'s grades then filtered client-side. This caused 3-5 second delays on every grade check.', fixed: 'All queries are server-side filtered and indexed. Grade lookups now take under 50ms. We also cache frequently-accessed data locally so repeat visits are instant.' },
                                            ].map((item, i) => (
                                                <motion.div
                                                    key={i}
                                                    initial={{ opacity: 0, x: -8 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 0.15 + i * 0.06, duration: 0.3 }}
                                                    style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0, marginTop: '2px' }}>
                                                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                                        </svg>
                                                        <span style={{ fontSize: '14px', color: isDarkMode ? '#8c9cb6' : '#94a3b8', lineHeight: 1.45, textDecoration: 'line-through', textDecorationColor: isDarkMode ? '#ef4444aa' : '#fca5a5' }}>{item.old}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0, marginTop: '2px' }}>
                                                            <polyline points="20 6 9 17 4 12" />
                                                        </svg>
                                                        <span style={{ fontSize: '14px', color: isDarkMode ? '#f1f5f9' : '#0f172a', fontWeight: 500, lineHeight: 1.45 }}>{item.fixed}</span>
                                                    </div>
                                                    {i < 4 && <div style={{ height: '1px', background: isDarkMode ? '#334155' : '#f1f5f9', marginTop: '2px' }} />}
                                                </motion.div>
                                            ))}
                                        </div>
                                    </motion.div>

                                    {/* Category 2: Navigation & Interface */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 16 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2, duration: 0.4 }}
                                        style={{
                                            borderRadius: '12px',
                                            border: `1px solid ${isDarkMode ? 'rgba(245, 158, 11, 0.25)' : '#fde68a'}`,
                                            overflow: 'hidden',
                                            background: isDarkMode ? '#1e293b' : 'white',
                                            borderLeft: '3px solid #f59e0b'
                                        }}
                                    >
                                        <div style={{ padding: '12px 14px', background: isDarkMode ? 'rgba(245, 158, 11, 0.12)' : '#fffbeb', borderBottom: `1px solid ${isDarkMode ? 'rgba(245, 158, 11, 0.25)' : '#fde68a'}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18" />
                                            </svg>
                                            <span style={{ fontSize: '16px', fontWeight: 700, color: isDarkMode ? '#f1f5f9' : '#0f172a', flex: 1 }}>Navigation & Interface</span>
                                            <span style={{ fontSize: '12px', fontWeight: 700, color: isDarkMode ? '#fbbf24' : '#d97706', background: isDarkMode ? 'rgba(245, 158, 11, 0.2)' : '#fef3c7', padding: '2px 8px', borderRadius: '6px' }}>5 fixes</span>
                                        </div>
                                        <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            {[
                                                { old: 'Sidebar links were broken — clicking "My Courses" randomly redirected to a 404 error page. Students had to manually type the URL in the address bar to get where they wanted.', fixed: 'Every navigation link is properly mapped and tested. We use React Router with fallback routes — if a page doesn\'t exist, you get a helpful "Page Not Found" screen with a link back home.' },
                                                { old: 'Modal dialogs opened behind other elements on the page, making them completely invisible. The only way to escape was to reload the entire page, losing any unsaved work.', fixed: 'All modals use a proper portal system that renders above everything. They include a backdrop overlay, close on Escape key or outside click, and trap focus for accessibility.' },
                                                { old: 'The sidebar didn\'t collapse properly on mobile devices. It would overlap the main content area and block all interaction. You couldn\'t scroll, tap, or click anything underneath it.', fixed: 'The sidebar slides away with a smooth animation on mobile. A hamburger menu icon appears in the header. Tapping the backdrop closes it. Content is never blocked or inaccessible.' },
                                                { old: 'Dropdown menus opened when clicked but never closed. Clicking elsewhere on the page had absolutely no effect. You had to reload the page to dismiss a stuck dropdown.', fixed: 'All dropdowns use a "click outside to close" handler. They also close when you press Escape, select an option, or navigate to another page. Focus management is handled correctly.' },
                                                { old: 'The tab navigation bar (Home, Courses, Tools, etc.) didn\'t highlight the active tab. Students never knew which section they were currently viewing, making the interface feel confusing.', fixed: 'Active tabs now show a clear blue highlight with a smooth underline animation. Tab switches are animated with a sliding transition so you always know exactly where you are.' },
                                            ].map((item, i) => (
                                                <motion.div
                                                    key={i}
                                                    initial={{ opacity: 0, x: -8 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 0.15 + i * 0.06, duration: 0.3 }}
                                                    style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0, marginTop: '2px' }}>
                                                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                                        </svg>
                                                        <span style={{ fontSize: '14px', color: isDarkMode ? '#8c9cb6' : '#94a3b8', lineHeight: 1.45, textDecoration: 'line-through', textDecorationColor: isDarkMode ? '#ef4444aa' : '#fca5a5' }}>{item.old}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0, marginTop: '2px' }}>
                                                            <polyline points="20 6 9 17 4 12" />
                                                        </svg>
                                                        <span style={{ fontSize: '14px', color: isDarkMode ? '#f1f5f9' : '#0f172a', fontWeight: 500, lineHeight: 1.45 }}>{item.fixed}</span>
                                                    </div>
                                                    {i < 4 && <div style={{ height: '1px', background: isDarkMode ? '#334155' : '#f1f5f9', marginTop: '2px' }} />}
                                                </motion.div>
                                            ))}
                                        </div>
                                    </motion.div>

                                    {/* Category 3: Assignments & Submissions */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 16 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3, duration: 0.4 }}
                                        style={{
                                            borderRadius: '12px',
                                            border: `1px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.25)' : '#bfdbfe'}`,
                                            overflow: 'hidden',
                                            background: isDarkMode ? '#1e293b' : 'white',
                                            borderLeft: '3px solid #3b82f6'
                                        }}
                                    >
                                        <div style={{ padding: '12px 14px', background: isDarkMode ? 'rgba(59, 130, 246, 0.12)' : '#eff6ff', borderBottom: `1px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.25)' : '#bfdbfe'}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                                            </svg>
                                            <span style={{ fontSize: '16px', fontWeight: 700, color: isDarkMode ? '#f1f5f9' : '#0f172a', flex: 1 }}>Assignments & Submissions</span>
                                            <span style={{ fontSize: '12px', fontWeight: 700, color: isDarkMode ? '#60a5fa' : '#2563eb', background: isDarkMode ? 'rgba(59, 130, 246, 0.2)' : '#dbeafe', padding: '2px 8px', borderRadius: '6px' }}>5 fixes</span>
                                        </div>
                                        <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            {[
                                                { old: 'File uploads would silently fail with no error message. You\'d click "Submit", the button would grey out, and nothing happened. Your teacher never received the file but you had no way of knowing.', fixed: 'Uploads now show a real-time progress bar with percentage. If the connection drops or file is too large, you get a specific error message telling you exactly what went wrong and how to fix it.' },
                                                { old: 'The submission page showed "Success! Your assignment has been submitted" even when the server actually rejected it due to timeout or file corruption. Students only found out they didn\'t submit when grades came out as zero.', fixed: 'We now verify server-side that the file was received and stored correctly before showing confirmation. You also receive a submission receipt with a timestamp, file size, and a unique reference number.' },
                                                { old: 'Grade calculations were completely wrong. An 85% score would display as 8.5%, or sometimes just "NaN" (not a number). The grade formula didn\'t account for weighted categories correctly.', fixed: 'Grade calculations are now mathematically verified. Percentages, letter grades (A/B/C/D/F), and 4.0 GPA equivalents all display correctly. Weighted and unweighted averages are both supported.' },
                                                { old: 'Deadlines showed the wrong time because of timezone bugs. A deadline set to "11:59 PM" by your teacher might close at 3:59 PM or 7:59 AM on your screen, causing students to miss submissions they thought were on time.', fixed: 'All deadlines use Philippine Standard Time (PST/UTC+8) consistently everywhere — in the calendar, course view, notifications, and countdown timers. What you see is exactly when it closes.' },
                                                { old: 'Resubmitting an assignment (when allowed by the teacher) would sometimes delete the original submission instead of replacing it. Students lost their first attempt with no way to recover it.', fixed: 'Resubmissions are handled safely — the old file is archived (not deleted) before the new one replaces it. Teachers can see submission history, and students can verify their latest upload at any time.' },
                                            ].map((item, i) => (
                                                <motion.div
                                                    key={i}
                                                    initial={{ opacity: 0, x: -8 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 0.15 + i * 0.06, duration: 0.3 }}
                                                    style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0, marginTop: '2px' }}>
                                                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                                        </svg>
                                                        <span style={{ fontSize: '14px', color: isDarkMode ? '#8c9cb6' : '#94a3b8', lineHeight: 1.45, textDecoration: 'line-through', textDecorationColor: isDarkMode ? '#ef4444aa' : '#fca5a5' }}>{item.old}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0, marginTop: '2px' }}>
                                                            <polyline points="20 6 9 17 4 12" />
                                                        </svg>
                                                        <span style={{ fontSize: '14px', color: isDarkMode ? '#f1f5f9' : '#0f172a', fontWeight: 500, lineHeight: 1.45 }}>{item.fixed}</span>
                                                    </div>
                                                    {i < 4 && <div style={{ height: '1px', background: isDarkMode ? '#334155' : '#f1f5f9', marginTop: '2px' }} />}
                                                </motion.div>
                                            ))}
                                        </div>
                                    </motion.div>

                                    {/* Category 4: Display & Visual Glitches */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 16 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.4, duration: 0.4 }}
                                        style={{
                                            borderRadius: '12px',
                                            border: `1px solid ${isDarkMode ? 'rgba(139, 92, 246, 0.25)' : '#e9d5ff'}`,
                                            overflow: 'hidden',
                                            background: isDarkMode ? '#1e293b' : 'white',
                                            borderLeft: '3px solid #8b5cf6'
                                        }}
                                    >
                                        <div style={{ padding: '12px 14px', background: isDarkMode ? 'rgba(139, 92, 246, 0.12)' : '#faf5ff', borderBottom: `1px solid ${isDarkMode ? 'rgba(139, 92, 246, 0.25)' : '#e9d5ff'}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
                                            </svg>
                                            <span style={{ fontSize: '16px', fontWeight: 700, color: isDarkMode ? '#f1f5f9' : '#0f172a', flex: 1 }}>Display & Visual Glitches</span>
                                            <span style={{ fontSize: '12px', fontWeight: 700, color: isDarkMode ? '#c084fc' : '#7c3aed', background: isDarkMode ? 'rgba(139, 92, 246, 0.2)' : '#ede9fe', padding: '2px 8px', borderRadius: '6px' }}>5 fixes</span>
                                        </div>
                                        <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            {[
                                                { old: 'Long course titles like "Computer Programming 1 - SY2526-1T" would overflow out of their cards and overlap neighboring elements. The layout broke on any screen narrower than 1200px.', fixed: 'All text is properly truncated with "..." when it exceeds the container width. Hover tooltips reveal the full title. Layouts are tested from 320px (mobile) to 4K screens.' },
                                                { old: 'There was no dark mode at all. The pure white interface with bright blue accents caused eye strain and headaches during late-night study sessions, especially in dimly lit rooms.', fixed: 'Full dark mode is built in. Every color, shadow, and border is carefully tuned for each theme. You can toggle themes from the settings menu or profile dropdown.' },
                                                { old: 'Images loaded at full resolution (2-5MB each) even on mobile data. This consumed bandwidth, caused scroll jank, and made pages feel heavy. Some images didn\'t even load at all.', fixed: 'Images are compressed, resized for device, and lazy-loaded using intersection observers. They fade in with a smooth animation as you scroll. Broken images show a clean fallback placeholder.' },
                                                { old: 'Notification badges showed incorrect counts. You\'d see "3 new notifications" but clicking showed zero. Or you\'d clear all notifications but the badge number wouldn\'t reset until you refreshed the page.', fixed: 'Notification counts sync in real-time with the server. Clearing notifications immediately updates the badge. Read/unread states persist correctly across sessions and devices.' },
                                                { old: 'Form inputs lost focus randomly while typing. You\'d be writing a message or search query, and the cursor would jump away, forcing you to click back into the field every few seconds.', fixed: 'All form components use stable React keys and controlled inputs. Focus is never stolen by re-renders. We also added focus ring outlines for keyboard navigation accessibility.' },
                                            ].map((item, i) => (
                                                <motion.div
                                                    key={i}
                                                    initial={{ opacity: 0, x: -8 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 0.15 + i * 0.06, duration: 0.3 }}
                                                    style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0, marginTop: '2px' }}>
                                                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                                        </svg>
                                                        <span style={{ fontSize: '14px', color: isDarkMode ? '#8c9cb6' : '#94a3b8', lineHeight: 1.45, textDecoration: 'line-through', textDecorationColor: isDarkMode ? '#ef4444aa' : '#fca5a5' }}>{item.old}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0, marginTop: '2px' }}>
                                                            <polyline points="20 6 9 17 4 12" />
                                                        </svg>
                                                        <span style={{ fontSize: '14px', color: isDarkMode ? '#f1f5f9' : '#0f172a', fontWeight: 500, lineHeight: 1.45 }}>{item.fixed}</span>
                                                    </div>
                                                    {i < 4 && <div style={{ height: '1px', background: isDarkMode ? '#334155' : '#f1f5f9', marginTop: '2px' }} />}
                                                </motion.div>
                                            ))}
                                        </div>
                                    </motion.div>

                                    {/* Category 5: Data & Account Issues */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 16 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.5, duration: 0.4 }}
                                        style={{
                                            borderRadius: '12px',
                                            border: `1px solid ${isDarkMode ? 'rgba(34, 197, 94, 0.25)' : '#bbf7d0'}`,
                                            overflow: 'hidden',
                                            background: isDarkMode ? '#1e293b' : 'white',
                                            borderLeft: '3px solid #22c55e'
                                        }}
                                    >
                                        <div style={{ padding: '12px 14px', background: isDarkMode ? 'rgba(34, 197, 94, 0.12)' : '#f0fdf4', borderBottom: `1px solid ${isDarkMode ? 'rgba(34, 197, 94, 0.25)' : '#bbf7d0'}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                            </svg>
                                            <span style={{ fontSize: '16px', fontWeight: 700, color: isDarkMode ? '#f1f5f9' : '#0f172a', flex: 1 }}>Data & Account Issues</span>
                                            <span style={{ fontSize: '12px', fontWeight: 700, color: isDarkMode ? '#4ade80' : '#16a34a', background: isDarkMode ? 'rgba(34, 197, 94, 0.2)' : '#dcfce7', padding: '2px 8px', borderRadius: '6px' }}>5 fixes</span>
                                        </div>
                                        <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            {[
                                                { old: 'Your profile settings (name, avatar, preferences) would randomly reset to defaults after logging in. You\'d customize everything, log out, and come back to find it all gone.', fixed: 'Profile data is persisted to the database immediately on save. Settings survive logouts, browser clears, and device switches. Changes sync across tabs in real-time.' },
                                                { old: 'Study time tracking was wildly inaccurate. It counted time even when the browser tab was in the background, inflating study hours. A 30-minute session might show as 4 hours.', fixed: 'Study time only counts when the tab is active and focused. We use the Page Visibility API to pause tracking when you switch tabs or minimize the browser. Times are rounded to the nearest minute.' },
                                                { old: 'Course progress would sometimes go backwards. You\'d complete Module 3, but opening Module 1 again would reset your progress to Module 1, erasing all your completion data.', fixed: 'Progress is stored per-module, not per-session. Revisiting earlier content never resets later progress. Your highest completion percentage is always preserved.' },
                                                { old: 'The "Remember Me" login feature didn\'t work. Students had to re-enter their student ID and password every single time they visited the site, even on their own personal devices.', fixed: 'Session tokens persist correctly across browser restarts. "Remember Me" keeps you logged in for 30 days. Expired sessions redirect to login with a clear message instead of showing a blank page.' },
                                                { old: 'Notification preferences couldn\'t be saved. You\'d turn off email notifications, but the setting would revert immediately. Students kept receiving unwanted emails about every minor platform update.', fixed: 'All notification preferences save instantly and persist correctly. You have granular control: toggle announcements, grade updates, deadlines, and system messages independently.' },
                                            ].map((item, i) => (
                                                <motion.div
                                                    key={i}
                                                    initial={{ opacity: 0, x: -8 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 0.15 + i * 0.06, duration: 0.3 }}
                                                    style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0, marginTop: '2px' }}>
                                                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                                        </svg>
                                                        <span style={{ fontSize: '14px', color: isDarkMode ? '#8c9cb6' : '#94a3b8', lineHeight: 1.45, textDecoration: 'line-through', textDecorationColor: isDarkMode ? '#ef4444aa' : '#fca5a5' }}>{item.old}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0, marginTop: '2px' }}>
                                                            <polyline points="20 6 9 17 4 12" />
                                                        </svg>
                                                        <span style={{ fontSize: '14px', color: isDarkMode ? '#f1f5f9' : '#0f172a', fontWeight: 500, lineHeight: 1.45 }}>{item.fixed}</span>
                                                    </div>
                                                    {i < 4 && <div style={{ height: '1px', background: isDarkMode ? '#334155' : '#f1f5f9', marginTop: '2px' }} />}
                                                </motion.div>
                                            ))}
                                        </div>
                                    </motion.div>

                                </div>

                                {/* Bottom Note */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    marginTop: '16px',
                                    padding: '10px 14px',
                                    borderRadius: '10px',
                                    background: isDarkMode ? 'rgba(34, 197, 94, 0.12)' : '#f0fdf4',
                                    border: `1px solid ${isDarkMode ? 'rgba(34, 197, 94, 0.25)' : '#bbf7d0'}`,
                                }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isDarkMode ? '#4ade80' : '#22c55e'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                                    </svg>
                                    <span style={{ fontSize: '13px', color: isDarkMode ? '#86efac' : '#15803d', lineHeight: 1.4 }}>
                                        Found a new bug? Report it through <strong>Settings &rarr; Help & Support</strong> and we'll fix it within 24 hours.
                                    </span>
                                </div>
                            </div>
                        </div>


                        {/* Other features with simpler descriptions */}
                        <div className={`feature-detail ${activeFeature === 'layouts' ? 'active' : ''}`} data-feature="layouts">
                            <div className="feature-description">
                                <span className="feature-category">Design System</span>
                                <h3>Modern, Intuitive, Responsive</h3>
                                <p className="feature-intro">Experience a complete visual transformation with our redesigned
                                    layout system. Every element has been carefully crafted to provide maximum clarity,
                                    efficiency, and aesthetic appeal across all devices.</p>

                                {/* Before & After Layout Comparison */}
                                <div className="layout-comparison-container">
                                    <div className="layout-comparison-item">
                                        <div className="layout-image-placeholder before-layout">
                                            <div className="placeholder-content">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"
                                                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                                                    strokeLinecap="round" strokeLinejoin="round">
                                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                                    <line x1="9" y="9" x2="15" y2="9"></line>
                                                    <line x1="9" y1="15" x2="15" y2="15"></line>
                                                </svg>
                                                <span>Before Layout</span>
                                            </div>
                                        </div>
                                        <div className="layout-description">
                                            <h4>Old STI eLMS Layout</h4>
                                            <p>The previous interface suffered from cluttered navigation, inconsistent
                                                spacing, and outdated visual hierarchy. Dense information blocks made it
                                                difficult to focus, while the rigid structure didn't adapt well to different
                                                screen sizes.</p>
                                        </div>
                                    </div>

                                    <div className="layout-comparison-item">
                                        <div className="layout-image-placeholder after-layout">
                                            <div className="placeholder-content">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"
                                                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                                                    strokeLinecap="round" strokeLinejoin="round">
                                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                                    <line x1="3" y1="9" x2="21" y2="9"></line>
                                                    <line x1="9" y1="21" x2="9" y2="9"></line>
                                                </svg>
                                                <span>After Layout</span>
                                            </div>
                                        </div>
                                        <div className="layout-description">
                                            <h4>New Modern Layout</h4>
                                            <p>Our redesigned interface features clean card-based layouts, generous white
                                                space, and intuitive navigation patterns. The flexible grid system
                                                seamlessly adapts to any screen size, while consistent visual language
                                                ensures effortless navigation throughout the platform.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Layout Features */}
                                <div className="layout-features">
                                    <h4 className="features-subtitle">Key Layout Improvements</h4>
                                    <div className="feature-benefits">
                                        <div className="benefit-item">
                                            <div className="benefit-icon">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                                                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                                                    strokeLinecap="round" strokeLinejoin="round">
                                                    <rect x="3" y="3" width="7" height="7"></rect>
                                                    <rect x="14" y="3" width="7" height="7"></rect>
                                                    <rect x="14" y="14" width="7" height="7"></rect>
                                                    <rect x="3" y="14" width="7" height="7"></rect>
                                                </svg>
                                            </div>
                                            <div className="benefit-content">
                                                <h4>Card-Based Design</h4>
                                                <p><strong>Modular content organization</strong> breaks information into
                                                    digestible, self-contained cards. Each card features <strong>clear
                                                        visual boundaries</strong>, consistent padding, and <strong>logical
                                                            grouping</strong> of related elements, making it easier to scan and
                                                    process information at a glance.</p>
                                            </div>
                                        </div>

                                        <div className="benefit-item">
                                            <div className="benefit-icon">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                                                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                                                    strokeLinecap="round" strokeLinejoin="round">
                                                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                                                    <line x1="8" y1="21" x2="16" y2="21"></line>
                                                    <line x1="12" y1="17" x2="12" y2="21"></line>
                                                </svg>
                                            </div>
                                            <div className="benefit-content">
                                                <h4>Responsive Grid System</h4>
                                                <p><strong>Flexible 12-column grid</strong> automatically adjusts to any
                                                    screen size, from <strong>mobile phones to ultra-wide displays</strong>.
                                                    Content reflows intelligently, maintaining readability and usability
                                                    across all devices without horizontal scrolling or awkward layouts.</p>
                                            </div>
                                        </div>

                                        <div className="benefit-item">
                                            <div className="benefit-icon">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                                                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                                                    strokeLinecap="round" strokeLinejoin="round">
                                                    <circle cx="12" cy="12" r="10"></circle>
                                                    <circle cx="12" cy="12" r="6"></circle>
                                                    <circle cx="12" cy="12" r="2"></circle>
                                                </svg>
                                            </div>
                                            <div className="benefit-content">
                                                <h4>Visual Hierarchy</h4>
                                                <p><strong>Strategic use of typography, color, and spacing</strong> guides
                                                    your eye naturally through content. <strong>Primary actions stand
                                                        out</strong>, secondary information recedes, and <strong>critical
                                                            elements demand attention</strong> through size, contrast, and
                                                    positioning.</p>
                                            </div>
                                        </div>

                                        <div className="benefit-item">
                                            <div className="benefit-icon">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                                                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                                                    strokeLinecap="round" strokeLinejoin="round">
                                                    <path
                                                        d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z">
                                                    </path>
                                                </svg>
                                            </div>
                                            <div className="benefit-content">
                                                <h4>Consistent Spacing</h4>
                                                <p><strong>8-point spacing system</strong> ensures uniform gaps between
                                                    elements throughout the platform. <strong>Predictable padding and
                                                        margins</strong> create visual rhythm, reduce cognitive load, and
                                                    establish a <strong>professional, polished appearance</strong> that
                                                    feels intentionally designed.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* More Settings Feature — Redesigned v2 */}
                        <div className={`feature-detail ${activeFeature === 'settings' ? 'active' : ''}`} data-feature="settings">
                            <div className="feature-description">
                                <span className="feature-category" style={{ color: isDarkMode ? '#60a5fa' : '#1e40af' }}>More Settings</span>
                                <h3 style={{ color: isDarkMode ? '#f1f5f9' : '#1e293b' }}>Your Platform, Your Rules</h3>
                                <p className="feature-intro" style={{ color: isDarkMode ? '#cbd5e1' : '#6B7280' }}>
                                    The new eLMS gives you <strong>full control</strong> over how the platform looks, sounds, and feels. Every setting is designed to make your experience more comfortable, more personal, and more efficient. Here's everything you can customize.
                                </p>

                                {/* Stats Summary */}
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                                    {[
                                        { num: '15+', label: 'Settings', color: '#3b82f6', bg: isDarkMode ? 'rgba(59, 130, 246, 0.15)' : '#eff6ff' },
                                        { num: '2', label: 'Themes', color: '#8b5cf6', bg: isDarkMode ? 'rgba(139, 92, 246, 0.15)' : '#faf5ff' },
                                        { num: '100%', label: 'Custom', color: '#22c55e', bg: isDarkMode ? 'rgba(34, 197, 94, 0.15)' : '#f0fdf4' },
                                        { num: '1-Click', label: 'Toggle', color: '#f59e0b', bg: isDarkMode ? 'rgba(245, 158, 11, 0.15)' : '#fffbeb' },
                                    ].map((stat, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, y: 12 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.08, duration: 0.35 }}
                                            style={{
                                                flex: '1 1 0',
                                                minWidth: '70px',
                                                padding: '10px 8px',
                                                borderRadius: '10px',
                                                background: stat.bg,
                                                border: `1px solid ${stat.color}${isDarkMode ? '44' : '22'}`,
                                                textAlign: 'center',
                                            }}
                                        >
                                            <div style={{ fontSize: '22px', fontWeight: 800, color: stat.color, lineHeight: 1 }}>{stat.num}</div>
                                            <div style={{ fontSize: '11px', fontWeight: 600, color: isDarkMode ? '#a1a1aa' : '#94a3b8', marginTop: '3px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{stat.label}</div>
                                        </motion.div>
                                    ))}
                                </div>

                                {/* Settings Categories */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                                    {/* Category 1: Sound Settings */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 16 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1, duration: 0.4 }}
                                        style={{ borderRadius: '12px', border: `1px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.25)' : '#bfdbfe'}`, overflow: 'hidden', background: isDarkMode ? '#1e293b' : 'white', borderLeft: '3px solid #3b82f6' }}
                                    >
                                        <div style={{ padding: '12px 14px', background: isDarkMode ? 'rgba(59, 130, 246, 0.12)' : '#eff6ff', borderBottom: `1px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.25)' : '#bfdbfe'}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
                                            </svg>
                                            <span style={{ fontSize: '16px', fontWeight: 700, color: isDarkMode ? '#f1f5f9' : '#0f172a', flex: 1 }}>Sound & Audio</span>
                                            <span style={{ fontSize: '12px', fontWeight: 700, color: isDarkMode ? '#60a5fa' : '#2563eb', background: isDarkMode ? 'rgba(59, 130, 246, 0.2)' : '#dbeafe', padding: '2px 8px', borderRadius: '6px' }}>4 options</span>
                                        </div>
                                        <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            {[
                                                { title: 'Master Sound Toggle', desc: 'Turn all sounds on or off with a single switch. When you flip it off, every audio effect in the entire platform goes silent instantly. Flip it back on and everything returns to your saved settings.' },
                                                { title: 'Notification Sounds', desc: 'Choose whether you hear a chime when new announcements, grade updates, or messages arrive. You can keep this on even if you mute other sounds, so you never miss important alerts from your teachers.' },
                                                { title: 'Button Click Effects', desc: 'Small audio feedback when you tap buttons, toggle switches, or interact with menus. It makes the platform feel more responsive. Some students love it, some prefer silence. Your choice.' },
                                                { title: 'Volume Control', desc: 'Individual volume sliders for each sound type. Want loud notifications but quiet click effects? Set each one separately. Your levels are saved to your account so they work on any device you log into.' },
                                            ].map((item, i, arr) => (
                                                <React.Fragment key={i}>
                                                    <motion.div
                                                        key={i}
                                                        initial={{ opacity: 0, x: -8 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: 0.15 + i * 0.06, duration: 0.3 }}
                                                        style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}
                                                    >
                                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3b82f6', flexShrink: 0, marginTop: '6px' }} />
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontSize: '14px', fontWeight: 600, color: isDarkMode ? '#f1f5f9' : '#0f172a', marginBottom: '2px' }}>{item.title}</div>
                                                            <div style={{ fontSize: '13.5px', color: isDarkMode ? '#cbd5e1' : '#64748b', lineHeight: 1.5 }}>{item.desc}</div>
                                                        </div>
                                                    </motion.div>
                                                    {i < arr.length - 1 && <div style={{ height: '1px', background: isDarkMode ? '#334155' : '#f1f5f9', marginTop: '6px', marginBottom: '6px', marginLeft: '16px' }} />}
                                                </React.Fragment>
                                            ))}

                                        </div>
                                    </motion.div>

                                    {/* Category 2: Eye Protection */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 16 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2, duration: 0.4 }}
                                        style={{ borderRadius: '12px', border: `1px solid ${isDarkMode ? 'rgba(245, 158, 11, 0.25)' : '#fde68a'}`, overflow: 'hidden', background: isDarkMode ? '#1e293b' : 'white', borderLeft: '3px solid #f59e0b' }}
                                    >
                                        <div style={{ padding: '12px 14px', background: isDarkMode ? 'rgba(245, 158, 11, 0.12)' : '#fffbeb', borderBottom: `1px solid ${isDarkMode ? 'rgba(245, 158, 11, 0.25)' : '#fde68a'}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" />
                                            </svg>
                                            <span style={{ fontSize: '16px', fontWeight: 700, color: isDarkMode ? '#f1f5f9' : '#0f172a', flex: 1 }}>Eye Protection</span>
                                            <span style={{ fontSize: '12px', fontWeight: 700, color: isDarkMode ? '#fbbf24' : '#d97706', background: isDarkMode ? 'rgba(245, 158, 11, 0.2)' : '#fef3c7', padding: '2px 8px', borderRadius: '6px' }}>3 levels</span>
                                        </div>
                                        <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            {[
                                                { title: 'Blue Light Filter', desc: 'Adds a warm tint to your screen that blocks the blue light that causes eye fatigue. Think of it like wearing reading glasses but built into the website. Great for when you study at night or in a dark room.' },
                                                { title: 'Brightness Control', desc: 'Separate from your device brightness, this dims just the eLMS content. If your classroom is dark or you are studying late, lower it without changing your phone or laptop screen brightness.' },
                                                { title: 'Adjustable Intensity', desc: 'Three levels: Light (barely noticeable, subtle warmth), Medium (comfortable amber tone), and Strong (deep warm filter for pitch-dark rooms). Pick what feels right for your eyes.' },
                                                { title: 'Auto Night Mode', desc: 'Set it once and forget it. The eye protection turns on automatically after sunset and turns off at sunrise based on Philippine time. No need to toggle it manually every night.' },
                                            ].map((item, i, arr) => (
                                                <React.Fragment key={i}>
                                                    <motion.div
                                                        key={i}
                                                        initial={{ opacity: 0, x: -8 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: 0.15 + i * 0.06, duration: 0.3 }}
                                                        style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}
                                                    >
                                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b', flexShrink: 0, marginTop: '6px' }} />
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontSize: '14px', fontWeight: 600, color: isDarkMode ? '#f1f5f9' : '#0f172a', marginBottom: '2px' }}>{item.title}</div>
                                                            <div style={{ fontSize: '13.5px', color: isDarkMode ? '#cbd5e1' : '#64748b', lineHeight: 1.5 }}>{item.desc}</div>
                                                        </div>
                                                    </motion.div>
                                                    {i < arr.length - 1 && <div style={{ height: '1px', background: isDarkMode ? '#334155' : '#f1f5f9', marginTop: '6px', marginBottom: '6px', marginLeft: '16px' }} />}
                                                </React.Fragment>
                                            ))}
                                            {/* Live Demo: Warm Filter */}
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: 0.5 }}
                                                style={{ marginTop: '6px', padding: '12px', borderRadius: '10px', background: isDarkMode ? '#0f172a' : '#f8fafc', border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`, overflow: 'hidden', position: 'relative' }}
                                            >
                                                <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Live Preview</div>
                                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                                    {['Light', 'Medium', 'Strong'].map((level, i) => (
                                                        <motion.div
                                                            key={i}
                                                            animate={{ opacity: [0.5, 1, 0.5] }}
                                                            transition={{ duration: 3, repeat: Infinity, delay: i * 1 }}
                                                            style={{
                                                                flex: 1,
                                                                padding: '8px',
                                                                borderRadius: '8px',
                                                                background: isDarkMode
                                                                    ? ['rgba(251, 191, 36, 0.1)', 'rgba(251, 191, 36, 0.2)', 'rgba(251, 191, 36, 0.35)'][i]
                                                                    : ['rgba(251, 191, 36, 0.08)', 'rgba(251, 191, 36, 0.18)', 'rgba(251, 191, 36, 0.32)'][i],
                                                                border: `1px solid ${isDarkMode
                                                                    ? ['rgba(251, 191, 36, 0.3)', 'rgba(251, 191, 36, 0.5)', 'rgba(251, 191, 36, 0.7)'][i]
                                                                    : ['#fde68a', '#fcd34d', '#f59e0b'][i]}`,
                                                                textAlign: 'center' as const,
                                                                fontSize: '11px',
                                                                fontWeight: 600,
                                                                color: isDarkMode
                                                                    ? ['#fcd34d', '#fbbf24', '#f59e0b'][i]
                                                                    : ['#d97706', '#b45309', '#92400e'][i],
                                                            }}
                                                        >{level}</motion.div>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        </div>
                                    </motion.div>

                                    {/* Category 3: Theme & Appearance */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 16 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3, duration: 0.4 }}
                                        style={{ borderRadius: '12px', border: `1px solid ${isDarkMode ? 'rgba(139, 92, 246, 0.25)' : '#e9d5ff'}`, overflow: 'hidden', background: isDarkMode ? '#1e293b' : 'white', borderLeft: '3px solid #8b5cf6' }}
                                    >
                                        <div style={{ padding: '12px 14px', background: isDarkMode ? 'rgba(139, 92, 246, 0.12)' : '#faf5ff', borderBottom: `1px solid ${isDarkMode ? 'rgba(139, 92, 246, 0.25)' : '#e9d5ff'}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                                            </svg>
                                            <span style={{ fontSize: '16px', fontWeight: 700, color: isDarkMode ? '#f1f5f9' : '#0f172a', flex: 1 }}>Theme & Appearance</span>
                                            <span style={{ fontSize: '12px', fontWeight: 700, color: isDarkMode ? '#a78bfa' : '#7c3aed', background: isDarkMode ? 'rgba(139, 92, 246, 0.2)' : '#ede9fe', padding: '2px 8px', borderRadius: '6px' }}>2 themes</span>
                                        </div>
                                        <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            {[
                                                { title: 'Light Mode (Default)', desc: 'Clean white backgrounds with subtle gray accents. Everything is bright and clear. Best for daytime use or well-lit rooms. This is what loads when you first sign in.' },
                                                { title: 'Dark Mode', desc: 'Deep dark backgrounds with soft white text. Every color, shadow, and border has been hand-tuned for dark mode so nothing looks washed out. Saves battery on OLED screens and is easier on the eyes at night.' },
                                                { title: 'Quick Theme Toggle', desc: 'Switch themes from anywhere on the platform using the theme button in your profile dropdown or the settings page. The switch is instant with a smooth color transition. No page reload needed.' },
                                                { title: 'Remembers Your Choice', desc: 'Once you pick a theme, it stays. It saves to your account, not just your browser. Log in from a different phone, laptop, or school computer and your theme is already there waiting.' },
                                            ].map((item, i, arr) => (
                                                <React.Fragment key={i}>
                                                    <motion.div
                                                        key={i}
                                                        initial={{ opacity: 0, x: -8 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: 0.15 + i * 0.06, duration: 0.3 }}
                                                        style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}
                                                    >
                                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#8b5cf6', flexShrink: 0, marginTop: '6px' }} />
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontSize: '14px', fontWeight: 600, color: isDarkMode ? '#f1f5f9' : '#0f172a', marginBottom: '2px' }}>{item.title}</div>
                                                            <div style={{ fontSize: '13.5px', color: isDarkMode ? '#cbd5e1' : '#64748b', lineHeight: 1.5 }}>{item.desc}</div>
                                                        </div>
                                                    </motion.div>
                                                    {i < arr.length - 1 && <div style={{ height: '1px', background: isDarkMode ? '#334155' : '#f1f5f9', marginTop: '6px', marginBottom: '6px', marginLeft: '16px' }} />}
                                                </React.Fragment>
                                            ))}
                                            {/* Live Demo: Theme Swatches */}
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: 0.5 }}
                                                style={{ marginTop: '6px', padding: '12px', borderRadius: '10px', background: isDarkMode ? '#0f172a' : '#f8fafc', border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}` }}
                                            >
                                                <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Live Preview</div>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    {[
                                                        { name: 'Light', bg: '#ffffff', border: '#e2e8f0', text: '#0f172a' },
                                                        { name: 'Dark', bg: '#0f172a', border: '#334155', text: '#f1f5f9' },
                                                    ].map((theme, i) => (
                                                        <motion.div
                                                            key={i}
                                                            whileHover={{ scale: 1.05, y: -2 }}
                                                            transition={{ type: 'spring', stiffness: 400 }}
                                                            style={{
                                                                flex: 1,
                                                                padding: '10px 8px',
                                                                borderRadius: '8px',
                                                                background: theme.bg,
                                                                border: `2px solid ${theme.border}`,
                                                                textAlign: 'center' as const,
                                                                cursor: 'pointer',
                                                            }}
                                                        >
                                                            <div style={{ fontSize: '11px', fontWeight: 700, color: theme.text }}>{theme.name}</div>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        </div>
                                    </motion.div>

                                    {/* Category 4: Notification Preferences */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 16 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.4, duration: 0.4 }}
                                        style={{ borderRadius: '12px', border: `1px solid ${isDarkMode ? 'rgba(239, 68, 68, 0.25)' : '#fecaca'}`, overflow: 'hidden', background: isDarkMode ? '#1e293b' : 'white', borderLeft: '3px solid #ef4444' }}
                                    >
                                        <div style={{ padding: '12px 14px', background: isDarkMode ? 'rgba(239, 68, 68, 0.12)' : '#fef2f2', borderBottom: `1px solid ${isDarkMode ? 'rgba(239, 68, 68, 0.25)' : '#fecaca'}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
                                            </svg>
                                            <span style={{ fontSize: '16px', fontWeight: 700, color: isDarkMode ? '#f1f5f9' : '#0f172a', flex: 1 }}>Notification Controls</span>
                                            <span style={{ fontSize: '12px', fontWeight: 700, color: isDarkMode ? '#f87171' : '#ef4444', background: isDarkMode ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2', padding: '2px 8px', borderRadius: '6px' }}>5 types</span>
                                        </div>
                                        <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            {[
                                                { title: 'Announcement Alerts', desc: 'Get notified when your teacher posts a new announcement in any of your courses. Shows a badge on the bell icon and an optional sound. You can mute specific courses if you want.' },
                                                { title: 'Grade Updates', desc: 'Know the moment your grades are posted. A notification pops up with the course name, assignment title, and your score. No more checking your grades page every hour.' },
                                                { title: 'Deadline Reminders', desc: 'Automatic reminders 24 hours and 1 hour before assignment deadlines. Never miss a submission again. These reminders show the exact time left and a direct link to submit.' },
                                                { title: 'Message Notifications', desc: 'Alerts for new messages from classmates or instructors in the group chat or direct messages. You can mute individual conversations without turning off all message alerts.' },
                                                { title: 'System Updates', desc: 'Occasional notifications about new features, maintenance schedules, or important platform changes. These are rare and only sent when something actually matters to your experience.' },
                                            ].map((item, i, arr) => (
                                                <React.Fragment key={i}>
                                                    <motion.div
                                                        key={i}
                                                        initial={{ opacity: 0, x: -8 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: 0.15 + i * 0.06, duration: 0.3 }}
                                                        style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}
                                                    >
                                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444', flexShrink: 0, marginTop: '6px' }} />
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontSize: '14px', fontWeight: 600, color: isDarkMode ? '#f1f5f9' : '#0f172a', marginBottom: '2px' }}>{item.title}</div>
                                                            <div style={{ fontSize: '13.5px', color: isDarkMode ? '#cbd5e1' : '#64748b', lineHeight: 1.5 }}>{item.desc}</div>
                                                        </div>
                                                    </motion.div>
                                                    {i < arr.length - 1 && <div style={{ height: '1px', background: isDarkMode ? '#334155' : '#f1f5f9', marginTop: '6px', marginBottom: '6px', marginLeft: '16px' }} />}
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    </motion.div>

                                    {/* Category 5: Accessibility */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 16 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.5, duration: 0.4 }}
                                        style={{ borderRadius: '12px', border: `1px solid ${isDarkMode ? 'rgba(34, 197, 94, 0.25)' : '#bbf7d0'}`, overflow: 'hidden', background: isDarkMode ? '#1e293b' : 'white', borderLeft: '3px solid #22c55e' }}
                                    >
                                        <div style={{ padding: '12px 14px', background: isDarkMode ? 'rgba(34, 197, 94, 0.12)' : '#f0fdf4', borderBottom: `1px solid ${isDarkMode ? 'rgba(34, 197, 94, 0.25)' : '#bbf7d0'}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" />
                                            </svg>
                                            <span style={{ fontSize: '16px', fontWeight: 700, color: isDarkMode ? '#f1f5f9' : '#0f172a', flex: 1 }}>Accessibility</span>
                                            <span style={{ fontSize: '12px', fontWeight: 700, color: isDarkMode ? '#4ade80' : '#16a34a', background: isDarkMode ? 'rgba(34, 197, 94, 0.2)' : '#dcfce7', padding: '2px 8px', borderRadius: '6px' }}>inclusive</span>
                                        </div>
                                        <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            {[
                                                { title: 'Keyboard Navigation', desc: 'Use Tab, Enter, Escape, and arrow keys to navigate the entire platform without a mouse. Every button, link, and input has a visible focus ring so you always know where you are.' },
                                                { title: 'Screen Reader Support', desc: 'All interactive elements have proper labels that screen readers can understand. Images have alt text, buttons describe their actions, and page sections are clearly structured.' },
                                                { title: 'Reduced Motion', desc: 'If animations make you dizzy or uncomfortable, turn on Reduced Motion. All transitions become instant and smooth without bouncing or sliding. The platform still looks great, just calmer.' },
                                                { title: 'High Contrast Text', desc: 'Increase the contrast between text and backgrounds for better readability. Useful for students with low vision or when studying outdoors with screen glare.' },
                                            ].map((item, i, arr) => (
                                                <React.Fragment key={i}>
                                                    <motion.div
                                                        key={i}
                                                        initial={{ opacity: 0, x: -8 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: 0.15 + i * 0.06, duration: 0.3 }}
                                                        style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}
                                                    >
                                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', flexShrink: 0, marginTop: '6px' }} />
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontSize: '14px', fontWeight: 600, color: isDarkMode ? '#f1f5f9' : '#0f172a', marginBottom: '2px' }}>{item.title}</div>
                                                            <div style={{ fontSize: '13.5px', color: isDarkMode ? '#cbd5e1' : '#64748b', lineHeight: 1.5 }}>{item.desc}</div>
                                                        </div>
                                                    </motion.div>
                                                    {i < arr.length - 1 && <div style={{ height: '1px', background: isDarkMode ? '#334155' : '#f1f5f9', marginTop: '6px', marginBottom: '6px', marginLeft: '16px' }} />}
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    </motion.div>

                                    {/* Category 6: Account & Privacy */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 16 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.6, duration: 0.4 }}
                                        style={{ borderRadius: '12px', border: `1px solid ${isDarkMode ? 'rgba(100, 116, 139, 0.25)' : '#e2e8f0'}`, overflow: 'hidden', background: isDarkMode ? '#1e293b' : 'white', borderLeft: '3px solid #64748b' }}
                                    >
                                        <div style={{ padding: '12px 14px', background: isDarkMode ? 'rgba(100, 116, 139, 0.12)' : '#f8fafc', borderBottom: `1px solid ${isDarkMode ? 'rgba(100, 116, 139, 0.25)' : '#e2e8f0'}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                            </svg>
                                            <span style={{ fontSize: '16px', fontWeight: 700, color: isDarkMode ? '#f1f5f9' : '#0f172a', flex: 1 }}>Account & Privacy</span>
                                            <span style={{ fontSize: '12px', fontWeight: 700, color: isDarkMode ? '#94a3b8' : '#475569', background: isDarkMode ? 'rgba(100, 116, 139, 0.2)' : '#e2e8f0', padding: '2px 8px', borderRadius: '6px' }}>secure</span>
                                        </div>
                                        <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            {[
                                                { title: 'Profile Management', desc: 'Update your display name, student ID, profile picture, and bio from one page. Changes reflect everywhere immediately including the group chat, leaderboard, and instructor views.' },
                                                { title: 'Session Management', desc: 'See all devices currently logged into your account. If you forgot to log out from a school computer, you can remotely sign out that session from your phone. Keeps your account safe.' },
                                                { title: 'Data Export', desc: 'Download all your data at any time: grades, submissions, study time logs, and course progress. Everything comes in a clean format you can open in Excel or Google Sheets.' },
                                                { title: 'Privacy Controls', desc: 'Choose who can see your online status, study time, and profile info. You can go fully private so only your teachers see your activity, or keep it visible for classmates to find you.' },
                                            ].map((item, i, arr) => (
                                                <React.Fragment key={i}>
                                                    <motion.div
                                                        key={i}
                                                        initial={{ opacity: 0, x: -8 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: 0.15 + i * 0.06, duration: 0.3 }}
                                                        style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}
                                                    >
                                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#64748b', flexShrink: 0, marginTop: '6px' }} />
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontSize: '14px', fontWeight: 600, color: isDarkMode ? '#f1f5f9' : '#0f172a', marginBottom: '2px' }}>{item.title}</div>
                                                            <div style={{ fontSize: '13.5px', color: isDarkMode ? '#cbd5e1' : '#64748b', lineHeight: 1.5 }}>{item.desc}</div>
                                                        </div>
                                                    </motion.div>
                                                    {i < arr.length - 1 && <div style={{ height: '1px', background: isDarkMode ? '#334155' : '#f1f5f9', marginTop: '6px', marginBottom: '6px', marginLeft: '16px' }} />}
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    </motion.div>

                                </div>

                                {/* Bottom Note */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.7 }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        marginTop: '16px',
                                        padding: '10px 14px',
                                        borderRadius: '10px',
                                        background: isDarkMode ? 'rgba(59, 130, 246, 0.15)' : '#eff6ff',
                                        border: `1px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.3)' : '#bfdbfe'}`,
                                    }}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                                        <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
                                    </svg>
                                    <span style={{ fontSize: '13px', color: isDarkMode ? '#93c5fd' : '#1e40af', lineHeight: 1.4 }}>
                                        All settings are found in <strong>Profile {'>'} Settings</strong>. Your preferences sync across all your devices automatically.
                                    </span>
                                </motion.div>
                            </div>
                        </div>

                        <div className={`feature-detail ${activeFeature === 'overhaul' ? 'active' : ''}`} data-feature="overhaul">
                            <div className="feature-description">
                                <span className="feature-category">Complete Rebuild</span>
                                <h3>Built from the Ground Up</h3>
                                <p className="feature-intro">Every line of code has been rewritten using cutting-edge
                                    technologies and industry best practices. This comprehensive overhaul delivers a faster,
                                    more secure, and infinitely scalable platform designed to serve the academic community
                                    for years to come.</p>

                                 {/* Overhaul Grid */}
                                 <div className="overhaul-grid">
                                     {/* Modern Tech Stack */}
                                     <div className="overhaul-card span-2" style={{
                                         '--card-accent': '#3b82f6',
                                         '--card-accent-alpha': 'rgba(59, 130, 246, 0.15)',
                                         background: isDarkMode ? 'rgba(30, 41, 59, 0.45)' : 'rgba(255, 255, 255, 0.7)',
                                         border: `1px solid ${isDarkMode ? 'rgba(51, 65, 85, 0.6)' : 'rgba(226, 232, 240, 0.8)'}`,
                                     } as React.CSSProperties}>
                                         <div style={{ display: 'flex', gap: '20px', width: '100%', alignItems: 'center', flexWrap: 'wrap' }}>
                                             <div style={{ flex: '1 1 200px' }}>
                                                 <div className="overhaul-icon">
                                                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                         <polyline points="16 18 22 12 16 6"></polyline>
                                                         <polyline points="8 6 2 12 8 18"></polyline>
                                                     </svg>
                                                 </div>
                                                 <h4 style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>Modern Tech Stack</h4>
                                                 <p style={{ color: isDarkMode ? '#cbd5e1' : '#64748b' }}>
                                                     Built with <strong>latest web standards</strong> including HTML5, CSS3, and ES6+ JavaScript. Utilizes <strong>modern frameworks and libraries</strong> for optimal performance and maintainability.
                                                 </p>
                                             </div>
                                             <div style={{ flex: '1 1 200px', display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', background: isDarkMode ? 'rgba(15, 23, 42, 0.3)' : 'rgba(248, 250, 252, 0.8)', padding: '14px', borderRadius: '12px', border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'}` }}>
                                                 {[
                                                     { name: 'React', color: '#61dafb', bg: 'rgba(97, 218, 251, 0.1)', border: 'rgba(97, 218, 251, 0.3)' },
                                                     { name: 'TypeScript', color: '#3178c6', bg: 'rgba(49, 120, 198, 0.1)', border: 'rgba(49, 120, 198, 0.3)' },
                                                     { name: 'Vite', color: '#ffc837', bg: 'rgba(255, 200, 55, 0.1)', border: 'rgba(255, 200, 55, 0.3)' },
                                                     { name: 'Framer Motion', color: '#ff007f', bg: 'rgba(255, 0, 127, 0.1)', border: 'rgba(255, 0, 127, 0.3)' },
                                                     { name: 'ES6+ JS', color: '#f7df1e', bg: 'rgba(247, 223, 30, 0.1)', border: 'rgba(247, 223, 30, 0.3)' },
                                                     { name: 'CSS Variables', color: '#2965f1', bg: 'rgba(41, 101, 241, 0.1)', border: 'rgba(41, 101, 241, 0.3)' }
                                                 ].map((tech, idx) => (
                                                     <motion.div
                                                         key={idx}
                                                         whileHover={{ scale: 1.08, y: -2 }}
                                                         transition={{ type: 'spring', stiffness: 300 }}
                                                         style={{
                                                             padding: '6px 12px',
                                                             borderRadius: '20px',
                                                             background: tech.bg,
                                                             border: `1px solid ${tech.border}`,
                                                             color: tech.color,
                                                             fontSize: '11px',
                                                             fontWeight: 700,
                                                             letterSpacing: '0.02em',
                                                             display: 'flex',
                                                             alignItems: 'center',
                                                             gap: '6px',
                                                             cursor: 'pointer'
                                                         }}
                                                     >
                                                         <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: tech.color }} />
                                                         {tech.name}
                                                     </motion.div>
                                                 ))}
                                             </div>
                                         </div>
                                     </div>

                                     {/* Performance Optimized */}
                                     <div className="overhaul-card span-1" style={{
                                         '--card-accent': '#10b981',
                                         '--card-accent-alpha': 'rgba(16, 185, 129, 0.15)',
                                         background: isDarkMode ? 'rgba(30, 41, 59, 0.45)' : 'rgba(255, 255, 255, 0.7)',
                                         border: `1px solid ${isDarkMode ? 'rgba(51, 65, 85, 0.6)' : 'rgba(226, 232, 240, 0.8)'}`,
                                     } as React.CSSProperties}>
                                         <div className="overhaul-icon">
                                             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                 <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                                             </svg>
                                         </div>
                                         <h4 style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>Performance Optimized</h4>
                                         <p style={{ color: isDarkMode ? '#cbd5e1' : '#64748b', marginBottom: '14px' }}>
                                             <strong>Lightning-fast load times</strong> through code splitting, lazy loading, and asset optimization. Smooth <strong>60fps transitions</strong>.
                                         </p>
                                         <div style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '8px 0', position: 'relative' }}>
                                             <svg width="80" height="80" viewBox="0 0 36 36">
                                                 <path
                                                     d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                     fill="none"
                                                     stroke={isDarkMode ? '#334155' : '#e2e8f0'}
                                                     strokeWidth="2"
                                                 />
                                                 <motion.path
                                                     d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                     fill="none"
                                                     stroke="#10b981"
                                                     strokeWidth="2"
                                                     strokeDasharray="100, 100"
                                                      initial={{ strokeDashoffset: 100 }}
                                                      animate={activeFeature === 'overhaul' ? { strokeDashoffset: 1 } : { strokeDashoffset: 100 }}
                                                      transition={{ duration: 1.8, ease: 'easeOut' }}
                                                 />
                                             </svg>
                                             <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                 <span style={{ fontSize: '18px', fontWeight: 800, color: '#10b981', lineHeight: 1 }}>99</span>
                                                 <span style={{ fontSize: '8px', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '1px' }}>Score</span>
                                             </div>
                                         </div>
                                     </div>

                                     {/* Enhanced Security */}
                                     <div className="overhaul-card span-1" style={{
                                         '--card-accent': '#f59e0b',
                                         '--card-accent-alpha': 'rgba(245, 158, 11, 0.15)',
                                         background: isDarkMode ? 'rgba(30, 41, 59, 0.45)' : 'rgba(255, 255, 255, 0.7)',
                                         border: `1px solid ${isDarkMode ? 'rgba(51, 65, 85, 0.6)' : 'rgba(226, 232, 240, 0.8)'}`,
                                     } as React.CSSProperties}>
                                         <div className="overhaul-icon">
                                             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                 <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                                             </svg>
                                         </div>
                                         <h4 style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>Enhanced Security</h4>
                                         <p style={{ color: isDarkMode ? '#cbd5e1' : '#64748b', marginBottom: '14px' }}>
                                             Implements <strong>enterprise security protocols</strong> with encrypted transmissions, secure authentication, and <strong>XSS/CSRF protections</strong>.
                                         </p>
                                         <div style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '8px 0', position: 'relative' }}>
                                             <motion.div
                                                 animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
                                                 transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                                                 style={{
                                                     position: 'absolute',
                                                     width: '56px',
                                                     height: '56px',
                                                     borderRadius: '50%',
                                                     border: '2px solid rgba(245, 158, 11, 0.15)',
                                                 }}
                                             />
                                             <motion.div
                                                 animate={{ scale: [1, 1.15, 1] }}
                                                 transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                                                 style={{
                                                     width: '42px',
                                                     height: '42px',
                                                     borderRadius: '50%',
                                                     background: isDarkMode ? 'rgba(245, 158, 11, 0.1)' : 'rgba(254, 243, 199, 0.8)',
                                                     border: '1px solid rgba(245, 158, 11, 0.3)',
                                                     display: 'flex',
                                                     alignItems: 'center',
                                                     justifyContent: 'center',
                                                     zIndex: 2
                                                 }}
                                             >
                                                 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                     <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                                     <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                                 </svg>
                                             </motion.div>
                                         </div>
                                     </div>

                                     {/* Scalable Architecture */}
                                     <div className="overhaul-card span-2" style={{
                                         '--card-accent': '#8b5cf6',
                                         '--card-accent-alpha': 'rgba(139, 92, 246, 0.15)',
                                         background: isDarkMode ? 'rgba(30, 41, 59, 0.45)' : 'rgba(255, 255, 255, 0.7)',
                                         border: `1px solid ${isDarkMode ? 'rgba(51, 65, 85, 0.6)' : 'rgba(226, 232, 240, 0.8)'}`,
                                     } as React.CSSProperties}>
                                         <div style={{ display: 'flex', gap: '20px', width: '100%', alignItems: 'center', flexWrap: 'wrap' }}>
                                             <div style={{ flex: '1 1 200px' }}>
                                                 <div className="overhaul-icon">
                                                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                         <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                                                         <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                                                         <line x1="12" y1="22.08" x2="12" y2="12"></line>
                                                     </svg>
                                                 </div>
                                                 <h4 style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>Scalable Architecture</h4>
                                                 <p style={{ color: isDarkMode ? '#cbd5e1' : '#64748b' }}>
                                                     <strong>Modular design</strong> allows seamless feature additions. Built horizontally to handle <strong>thousands of concurrent connections</strong> without slowdowns.
                                                 </p>
                                             </div>
                                             <div style={{ flex: '1 1 200px', display: 'flex', justifyContent: 'center', padding: '10px 0' }}>
                                                 <svg width="180" height="90" viewBox="0 0 180 90">
                                                     <rect x="70" y="5" width="40" height="20" rx="4" fill={isDarkMode ? 'rgba(139, 92, 246, 0.15)' : '#ede9fe'} stroke="#8b5cf6" strokeWidth="1.5" />
                                                     <text x="90" y="17" fontSize="8" fontWeight="700" fill="#8b5cf6" textAnchor="middle">LB</text>

                                                     <rect x="20" y="60" width="50" height="22" rx="4" fill={isDarkMode ? '#1e293b' : '#ffffff'} stroke={isDarkMode ? '#334155' : '#e2e8f0'} strokeWidth="1.5" />
                                                     <text x="45" y="73" fontSize="7" fontWeight="600" fill={isDarkMode ? '#94a3b8' : '#64748b'} textAnchor="middle">Node A</text>

                                                     <rect x="110" y="60" width="50" height="22" rx="4" fill={isDarkMode ? '#1e293b' : '#ffffff'} stroke={isDarkMode ? '#334155' : '#e2e8f0'} strokeWidth="1.5" />
                                                     <text x="135" y="73" fontSize="7" fontWeight="600" fill={isDarkMode ? '#94a3b8' : '#64748b'} textAnchor="middle">Node B</text>

                                                     <motion.path
                                                         d="M 90 25 L 45 60"
                                                         fill="none"
                                                         stroke="#8b5cf6"
                                                         strokeWidth="1.5"
                                                         strokeDasharray="4 4"
                                                         animate={{ strokeDashoffset: [0, -20] }}
                                                         transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                                                     />
                                                     <motion.path
                                                         d="M 90 25 L 135 60"
                                                         fill="none"
                                                         stroke="#8b5cf6"
                                                         strokeWidth="1.5"
                                                         strokeDasharray="4 4"
                                                         animate={{ strokeDashoffset: [0, 20] }}
                                                         transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                                                     />
                                                 </svg>
                                             </div>
                                         </div>
                                     </div>

                                     {/* Clean Codebase */}
                                     <div className="overhaul-card span-2" style={{
                                         '--card-accent': '#64748b',
                                         '--card-accent-alpha': 'rgba(100, 116, 139, 0.15)',
                                         background: isDarkMode ? 'rgba(30, 41, 59, 0.45)' : 'rgba(255, 255, 255, 0.7)',
                                         border: `1px solid ${isDarkMode ? 'rgba(51, 65, 85, 0.6)' : 'rgba(226, 232, 240, 0.8)'}`,
                                     } as React.CSSProperties}>
                                         <div style={{ display: 'flex', gap: '20px', width: '100%', alignItems: 'center', flexWrap: 'wrap' }}>
                                             <div style={{ flex: '1 1 200px' }}>
                                                 <div className="overhaul-icon">
                                                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                         <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                                                     </svg>
                                                 </div>
                                                 <h4 style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>Clean Codebase</h4>
                                                 <p style={{ color: isDarkMode ? '#cbd5e1' : '#64748b' }}>
                                                     Follows strict <strong>industry best practices</strong>: comprehensive documentation, type-safe clean structures, and <strong>highly maintainable classes</strong>.
                                                 </p>
                                             </div>
                                             <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', borderRadius: '10px', background: '#0f172a', border: '1px solid #1e293b', overflow: 'hidden', width: '100%', maxWidth: '240px' }}>
                                                 <div style={{ display: 'flex', gap: '5px', padding: '8px 10px', background: '#1e293b', borderBottom: '1px solid #0f172a', alignItems: 'center' }}>
                                                     <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444' }} />
                                                     <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b' }} />
                                                     <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                                                     <div style={{ color: '#64748b', fontSize: '9px', fontFamily: 'monospace', marginLeft: '6px' }}>elms.config.ts</div>
                                                 </div>
                                                 <div style={{ padding: '10px', fontFamily: 'monospace', fontSize: '10px', color: '#94a3b8', lineHeight: 1.4, textAlign: 'left' }}>
                                                     <div><span style={{ color: '#f43f5e' }}>const</span> <span style={{ color: '#3b82f6' }}>elms</span> = &#123;</div>
                                                     <div style={{ paddingLeft: '12px' }}><span style={{ color: '#10b981' }}>performance</span>: <span style={{ color: '#eab308' }}>"1.8s"</span>,</div>
                                                     <div style={{ paddingLeft: '12px' }}><span style={{ color: '#10b981' }}>scalable</span>: <span style={{ color: '#eab308' }}>true</span>,</div>
                                                     <div style={{ paddingLeft: '12px' }}><span style={{ color: '#10b981' }}>security</span>: <span style={{ color: '#eab308' }}>"Enterprise"</span></div>
                                                     <div>&#125;;</div>
                                                 </div>
                                             </div>
                                         </div>
                                     </div>

                                     {/* Future-Ready */}
                                     <div className="overhaul-card span-1" style={{
                                         '--card-accent': '#ec4899',
                                         '--card-accent-alpha': 'rgba(236, 72, 153, 0.15)',
                                         background: isDarkMode ? 'rgba(30, 41, 59, 0.45)' : 'rgba(255, 255, 255, 0.7)',
                                         border: `1px solid ${isDarkMode ? 'rgba(51, 65, 85, 0.6)' : 'rgba(226, 232, 240, 0.8)'}`,
                                     } as React.CSSProperties}>
                                         <div className="overhaul-icon">
                                             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                 <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                                             </svg>
                                         </div>
                                         <h4 style={{ color: isDarkMode ? '#f1f5f9' : '#0f172a' }}>Future-Ready</h4>
                                         <p style={{ color: isDarkMode ? '#cbd5e1' : '#64748b', marginBottom: '14px' }}>
                                             Designed with <strong>extensibility in mind</strong>, ready for direct AI assistance, advanced course analytics, and future tools.
                                         </p>
                                         <div style={{ width: '100%', display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
                                             <motion.div
                                                 animate={{ scale: [0.95, 1.05, 0.95] }}
                                                 transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                                                 style={{
                                                     padding: '4px 8px',
                                                     borderRadius: '6px',
                                                     background: isDarkMode ? 'rgba(236, 72, 153, 0.1)' : 'rgba(253, 242, 248, 0.8)',
                                                     border: '1px solid rgba(236, 72, 153, 0.3)',
                                                     fontSize: '10px',
                                                     fontWeight: 600,
                                                     color: '#ec4899'
                                                 }}
                                             >
                                                 AI Integrations
                                             </motion.div>
                                             <motion.div
                                                 animate={{ scale: [1.05, 0.95, 1.05] }}
                                                 transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                                                 style={{
                                                     padding: '4px 8px',
                                                     borderRadius: '6px',
                                                     background: isDarkMode ? 'rgba(139, 92, 246, 0.1)' : 'rgba(245, 243, 255, 0.8)',
                                                     border: '1px solid rgba(139, 92, 246, 0.3)',
                                                     fontSize: '10px',
                                                     fontWeight: 600,
                                                     color: '#8b5cf6'
                                                 }}
                                             >
                                                 Analytics v2
                                             </motion.div>
                                         </div>
                                     </div>
                                </div>
                            </div>
                        </div>

                        <div className={`feature-detail ${activeFeature === 'quick' ? 'active' : ''}`} data-feature="quick">
                            <div className="feature-description">
                                <span className="feature-category">Navigation Enhancement</span>
                                <h3>Instant Access, Zero Friction</h3>
                                <p className="feature-intro">Navigate your learning journey with unprecedented speed and
                                    efficiency. Our redesigned quick access system puts essential tools at your fingertips
                                    while keeping the interface clean and uncluttered through intelligent organization.</p>

                                {/* Quick Access Features */}
                                <div className="quick-access-features">
                                    <div className="quick-feature-item">
                                        <div className="quick-feature-icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                                                strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                                <path d="M9 3v18"></path>
                                                <path d="M15 3v18"></path>
                                                <path d="M3 9h18"></path>
                                                <path d="M3 15h18"></path>
                                            </svg>
                                        </div>
                                        <div className="quick-feature-content">
                                            <h4>Quick Access Toolbelt</h4>
                                            <p>A <strong>persistent horizontal toolbar</strong> positioned at the top of
                                                your dashboard provides <strong>one-click access</strong> to your most
                                                important sections. The toolbelt features <strong>four primary
                                                    shortcuts</strong>:</p>
                                            <div className="toolbelt-buttons">
                                                <div className="toolbelt-button">
                                                    <div className="toolbelt-arrow">{'\u2192'}</div>
                                                    <div className="toolbelt-info">
                                                        <span className="toolbelt-label">Continue Learning</span>
                                                        <span className="toolbelt-desc">Jump back to your last active course or
                                                            lesson instantly</span>
                                                    </div>
                                                </div>
                                                <div className="toolbelt-button">
                                                    <div className="toolbelt-arrow">{'\u2192'}</div>
                                                    <div className="toolbelt-info">
                                                        <span className="toolbelt-label">Assignments</span>
                                                        <span className="toolbelt-desc">View all pending, submitted, and graded
                                                            assignments in one place</span>
                                                    </div>
                                                </div>
                                                <div className="toolbelt-button">
                                                    <div className="toolbelt-arrow">{'\u2192'}</div>
                                                    <div className="toolbelt-info">
                                                        <span className="toolbelt-label">Classes</span>
                                                        <span className="toolbelt-desc">Access your enrolled courses, schedules,
                                                            and class materials</span>
                                                    </div>
                                                </div>
                                                <div className="toolbelt-button">
                                                    <div className="toolbelt-arrow">{'\u2192'}</div>
                                                    <div className="toolbelt-info">
                                                        <span className="toolbelt-label">Discussion</span>
                                                        <span className="toolbelt-desc">Engage with classmates and instructors
                                                            in course forums</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <p>Each button features <strong>clear iconography and labels</strong>, with
                                                <strong>visual indicators</strong> showing unread items or pending actions.
                                                The toolbelt remains <strong>visible while scrolling</strong>, ensuring
                                                critical functions are always accessible without navigation overhead.</p>
                                        </div>
                                    </div>

                                    <div className="quick-feature-item">
                                        <div className="quick-feature-icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                                                strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="3" y="3" width="7" height="9"></rect>
                                                <rect x="14" y="3" width="7" height="5"></rect>
                                                <rect x="14" y="12" width="7" height="9"></rect>
                                                <rect x="3" y="16" width="7" height="5"></rect>
                                            </svg>
                                        </div>
                                        <div className="quick-feature-content">
                                            <h4>Smart Widget System</h4>
                                            <p>The original STI eLMS suffered from <strong>overwhelming widget
                                                clutter</strong> that created visual noise and confusion. We've
                                                completely <strong>reorganized and streamlined</strong> the widget
                                                experience:</p>

                                            <div className="toolbelt-buttons">
                                                <div className="toolbelt-button">
                                                    <div className="toolbelt-arrow">{'\u2192'}</div>
                                                    <div className="toolbelt-info">
                                                        <span className="toolbelt-label">Hidden by Default</span>
                                                        <span className="toolbelt-desc">Widgets are concealed to maintain a
                                                            clean, focused workspace</span>
                                                    </div>
                                                </div>

                                                <div className="toolbelt-button">
                                                    <div className="toolbelt-arrow">{'\u2192'}</div>
                                                    <div className="toolbelt-info">
                                                        <span className="toolbelt-label">Hover-Activated Panel</span>
                                                        <span className="toolbelt-desc">Move your cursor to the far right edge
                                                            to reveal a subtle arrow indicator</span>
                                                    </div>
                                                </div>

                                                <div className="toolbelt-button">
                                                    <div className="toolbelt-arrow">{'\u2192'}</div>
                                                    <div className="toolbelt-info">
                                                        <span className="toolbelt-label">Slide-Out Drawer</span>
                                                        <span className="toolbelt-desc">Click the arrow to smoothly slide open
                                                            the widget panel from the right</span>
                                                    </div>
                                                </div>

                                                <div className="toolbelt-button">
                                                    <div className="toolbelt-arrow">{'\u2192'}</div>
                                                    <div className="toolbelt-info">
                                                        <span className="toolbelt-label">Organized Categories</span>
                                                        <span className="toolbelt-desc">Widgets are grouped logically (Calendar,
                                                            Tasks, Announcements, Progress)</span>
                                                    </div>
                                                </div>

                                                <div className="toolbelt-button">
                                                    <div className="toolbelt-arrow">{'\u2192'}</div>
                                                    <div className="toolbelt-info">
                                                        <span className="toolbelt-label">Customizable Layout</span>
                                                        <span className="toolbelt-desc">Drag and drop to reorder widgets based
                                                            on your priorities</span>
                                                    </div>
                                                </div>

                                                <div className="toolbelt-button">
                                                    <div className="toolbelt-arrow">{'\u2192'}</div>
                                                    <div className="toolbelt-info">
                                                        <span className="toolbelt-label">Collapsible Sections</span>
                                                        <span className="toolbelt-desc">Minimize individual widgets to save
                                                            space while keeping them accessible</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <p>This approach eliminates the <strong>overwhelming information
                                                overload</strong> of the old system while ensuring all tools remain
                                                <strong>instantly available</strong> when needed. The panel
                                                <strong>auto-hides</strong> when you move away, keeping your focus on
                                                learning content.</p>
                                        </div>
                                    </div>

                                    <div className="quick-feature-item">
                                        <div className="quick-feature-icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                                                strokeLinecap="round" strokeLinejoin="round">
                                                <circle cx="12" cy="12" r="10"></circle>
                                                <polyline points="12 6 12 12 16 14"></polyline>
                                            </svg>
                                        </div>
                                        <div className="quick-feature-content">
                                            <h4>Contextual Quick Actions</h4>
                                            <p><strong>Smart shortcuts appear based on your current activity</strong>,
                                                providing relevant actions without cluttering the interface. When viewing a
                                                course, see options to <strong>submit assignments, join discussions, or
                                                    download materials</strong>. Context-aware design means you see
                                                <strong>only what's relevant</strong> to your current task, reducing
                                                cognitive load and decision fatigue.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className={`feature-detail ${activeFeature === 'flexible' ? 'active' : ''}`} data-feature="flexible">
                            <div className="feature-description">
                                <span className="feature-category">Responsive Design</span>
                                <h3>Perfectly Optimized for Every Device</h3>
                                <p className="feature-intro">We've meticulously optimized the entire platform to provide a
                                    seamless experience across all devices. From smartphones to desktops, every screen size
                                    receives a tailored interface that maintains full functionality while ensuring comfort
                                    and usability.</p>

                                {/* Device Optimization Cards */}
                                <div className="feature-benefits">
                                    <div className="benefit-item">
                                        <div className="benefit-icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                                                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                                                strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                                                <line x1="12" y1="18" x2="12.01" y2="18"></line>
                                            </svg>
                                        </div>
                                        <div className="benefit-content">
                                            <h4>Mobile Optimization</h4>
                                            <p>Designed for <strong>touch-first interaction</strong> with larger tap targets
                                                and thumb-friendly navigation. <strong>Optimized for 320px-767px</strong>
                                                including iPhone and Android devices with <strong>bottom navigation
                                                    bars</strong> and streamlined content.</p>
                                        </div>
                                    </div>

                                    <div className="benefit-item">
                                        <div className="benefit-icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                                                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                                                strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
                                                <line x1="12" y1="18" x2="12.01" y2="18"></line>
                                            </svg>
                                        </div>
                                        <div className="benefit-content">
                                            <h4>Tablet Optimization</h4>
                                            <p>Balanced for <strong>portrait and landscape modes</strong> with adaptive grid
                                                layouts. <strong>Optimized for 768px-1024px</strong> including iPad and
                                                Surface with <strong>two-column layouts</strong> and enhanced touch
                                                controls.</p>
                                        </div>
                                    </div>

                                    <div className="benefit-item">
                                        <div className="benefit-icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                                                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                                                strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                                                <line x1="8" y1="21" x2="16" y2="21"></line>
                                                <line x1="12" y1="17" x2="12" y2="21"></line>
                                            </svg>
                                        </div>
                                        <div className="benefit-content">
                                            <h4>Desktop Optimization</h4>
                                            <p>Full-featured interface with <strong>multi-column layouts and persistent
                                                sidebars</strong>. <strong>Optimized for 1025px+</strong> including
                                                ultrawide and 4K displays with <strong>keyboard shortcuts</strong> and
                                                drag-and-drop functionality.</p>
                                        </div>
                                    </div>

                                    <div className="benefit-item">
                                        <div className="benefit-icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                                                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                                                strokeLinecap="round" strokeLinejoin="round">
                                                <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                                                <circle cx="9" cy="9" r="2" />
                                                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                                            </svg>
                                        </div>
                                        <div className="benefit-content">
                                            <h4>Responsive Media</h4>
                                            <p>Images and videos <strong>automatically scale</strong> without quality loss.
                                                <strong>Adaptive loading</strong> based on device capabilities with
                                                <strong>lazy loading</strong> and retina-ready graphics for crisp displays.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="benefit-item">
                                        <div className="benefit-icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                                                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                                                strokeLinecap="round" strokeLinejoin="round">
                                                <circle cx="12" cy="12" r="10"></circle>
                                                <circle cx="12" cy="12" r="6"></circle>
                                                <circle cx="12" cy="12" r="2"></circle>
                                            </svg>
                                        </div>
                                        <div className="benefit-content">
                                            <h4>Cross-Browser Support</h4>
                                            <p>Tested for <strong>Chrome, Firefox, Safari, Edge</strong>, and mobile
                                                browsers. <strong>Progressive enhancement</strong> ensures core
                                                functionality everywhere while modern browsers receive enhanced features.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="benefit-item">
                                        <div className="benefit-icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                                                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                                                strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="16 3 21 3 21 8"></polyline>
                                                <line x1="4" y1="20" x2="21" y2="3"></line>
                                                <polyline points="21 16 21 21 16 21"></polyline>
                                                <line x1="15" y1="15" x2="21" y2="21"></line>
                                                <line x1="4" y1="4" x2="9" y2="9"></line>
                                            </svg>
                                        </div>
                                        <div className="benefit-content">
                                            <h4>Flexible Reflow</h4>
                                            <p>Content <strong>intelligently reorganizes</strong> based on space. Sidebars
                                                become <strong>slide-out menus</strong>, navigation transforms to hamburger
                                                menus. <strong>No horizontal scrolling</strong> on any device.</p>
                                        </div>
                                    </div>

                                    <div className="benefit-item">
                                        <div className="benefit-icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                                                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                                                strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M9 18V5l12-2v13"></path>
                                                <circle cx="6" cy="18" r="3"></circle>
                                                <circle cx="18" cy="16" r="3"></circle>
                                            </svg>
                                        </div>
                                        <div className="benefit-content">
                                            <h4>Dual Input Support</h4>
                                            <p>Optimized for <strong>touch gestures and mouse interactions</strong>.
                                                Automatically detects input method. <strong>Hybrid devices</strong> like
                                                Surface Pro seamlessly switch between touch and mouse modes.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className={`feature-detail ${activeFeature === 'profile' ? 'active' : ''}`} data-feature="profile">
                            <div className="feature-description">
                                <span className="feature-category">Personalization</span>
                                <h3>Express Your Identity</h3>
                                <p className="feature-intro">Transform your profile into a unique digital identity with
                                    exclusive customization features. From animated name effects to custom calling cards,
                                    showcase your personality and achievements in style.</p>

                                {/* Profile Customization Features */}
                                <div className="profile-features">
                                    <div className="profile-feature-item">
                                        <div className="profile-feature-icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                                                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                                                strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                                                <line x1="8" y1="21" x2="16" y2="21"></line>
                                                <line x1="12" y1="17" x2="12" y2="21"></line>
                                            </svg>
                                        </div>
                                        <div className="profile-feature-content">
                                            <h4>Calling Cards</h4>
                                            <p>Choose from a <strong>curated collection of calling card backgrounds</strong>
                                                to personalize your profile banner. Select from various themes, colors, and
                                                designs that match your style. <strong>Available at launch</strong> with new
                                                cards added regularly. Note: Custom uploads are not supported to maintain
                                                platform consistency.</p>
                                        </div>
                                    </div>

                                    <div className="profile-feature-item">
                                        <div className="profile-feature-icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                                                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                                                strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                                                <path d="M2 17l10 5 10-5"></path>
                                                <path d="M2 12l10 5 10-5"></path>
                                            </svg>
                                        </div>
                                        <div className="profile-feature-content">
                                            <h4>Animated Name Effects</h4>
                                            <p><strong>Exclusive feature for Teachers and Admins</strong> - Make your name
                                                stand out with stunning visual effects including <strong>glow effects,
                                                    shimmer animations, and gradient transitions</strong>. Choose from
                                                multiple animation styles that bring your profile to life. This premium
                                                feature recognizes the important role of educators and administrators.</p>
                                        </div>
                                    </div>

                                    <div className="profile-feature-item">
                                        <div className="profile-feature-icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                                                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                                                strokeLinecap="round" strokeLinejoin="round">
                                                <path
                                                    d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z">
                                                </path>
                                                <line x1="7" y1="7" x2="7.01" y2="7"></line>
                                            </svg>
                                        </div>
                                        <div className="profile-feature-content">
                                            <h4>Unique Profile Tags</h4>
                                            <p>Display your role with <strong>distinctive profile tags</strong>. At launch,
                                                all users receive the <strong>"Student" tag</strong> as the default
                                                identifier. Tags are <strong>system-assigned based on your role</strong> and
                                                achievements, ensuring authenticity and recognition within the learning
                                                community.</p>
                                        </div>
                                    </div>

                                    <div className="profile-feature-item">
                                        <div className="profile-feature-icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                                                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                                                strokeLinecap="round" strokeLinejoin="round">
                                                <circle cx="12" cy="12" r="10"></circle>
                                                <circle cx="12" cy="12" r="6"></circle>
                                                <circle cx="12" cy="12" r="2"></circle>
                                            </svg>
                                        </div>
                                        <div className="profile-feature-content">
                                            <h4>Profile Borders</h4>
                                            <p><strong>Available for all users at launch</strong> - Frame your profile
                                                picture with stylish borders. Choose from various designs and colors to add
                                                a <strong>personal touch to your avatar</strong>. Borders are
                                                <strong>accessible to Students, Teachers, and Admins</strong>, providing
                                                everyone with customization options from day one.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Profile Sections */}
                                <div className="profile-sections">
                                    <h4 className="features-subtitle">Profile Information Sections</h4>
                                    <div className="profile-sections-grid">
                                        <div className="profile-section-card">
                                            <div className="section-icon">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"
                                                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                                                    strokeLinecap="round" strokeLinejoin="round">
                                                    <circle cx="12" cy="12" r="10"></circle>
                                                    <line x1="12" y1="16" x2="12" y2="12"></line>
                                                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                                                </svg>
                                            </div>
                                            <div className="section-content">
                                                <h5>Info</h5>
                                                <p>Display <strong>campus, academic level, section, program, year level,
                                                    student ID, location, and contact information</strong>.
                                                    Comprehensive overview of your academic profile.</p>
                                            </div>
                                        </div>

                                        <div className="profile-section-card">
                                            <div className="section-icon">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"
                                                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                                                    strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M12 2v20M2 12h20"></path>
                                                </svg>
                                            </div>
                                            <div className="section-content">
                                                <h5>About</h5>
                                                <p>Add a <strong>personal description</strong> to introduce yourself to
                                                    classmates and instructors. Share your interests, goals, or background.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="profile-section-card">
                                            <div className="section-icon">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"
                                                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                                                    strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                                                    <path
                                                        d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z">
                                                    </path>
                                                </svg>
                                            </div>
                                            <div className="section-content">
                                                <h5>Enrolled</h5>
                                                <p>View all <strong>enrolled courses with progress, scores, grades, and time
                                                    spent</strong>. Track your academic journey at a glance.</p>
                                            </div>
                                        </div>

                                        <div className="profile-section-card">
                                            <div className="section-icon">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"
                                                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                                                    strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                                    <circle cx="9" cy="7" r="4"></circle>
                                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                                </svg>
                                            </div>
                                            <div className="section-content">
                                                <h5>Groups</h5>
                                                <p>Display all <strong>groups you've joined</strong> for collaboration,
                                                    study sessions, or project work. Stay connected with your teams.</p>
                                            </div>
                                        </div>

                                        <div className="profile-section-card">
                                            <div className="section-icon">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"
                                                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                                                    strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                                </svg>
                                            </div>
                                            <div className="section-content">
                                                <h5>Goals</h5>
                                                <p>Set and track <strong>personal learning goals</strong> within the system.
                                                    Choose from <strong>Job or Competencies goals</strong> to master
                                                    specific skills and career objectives.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className={`feature-detail ${activeFeature === 'engagement' ? 'active' : ''}`} data-feature="engagement">
                            <div className="feature-description">
                                <span className="feature-category">Community & Gamification</span>
                                <h3>Interactive Learning Experience</h3>
                                <p className="feature-intro">Learning is better together. We've introduced powerful new
                                    tools to foster collaboration, recognize achievement, and keep you motivated throughout
                                    your academic journey.</p>

                                <div className="engagement-preview">
                                    {/* Image Placeholder */}
                                    <div className="preview-placeholder">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                                            <circle cx="9" cy="9" r="2" />
                                            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                                        </svg>
                                        <p>Engagement Features Preview</p>
                                        <span>Discussions, Badges, Progress & More</span>
                                    </div>

                                    <div className="engagement-slideshow-cards">
                                        {[
                                            {
                                                icon: (
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                                    </svg>
                                                ),
                                                title: "Real-Time Discussions",
                                                desc: <>Engage in <Tooltip content="Discussions that update instantly as you type"><strong>live class discussions</strong></Tooltip> with instant updates. Threaded replies, rich text formatting, and <Tooltip content="Notify classmates directly by tagging them"><strong>@mentions</strong></Tooltip> make communication seamless and effective.</>
                                            },
                                            {
                                                icon: (
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                        <circle cx="12" cy="8" r="7"></circle>
                                                        <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
                                                    </svg>
                                                ),
                                                title: "Achievements & Badges",
                                                desc: <>Earn <Tooltip content="Collect virtual awards for your achievements"><strong>digital badges</strong></Tooltip> for course completion, high scores, and active participation. Display your collection on your profile to showcase your dedication and skills.</>
                                            },
                                            {
                                                icon: (
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                        <line x1="12" y1="1" x2="12" y2="23"></line>
                                                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                                                    </svg>
                                                ),
                                                title: "Progress Tracking",
                                                desc: <>Visualize your journey with <Tooltip content="See your course completion at a glance"><strong>interactive progress bars</strong></Tooltip> and completion indicators. Know exactly where you stand in every course and what needs your attention next.</>
                                            },
                                            {
                                                icon: (
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                                        <circle cx="9" cy="7" r="4"></circle>
                                                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                                    </svg>
                                                ),
                                                title: "Collaborative Learning",
                                                desc: <>Form <Tooltip content="Collaborate with peers in dedicated spaces"><strong>study groups</strong></Tooltip> and work on group projects with dedicated spaces for file sharing and discussion. Foster teamwork and peer-to-peer learning.</>
                                            },
                                            {
                                                icon: (
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                                                        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                                                    </svg>
                                                ),
                                                title: "Smart Notifications",
                                                desc: <>Stay updated with <Tooltip content="Get timely reminders for important deadlines"><strong>intelligent alerts</strong></Tooltip> for deadlines, grades, and replies. Customize your notification preferences to receive only what matters to you.</>
                                            },
                                            {
                                                icon: (
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                                                    </svg>
                                                ),
                                                title: "Leaderboards & Competition",
                                                desc: <>Challenge yourself with <Tooltip content="See how you rank against your classmates"><strong>course leaderboards</strong></Tooltip>. See how you rank among your peers based on participation and achievements (optional per course).</>
                                            }
                                        ].map((slide, index) => (
                                            <div key={index} className={`engagement-feature-card ${currentSlide === index ? 'active' : ''}`} data-slide={index}>
                                                <div className="card-icon">
                                                    {slide.icon}
                                                </div>
                                                <div className="card-content">
                                                    <h4>{slide.title}</h4>
                                                    <span className="card-desc">{slide.desc}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Slideshow Navigation Dots */}
                                    <div className="slideshow-dots">
                                        {[0, 1, 2, 3, 4, 5].map((index) => (
                                            <span
                                                key={index}
                                                className={`dot ${currentSlide === index ? 'active' : ''}`}
                                                data-slide={index}
                                                onClick={() => setCurrentSlide(index)}
                                            ></span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className={`feature-detail ${activeFeature === 'more' ? 'active' : ''}`} data-feature="more">
                            <div className="feature-description">
                                <span className="feature-category">Comprehensive Updates</span>
                                <h3>Hundreds of Improvements</h3>
                                <p className="feature-intro">Beyond the major features, we've implemented countless enhancements across the entire platform to ensure a superior learning experience.</p>

                                <div className="feature-benefits">
                                    <div className="benefit-item">
                                        <div className="benefit-icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                                                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                                                strokeLinecap="round" strokeLinejoin="round">
                                                <circle cx="11" cy="11" r="8"></circle>
                                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                            </svg>
                                        </div>
                                        <div className="benefit-content">
                                            <h4>Advanced Search & Filters</h4>
                                            <p>Find courses, assignments, and resources instantly with <strong>powerful search capabilities</strong> and granular filtering options.</p>
                                        </div>
                                    </div>

                                    <div className="benefit-item">
                                        <div className="benefit-icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                                                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                                                strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                                <polyline points="14 2 14 8 20 8"></polyline>
                                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                                <line x1="16" y1="17" x2="8" y2="17"></line>
                                                <polyline points="10 9 9 9 8 9"></polyline>
                                            </svg>
                                        </div>
                                        <div className="benefit-content">
                                            <h4>Smart File Management</h4>
                                            <p>Organize your submissions and downloads with an <Tooltip content="Folders, search, and quick actions for files"><strong>improved file system</strong></Tooltip>. Drag-and-drop support and preview capabilities included.</p>
                                        </div>
                                    </div>

                                    <div className="benefit-item">
                                        <div className="benefit-icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                                                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                                                strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                                                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                                            </svg>
                                        </div>
                                        <div className="benefit-content">
                                            <h4>Enhanced Course Materials</h4>
                                            <p>Experience rich media content directly within the platform. <Tooltip content="Watch videos and read PDFs without leaving"><strong>Embedded videos, interactive PDFs, and audio players</strong></Tooltip> work seamlessly.</p>
                                        </div>
                                    </div>

                                    <div className="benefit-item">
                                        <div className="benefit-icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                                                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                                                strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                                <polyline points="14 2 14 8 20 8"></polyline>
                                                <line x1="12" y1="18" x2="12" y2="12"></line>
                                                <line x1="9" y1="15" x2="15" y2="15"></line>
                                            </svg>
                                        </div>
                                        <div className="benefit-content">
                                            <h4>Improved Assignment Submission</h4>
                                            <p>Submit work with confidence using the <Tooltip content="Easier uploads with auto-save drafts"><strong>new submission interface</strong></Tooltip>. Auto-save drafts and clear confirmation receipts ensure your work is safe.</p>
                                        </div>
                                    </div>

                                    <div className="benefit-item">
                                        <div className="benefit-icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                                                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                                                strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                                <line x1="3" y1="10" x2="21" y2="10"></line>
                                            </svg>
                                        </div>
                                        <div className="benefit-content">
                                            <h4>Integrated Calendar System</h4>
                                            <p>Manage your schedule with <Tooltip content="View all your academic events in one place"><strong>classes, assignments, exams, and events</strong></Tooltip> in one place. Set <strong>custom reminders</strong> and <Tooltip content="Keep your external calendars in sync"><strong>sync with external calendars</strong></Tooltip> (Google, Outlook).</p>
                                        </div>
                                    </div>

                                    <div className="benefit-item">
                                        <div className="benefit-icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                                                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                                                strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M12 20h9"></path>
                                                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                                            </svg>
                                        </div>
                                        <div className="benefit-content">
                                            <h4>Rich Text Editor</h4>
                                            <p>Create <Tooltip content="Format text with bold, italics, and lists"><strong>beautifully formatted content</strong></Tooltip> with support for <Tooltip content="Insert rich media and code snippets"><strong>tables, images, and code blocks</strong></Tooltip>. <Tooltip content="Use simple syntax for quick formatting"><strong>Markdown support</strong></Tooltip> and <strong>spell check</strong> ensure professional submissions.</p>
                                        </div>
                                    </div>

                                    <div className="benefit-item">
                                        <div className="benefit-icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                                                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                                                strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                                                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                                            </svg>
                                        </div>
                                        <div className="benefit-content">
                                            <h4>Resource Library</h4>
                                            <p>Access <Tooltip content="A central hub for all study materials"><strong>centralized repository</strong></Tooltip> of <strong>textbooks, tutorials, and study guides</strong>. <Tooltip content="Quickly find what you need with filters"><strong>Categorized and searchable</strong></Tooltip> with instructor-curated collections for each course.</p>
                                        </div>
                                    </div>

                                    <div className="benefit-item">
                                        <div className="benefit-icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                                                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                                                strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                                                <path d="M6 8h.001"></path>
                                                <path d="M10 8h.001"></path>
                                                <path d="M14 8h.001"></path>
                                                <path d="M18 8h.001"></path>
                                            </svg>
                                        </div>
                                        <div className="benefit-content">
                                            <h4>Keyboard Shortcuts</h4>
                                            <p>Navigate faster with <Tooltip content="Speed up tasks with keyboard commands"><strong>comprehensive shortcuts</strong></Tooltip> for common actions. <Tooltip content="Set your own preferred key bindings"><strong>Customizable hotkeys</strong></Tooltip> and <Tooltip content="View a list of all available shortcuts"><strong>cheat sheet</strong></Tooltip> available anytime for quick reference.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WelcomeModal;
