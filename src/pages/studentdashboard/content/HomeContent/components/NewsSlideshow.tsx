/**
 * NewsSlideshow
 * Single announcement card for HomeContent — STI UI Overhaul.
 * Extracted from HomeContent.tsx during Phase 8.8
 * Redesigned with SaaS-style UI in Phase 9
 * Simplified to single slide with image in Phase 10
 */
import React from 'react';
import { motion } from 'motion/react';

interface NewsSlideshowProps {
    onShowChangelog?: () => void;
}

const NewsSlideshow: React.FC<NewsSlideshowProps> = ({ onShowChangelog }) => {
    return (
        <motion.div
            className="news-slideshow"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.3 }}
        >
            {/* Header */}
            <div className="news-header">
                <motion.div
                    className="news-title-wrapper"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <div className="news-icon-wrap">
                        <motion.svg
                            className="news-icon"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            initial={{ rotate: -10, scale: 0.8 }}
                            animate={{ rotate: 0, scale: 1 }}
                            transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
                        >
                            <path d="M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1m2 13a2 2 0 0 1-2-2V7m2 13a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2" />
                            <line x1="9" y1="9" x2="13" y2="9" />
                            <line x1="9" y1="13" x2="13" y2="13" />
                        </motion.svg>
                    </div>
                    <div className="news-title-group">
                        <span className="news-title">What's New</span>
                    </div>
                </motion.div>
            </div>

            {/* Single Slide Content */}
            <div className="news-content">
                <motion.div
                    className="news-slide"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                    {/* Preview Image */}
                    <div className="news-image-container">
                        <motion.img
                            src="/sti-ui-overhaul-preview.png"
                            alt="STI eLMS UI Overhaul Preview"
                            className="news-image"
                            initial={{ scale: 1.05 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.6 }}
                        />
                        <div className="news-image-overlay" />
                        <motion.span
                            className="news-tag"
                            style={{ backgroundColor: '#4f46e5' }}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <span className="news-tag-icon">🚀</span>
                            Major Update
                        </motion.span>
                    </div>

                    {/* Text Content */}
                    <motion.div
                        className="news-text"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                    >
                        <div className="news-text-meta">
                            <span className="news-date">May 2026</span>
                        </div>
                        <h4 className="news-slide-title">Brand New STI eLMS UI — Complete Overhaul</h4>
                        <p className="news-slide-desc">
                            We've completely redesigned your learning experience. Enjoy smoother animations, modern layouts, dark mode, XP & leveling, and dozens of new features.
                        </p>

                        {/* Changelog Button */}
                        {onShowChangelog && (
                            <motion.button
                                className="news-read-more"
                                onClick={onShowChangelog}
                                whileHover={{ x: 4 }}
                                whileTap={{ scale: 0.97 }}
                            >
                                View Full Changelog
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </motion.button>
                        )}
                    </motion.div>
                </motion.div>
            </div>
        </motion.div>
    );
};


export { NewsSlideshow };
