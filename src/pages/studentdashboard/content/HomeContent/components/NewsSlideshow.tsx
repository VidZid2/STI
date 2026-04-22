/**
 * NewsSlideshow
 * Rotating news/announcements slideshow for HomeContent.
 * Extracted from HomeContent.tsx during Phase 8.8
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// News Slideshow Component
const NewsSlideshow: React.FC = () => {
    const [currentSlide, setCurrentSlide] = useState(0);

    const newsItems = [
        {
            id: 1,
            title: 'New Course Available',
            description: 'Web Development Fundamentals now open for enrollment',
            image: 'https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=400&h=200&fit=crop',
            tag: 'Course',
            tagColor: '#3b82f6',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
            )
        },
        {
            id: 2,
            title: 'Midterm Schedule Released',
            description: 'Check your exam dates for the upcoming midterms',
            image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=200&fit=crop',
            tag: 'Important',
            tagColor: '#ef4444',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
            )
        },
        {
            id: 3,
            title: 'Campus Event This Friday',
            description: 'Join us for the annual tech symposium',
            image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=200&fit=crop',
            tag: 'Event',
            tagColor: '#f59e0b',
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
            )
        }
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % newsItems.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [newsItems.length]);

    const goToNext = () => setCurrentSlide((prev) => (prev + 1) % newsItems.length);
    const goToPrev = () => setCurrentSlide((prev) => (prev - 1 + newsItems.length) % newsItems.length);

    return (
        <motion.div
            className="news-slideshow"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.3 }}
        >
            <div className="news-header">
                <motion.div
                    className="news-title-wrapper"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
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
                    <span className="news-title">What's New</span>
                </motion.div>
                <div className="news-nav">
                    <motion.button
                        className="news-nav-btn"
                        onClick={goToPrev}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                    </motion.button>
                    <div className="news-dots">
                        {newsItems.map((_, index) => (
                            <motion.button
                                key={index}
                                className={`news-dot ${index === currentSlide ? 'active' : ''}`}
                                onClick={() => setCurrentSlide(index)}
                                whileHover={{ scale: 1.2 }}
                                whileTap={{ scale: 0.9 }}
                                animate={index === currentSlide ? { scale: [1, 1.1, 1] } : {}}
                                transition={{ duration: 0.3 }}
                            />
                        ))}
                    </div>
                    <motion.button
                        className="news-nav-btn"
                        onClick={goToNext}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="9 18 15 12 9 6" />
                        </svg>
                    </motion.button>
                </div>
            </div>
            <div className="news-content">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentSlide}
                        className="news-slide"
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -30 }}
                        transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
                    >
                        <div className="news-image-container">
                            <motion.img
                                src={newsItems[currentSlide].image}
                                alt={newsItems[currentSlide].title}
                                className="news-image"
                                initial={{ scale: 1.1 }}
                                animate={{ scale: 1 }}
                                transition={{ duration: 0.5 }}
                            />
                            <motion.span
                                className="news-tag"
                                style={{ backgroundColor: newsItems[currentSlide].tagColor }}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <span className="news-tag-icon">{newsItems[currentSlide].icon}</span>
                                {newsItems[currentSlide].tag}
                            </motion.span>
                        </div>
                        <motion.div
                            className="news-text"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                        >
                            <h4 className="news-slide-title">{newsItems[currentSlide].title}</h4>
                            <p className="news-slide-desc">{newsItems[currentSlide].description}</p>
                        </motion.div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </motion.div>
    );
};


export { NewsSlideshow };
