import React, { useState, useEffect } from 'react';
import { Tooltip } from './ui/tooltip-card';

interface WelcomeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose }) => {
    const [activeFeature, setActiveFeature] = useState('animations');
    const [currentSlide, setCurrentSlide] = useState(0);

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
                <button className="modal-close-btn" onClick={onClose}>
                    <span className="X"></span>
                    <span className="Y"></span>
                    <div className="close">Close</div>
                </button>

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
                        {/* Animations Feature */}
                        <div className={`feature-detail ${activeFeature === 'animations' ? 'active' : ''}`} data-feature="animations">
                            <div className="feature-description">
                                <span className="feature-category">User Experience</span>
                                <h3>Smooth, Fluid, Engaging</h3>
                                <p className="feature-intro">
                                    Experience seamless transitions and delightful interactions throughout the platform. Every element has been carefully animated to provide a modern, responsive feel that enhances your learning journey.
                                </p>

                                <div className="feature-benefits">
                                    <div className="benefit-item">
                                        <div className="benefit-icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="13 17 18 12 13 7"></polyline>
                                                <polyline points="6 17 11 12 6 7"></polyline>
                                            </svg>
                                        </div>
                                        <div className="benefit-content">
                                            <h4>Smooth Page Transitions</h4>
                                            <p>Navigate between pages with elegant fade and slide effects</p>
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
                                            <h4>Interactive Hover Effects</h4>
                                            <p>Buttons and cards respond instantly with visual feedback</p>
                                        </div>
                                    </div>

