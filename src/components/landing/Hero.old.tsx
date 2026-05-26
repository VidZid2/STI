import React, { useEffect, useState, useRef } from 'react';

const Hero: React.FC = () => {
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const slides = [
        "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1471&q=80",
        "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
        "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
        "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80"
    ];

    const descriptionRef = useRef<HTMLParagraphElement>(null);

    // Auto-rotate slides every 3 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
        }, 3000);
        return () => clearInterval(interval);
    }, [slides.length]);

    // Text animation logic
    useEffect(() => {
        if (descriptionRef.current) {
            const text = "STI eLMS is a modern electronic Learning Management System designed to facilitate seamless online education for STI College students, teachers, and administrators. Access courses, manage classes, and track progress all in one place.";
            descriptionRef.current.innerHTML = '';
            text.split('').forEach((char, index) => {
                const span = document.createElement('span');
                if (char === ' ') {
                    span.innerHTML = '&nbsp;';
                } else {
                    span.textContent = char;
                }
                span.style.animationDelay = `${1.5 + (index * 0.015)}s`;
                descriptionRef.current?.appendChild(span);
            });
        }
    }, []);

    return (
        <section className="hero">
            <div className="container">
                <div className="hero-content">
                    <h1>Welcome to STI eLMS</h1>
                    <p id="hero-description" ref={descriptionRef}>
                        STI eLMS is a modern electronic Learning Management System designed to facilitate seamless online education for STI College students, teachers, and administrators. Access courses, manage classes, and track progress all in one place.
                    </p>
                    <div className="hero-buttons" style={{ animationDelay: '4.5s' }}>
                        <div className="btn-container">
                            <div className="btn-drawer transition-top">STI eLMS</div>
                            <div className="btn-drawer transition-bottom">Seamless Learning</div>
                            <a href="https://www.sti.edu/admissions_registration25.asp" target="_blank" rel="noreferrer" className="btn">
                                <span className="btn-text"><i className="fas fa-rocket"></i>&nbsp; Get Started</span>
                            </a>
                            <svg className="btn-corner" xmlns="http://www.w3.org/2000/svg" viewBox="-1 1 32 32">
                                <path d="M32,32C14.355,32,0,17.645,0,0h.985c0,17.102,13.913,31.015,31.015,31.015v.985Z"></path>
                            </svg>
                            <svg className="btn-corner" xmlns="http://www.w3.org/2000/svg" viewBox="-1 1 32 32">
                                <path d="M32,32C14.355,32,0,17.645,0,0h.985c0,17.102,13.913,31.015,31.015,31.015v.985Z"></path>
                            </svg>
                            <svg className="btn-corner" xmlns="http://www.w3.org/2000/svg" viewBox="-1 1 32 32">
                                <path d="M32,32C14.355,32,0,17.645,0,0h.985c0,17.102,13.913,31.015,31.015,31.015v.985Z"></path>
                            </svg>
                            <svg className="btn-corner" xmlns="http://www.w3.org/2000/svg" viewBox="-1 1 32 32">
                                <path d="M32,32C14.355,32,0,17.645,0,0h.985c0,17.102,13.913,31.015,31.015,31.015v.985Z"></path>
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Slideshow on the right */}
                <div className="hero-visual">
                    <div className="slideshow-container">
                        <div className="slideshow-wrapper">
                            {slides.map((src, index) => (
                                <div
                                    key={index}
                                    className={`slide ${index === currentSlideIndex ? 'active' : ''}`}
                                    style={{
                                        position: 'absolute',
                                        width: '100%',
                                        height: '100%',
                                        opacity: index === currentSlideIndex ? 1 : 0,
                                        transition: 'opacity 1s ease-in-out'
                                    }}
                                >
                                    <img
                                        src={src}
                                        alt={`Slide ${index + 1}`}
                                        className="slide-image"
                                        loading={index === 0 ? "eager" : "lazy"}
                                    />
                                </div>
                            ))}
                            <div className="slide-indicators">
                                {slides.map((_, index) => (
                                    <span
                                        key={index}
                                        className={`indicator ${index === currentSlideIndex ? 'active' : ''}`}
                                        onClick={() => setCurrentSlideIndex(index)}
                                    ></span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
