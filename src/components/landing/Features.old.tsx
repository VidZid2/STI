import React, { useEffect, useRef } from 'react';

const Features: React.FC = () => {
    const featuresRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const cards = document.querySelectorAll('.feature-card-bento');

        const handleMouseMove = (e: Event) => {
            const mouseEvent = e as MouseEvent;
            const card = e.currentTarget as HTMLElement;
            const rect = card.getBoundingClientRect();
            const x = mouseEvent.clientX - rect.left;
            const y = mouseEvent.clientY - rect.top;

            const mouseXPercent = (x / rect.width) * 100;
            const mouseYPercent = (y / rect.height) * 100;

            card.style.setProperty('--mouse-x', `${mouseXPercent}%`);
            card.style.setProperty('--mouse-y', `${mouseYPercent}%`);
        };

        cards.forEach(card => {
            card.addEventListener('mousemove', handleMouseMove);
        });

        return () => {
            cards.forEach(card => {
                card.removeEventListener('mousemove', handleMouseMove);
            });
        };
    }, []);

    useEffect(() => {
        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.15
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const target = entry.target as HTMLElement;
                    const cardIndex = target.dataset.cardIndex;
                    const delay = cardIndex ? parseInt(cardIndex) * 100 : 0;

                    setTimeout(() => {
                        target.classList.add('animate-in');
                    }, delay);

                    observer.unobserve(target);
                }
            });
        }, observerOptions);

        const cards = document.querySelectorAll('.feature-card-bento');
        cards.forEach((card, index) => {
            card.classList.add('scroll-animate');
            (card as HTMLElement).dataset.cardIndex = index.toString();
            observer.observe(card);
        });

        return () => observer.disconnect();
    }, []);

    return (
        <section className="features" ref={featuresRef}>
            <div className="container">
                <div className="section-header">
                    <h2>Designed For Students</h2>
                    <p>Empowering students with tools for success</p>
                </div>
                <div className="features-grid-bento">
                    <div className="feature-card-bento feature-large">
                        <div className="feature-content">
                            <h3>Easy access to learning modules</h3>
                            <p>Students can study ahead, review past lessons, and watch instructional videos with a click or a tap of a button on any gadget.</p>
                        </div>
                        <div className="feature-image-container feature-ui-container">
                            <div className="learning-stack-ui">
                                <div className="module-stack">
                                    <div className="stack-card card-3">
                                        <div className="card-header">
                                            <span className="card-label">Module 3</span>
                                            <div className="card-icon-small"></div>
                                        </div>
                                    </div>
                                    <div className="stack-card card-2">
                                        <div className="card-header">
                                            <span className="card-label">Module 2</span>
                                            <div className="card-icon-small active"></div>
                                        </div>
                                    </div>
                                    <div className="stack-card card-1">
                                        <div className="card-header">
                                            <span className="card-label">Module 1</span>
                                            <div className="card-dot completed"></div>
                                        </div>
                                        <div className="card-body">
                                            <div className="progress-info">
                                                <span className="progress-text">Completed</span>
                                                <span className="progress-percentage">100%</span>
                                            </div>
                                            <div className="progress-track">
                                                <div className="progress-fill"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="feature-card-bento feature-tall">
                        <div className="feature-content">
                            <h3>Interactive activities and assessments</h3>
                            <p>Students can test their knowledge and skills through interactive polls, quizzes, and debates, among others.</p>
                        </div>
                        <div className="feature-image-container feature-ui-container">
                            <div className="assessment-ui">
                                <div className="quiz-card">
                                    <div className="quiz-header">
                                        <div className="quiz-header-top">
                                            <div className="subject-badge">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#3b82f6" />
                                                    <path d="M2 17L12 22L22 17" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    <path d="M2 12L12 17L22 12" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                                Science Quiz
                                            </div>
                                            <div className="quiz-timer">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <circle cx="12" cy="12" r="10" stroke="#64748b" strokeWidth="2" />
                                                    <path d="M12 6V12L16 14" stroke="#64748b" strokeWidth="2" strokeLinecap="round" />
                                                </svg>
                                                2:45
                                            </div>
                                        </div>
                                        <div className="quiz-progress-container">
                                            <div className="quiz-progress-bar">
                                                <div className="quiz-progress-fill"></div>
                                            </div>
                                            <span className="quiz-question-number">Question 3 of 5</span>
                                        </div>
                                    </div>
                                    <div className="quiz-body">
                                        <h4 className="quiz-question">Which planet is known as the Red Planet?</h4>
                                        <div className="quiz-options">
                                            <div className="quiz-option option-a">
                                                <div className="option-letter">A</div>
                                                <span className="option-text">Venus</span>
                                                <div className="option-check"></div>
                                            </div>
                                            <div className="quiz-option option-b selected">
                                                <div className="option-letter">B</div>
                                                <span className="option-text">Mars</span>
                                                <div className="option-check checked">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M20 6L9 17L4 12" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                </div>
                                            </div>
                                            <div className="quiz-option option-c">
                                                <div className="option-letter">C</div>
                                                <span className="option-text">Jupiter</span>
                                                <div className="option-check"></div>
                                            </div>
                                            <div className="quiz-option option-d">
                                                <div className="option-letter">D</div>
                                                <span className="option-text">Saturn</span>
                                                <div className="option-check"></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="quiz-footer">
                                        <button className="quiz-btn quiz-btn-prev">Previous</button>
                                        <button className="quiz-btn quiz-btn-next">Next Question</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="feature-card-bento feature-medium">
                        <div className="feature-content">
                            <h3>Track your progress and achievements</h3>
                            <p>Monitor your learning journey with detailed statistics, earn badges, and visualize your growth across all courses.</p>
                        </div>
                        <div className="feature-image-container feature-ui-container">
                            <div className="progress-simple-ui">
                                <div className="progress-simple-card">
                                    <div className="progress-header">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M22 4L12 14.01L9 11.01" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        <span className="progress-title">Your Progress</span>
                                    </div>
                                    <div className="progress-content">
                                        <div className="progress-row">
                                            <div className="progress-stat">
                                                <span className="progress-value">12</span>
                                                <span className="progress-label">Courses</span>
                                            </div>
                                            <div className="progress-stat">
                                                <span className="progress-value">75%</span>
                                                <span className="progress-label">Complete</span>
                                            </div>
                                            <div className="progress-stat">
                                                <span className="progress-value">8</span>
                                                <span className="progress-label">Badges</span>
                                            </div>
                                        </div>
                                        <div className="progress-bar-container">
                                            <div className="progress-bar">
                                                <div className="progress-bar-fill"></div>
                                            </div>
                                            <span className="progress-bar-text">Overall Progress: 75%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="feature-card-bento feature-wide">
                        <div className="feature-content">
                            <h3>Collaborate with classmates</h3>
                            <p>The eLMS allows the students to chat with classmates, join forum discussions, write a blog, and facilitate a group work activity — all within the site.</p>
                        </div>
                        <div className="feature-image-container feature-ui-container">
                            <div className="chat-animated-ui">
                                <div className="chat-animated-box">
                                    <div className="chat-animated-header">
                                        <div className="chat-animated-title">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                            <span>Study Group Chat</span>
                                        </div>
                                        <div className="chat-online-status">
                                            <span className="online-indicator"></span>
                                            <span className="online-text">4 online</span>
                                        </div>
                                    </div>
                                    <div className="chat-animated-body">
                                        <div className="chat-messages-wrapper">
                                            <div className="chat-msg chat-msg-left msg-1">
                                                <div className="msg-avatar">JD</div>
                                                <div className="msg-bubble">Anyone here? 👀</div>
                                            </div>

                                            <div className="chat-msg chat-msg-right msg-2">
                                                <div className="msg-bubble">Yes! I'm here</div>
                                            </div>

                                            <div className="chat-typing msg-3">
                                                <div className="msg-avatar">SM</div>
                                                <div className="typing-dots">
                                                    <span></span>
                                                    <span></span>
                                                    <span></span>
                                                </div>
                                            </div>

                                            <div className="chat-msg chat-msg-left msg-4">
                                                <div className="msg-avatar">SM</div>
                                                <div className="msg-bubble">Let's review ch.5 📚</div>
                                            </div>

                                            <div className="chat-msg chat-msg-left msg-5">
                                                <div className="msg-avatar">AL</div>
                                                <div className="msg-bubble">Good idea!</div>
                                            </div>

                                            <div className="chat-msg chat-msg-right msg-6">
                                                <div className="msg-bubble">Starting now 👍</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="chat-animated-footer">
                                        <div className="chat-input-typing">
                                            <span>Type a message...</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Features;