                                    <div className="benefit-item">
                                        <div className="benefit-icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="12" x2="12" y1="2" y2="6"></line>
                                                <line x1="12" x2="12" y1="18" y2="22"></line>
                                                <line x1="4.93" x2="7.76" y1="4.93" y2="7.76"></line>
                                                <line x1="16.24" x2="19.07" y1="16.24" y2="19.07"></line>
                                                <line x1="2" x2="6" y1="12" y2="12"></line>
                                                <line x1="18" x2="22" y1="12" y2="12"></line>
                                                <line x1="4.93" x2="7.76" y1="19.07" y2="16.24"></line>
                                                <line x1="16.24" x2="19.07" y1="7.76" y2="4.93"></line>
                                            </svg>
                                        </div>
                                        <div className="benefit-content">
                                            <h4>Loading Animations</h4>
                                            <p>Beautiful skeleton screens and progress indicators</p>
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
                                            <h4>Modal & Dropdown Animations</h4>
                                            <p>Smooth scaling and fading for all overlay elements</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bugs Feature */}
                        <div className={`feature-detail ${activeFeature === 'bugs' ? 'active' : ''}`} data-feature="bugs">
                            <div className="feature-description">
                                <span className="feature-category">Platform Stability</span>
                                <h3>Critical Fixes & Performance Upgrades</h3>
                                <p className="feature-intro">
                                    We've meticulously resolved over 50+ critical bugs and performance bottlenecks from the original STI eLMS. Every issue has been tracked, tested, and verified to ensure a seamless learning experience.
                                </p>

                                <div className="bug-fixes-grid">
                                    <div className="bug-fix-category">
                                        <div className="category-header">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                                            </svg>
                                            <h4>Performance Issues</h4>
                                        </div>
                                        <ul className="fix-list">
                                            <li>Fixed slow page load times (3x faster)</li>
                                            <li>Eliminated memory leaks in course viewer</li>
                                            <li>Optimized database queries for instant results</li>
                                            <li>Reduced server response time by 70%</li>
                                        </ul>
                                    </div>

                                    <div className="bug-fix-category">
                                        <div className="category-header">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                <circle cx="12" cy="12" r="3"></circle>
                                                <path d="M12 1v6m0 6v6"></path>
                                                <path d="m4.93 4.93 4.24 4.24m5.66 5.66 4.24 4.24"></path>
                                                <path d="M1 12h6m6 0h6"></path>
                                                <path d="m4.93 19.07 4.24-4.24m5.66-5.66 4.24-4.24"></path>
                                            </svg>
                                            <h4>UI/UX Bugs</h4>
                                        </div>
                                        <ul className="fix-list">
                                            <li>Fixed broken navigation links and redirects</li>
                                            <li>Resolved modal overlay display issues</li>
                                            <li>Corrected form validation errors</li>
                                            <li>Fixed sidebar collapse functionality</li>
                                        </ul>
                                    </div>

                                    <div className="bug-fix-category">
                                        <div className="category-header">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                                <polyline points="14 2 14 8 20 8"></polyline>
                                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                                <line x1="16" y1="17" x2="8" y2="17"></line>
                                            </svg>
                                            <h4>Assignment & Submission</h4>
                                        </div>
                                        <ul className="fix-list">
                                            <li>Fixed file upload failures and timeouts</li>
                                            <li>Resolved submission confirmation errors</li>
                                            <li>Fixed grade calculation inconsistencies</li>
                                            <li>Corrected deadline timezone issues</li>
                                        </ul>
                                    </div>
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

                        <div className={`feature-detail ${activeFeature === 'settings' ? 'active' : ''}`} data-feature="settings">
                            <div className="feature-description">
                                <span className="feature-category">Customization</span>
                                <h3>Personalized Experience</h3>
                                <p className="feature-intro">Take full control of your learning environment with comprehensive
                                    settings that adapt to your preferences. From audio feedback to visual comfort,
                                    customize every aspect of the platform to match your unique needs and working style.</p>

                                {/* Settings Benefits */}
                                <div className="feature-benefits">
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
                                            <h4>Sound Settings</h4>
                                            <p>Control all audio feedback throughout the platform. <strong>Enable or disable
                                                notification sounds</strong>, button click effects, and system alerts.
                                                Sound is <strong>enabled by default</strong> with <strong>individual volume
                                                    control</strong> for each sound type.</p>
                                        </div>
                                    </div>

                                    <div className="benefit-item">
                                        <div className="benefit-icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                                                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                                                strokeLinecap="round" strokeLinejoin="round">
                                                <circle cx="12" cy="12" r="10"></circle>
                                                <circle cx="12" cy="12" r="3"></circle>
                                            </svg>
                                        </div>
                                        <div className="benefit-content">
                                            <h4>Eye Protection Mode</h4>
                                            <p>Reduce eye strain with <strong>blue light filtering</strong> and
                                                <strong>reduced brightness</strong>. Applies a <strong>warm color
                                                    temperature</strong> perfect for late-night studying. <strong>Adjustable
                                                        intensity levels</strong> balance comfort and color accuracy.</p>
                                        </div>
                                    </div>

                                    <div className="benefit-item">
                                        <div className="benefit-icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                                                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                                                strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                                            </svg>
                                        </div>
                                        <div className="benefit-content">
                                            <h4>Dark Mode</h4>
                                            <p>Switch between <strong>light and dark themes</strong> instantly. Features
                                                <strong>calibrated contrast ratios</strong> for optimal readability.
                                                <strong>Add to Quick Access</strong> for one-click switching with
                                                <strong>automatic scheduling</strong> based on time of day.</p>
                                        </div>
                                    </div>
                                </div>
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
                                    <div className="overhaul-card">
                                        <div className="overhaul-icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                                                strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="16 18 22 12 16 6"></polyline>
                                                <polyline points="8 6 2 12 8 18"></polyline>
                                            </svg>
                                        </div>
                                        <h4>Modern Tech Stack</h4>
                                        <p>Built with <strong>latest web standards</strong> including HTML5, CSS3, and ES6+
                                            JavaScript. Utilizes <strong>modern frameworks and libraries</strong> for
                                            optimal performance and maintainability.</p>
                                    </div>

                                    {/* Enhanced Security */}
                                    <div className="overhaul-card">
                                        <div className="overhaul-icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                                                strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                                            </svg>
                                        </div>
                                        <h4>Enhanced Security</h4>
                                        <p>Implements <strong>enterprise-grade security protocols</strong> with encrypted
                                            data transmission, secure authentication, and <strong>protection against common
                                                vulnerabilities</strong> (XSS, CSRF, SQL injection).</p>
                                    </div>

                                    {/* Performance Optimized */}
                                    <div className="overhaul-card">
                                        <div className="overhaul-icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                                                strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                                            </svg>
                                        </div>
                                        <h4>Performance Optimized</h4>
                                        <p><strong>Lightning-fast load times</strong> through code splitting, lazy loading,
                                            and asset optimization. <strong>60fps animations</strong> and smooth
                                            interactions across all devices.</p>
                                    </div>

                                    {/* Scalable Architecture */}
                                    <div className="overhaul-card">
                                        <div className="overhaul-icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                                                strokeLinecap="round" strokeLinejoin="round">
                                                <path
                                                    d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z">
                                                </path>
                                                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                                                <line x1="12" y1="22.08" x2="12" y2="12"></line>
                                            </svg>
                                        </div>
                                        <h4>Scalable Architecture</h4>
                                        <p><strong>Modular design</strong> allows seamless feature additions and updates.
                                            Built to handle <strong>thousands of concurrent users</strong> without
                                            performance degradation.</p>
                                    </div>

                                    {/* Clean Codebase */}
                                    <div className="overhaul-card">
                                        <div className="overhaul-icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                                                strokeLinecap="round" strokeLinejoin="round">
                                                <path
                                                    d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z">
                                                </path>
                                            </svg>
                                        </div>
                                        <h4>Clean Codebase</h4>
                                        <p>Follows <strong>industry best practices</strong> with comprehensive
                                            documentation, consistent naming conventions, and <strong>maintainable code
                                                structure</strong> for long-term sustainability.</p>
                                    </div>

                                    {/* Future-Ready */}
                                    <div className="overhaul-card">
                                        <div className="overhaul-icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                                                strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                                            </svg>
                                        </div>
                                        <h4>Future-Ready</h4>
                                        <p>Designed with <strong>extensibility in mind</strong>, ready for AI integration,
                                            advanced analytics, and emerging educational technologies. <strong>Regular
                                                updates</strong> ensure continued excellence.</p>
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
                                                    <div className="toolbelt-arrow">→</div>
                                                    <div className="toolbelt-info">
                                                        <span className="toolbelt-label">Continue Learning</span>
                                                        <span className="toolbelt-desc">Jump back to your last active course or
                                                            lesson instantly</span>
                                                    </div>
                                                </div>
                                                <div className="toolbelt-button">
                                                    <div className="toolbelt-arrow">→</div>
                                                    <div className="toolbelt-info">
                                                        <span className="toolbelt-label">Assignments</span>
                                                        <span className="toolbelt-desc">View all pending, submitted, and graded
                                                            assignments in one place</span>
                                                    </div>
                                                </div>
                                                <div className="toolbelt-button">
                                                    <div className="toolbelt-arrow">→</div>
                                                    <div className="toolbelt-info">
                                                        <span className="toolbelt-label">Classes</span>
                                                        <span className="toolbelt-desc">Access your enrolled courses, schedules,
                                                            and class materials</span>
                                                    </div>
                                                </div>
                                                <div className="toolbelt-button">
                                                    <div className="toolbelt-arrow">→</div>
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
                                                    <div className="toolbelt-arrow">→</div>
                                                    <div className="toolbelt-info">
                                                        <span className="toolbelt-label">Hidden by Default</span>
                                                        <span className="toolbelt-desc">Widgets are concealed to maintain a
                                                            clean, focused workspace</span>
                                                    </div>
                                                </div>

                                                <div className="toolbelt-button">
                                                    <div className="toolbelt-arrow">→</div>
                                                    <div className="toolbelt-info">
                                                        <span className="toolbelt-label">Hover-Activated Panel</span>
                                                        <span className="toolbelt-desc">Move your cursor to the far right edge
                                                            to reveal a subtle arrow indicator</span>
                                                    </div>
                                                </div>

                                                <div className="toolbelt-button">
                                                    <div className="toolbelt-arrow">→</div>
                                                    <div className="toolbelt-info">
                                                        <span className="toolbelt-label">Slide-Out Drawer</span>
                                                        <span className="toolbelt-desc">Click the arrow to smoothly slide open
                                                            the widget panel from the right</span>
                                                    </div>
                                                </div>

                                                <div className="toolbelt-button">
                                                    <div className="toolbelt-arrow">→</div>
                                                    <div className="toolbelt-info">
                                                        <span className="toolbelt-label">Organized Categories</span>
                                                        <span className="toolbelt-desc">Widgets are grouped logically (Calendar,
                                                            Tasks, Announcements, Progress)</span>
                                                    </div>
                                                </div>

                                                <div className="toolbelt-button">
                                                    <div className="toolbelt-arrow">→</div>
                                                    <div className="toolbelt-info">
                                                        <span className="toolbelt-label">Customizable Layout</span>
                                                        <span className="toolbelt-desc">Drag and drop to reorder widgets based
                                                            on your priorities</span>
                                                    </div>
                                                </div>

                                                <div className="toolbelt-button">
                                                    <div className="toolbelt-arrow">→</div>
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
