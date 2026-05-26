import React from 'react';

const NeoLMS: React.FC = () => {
    return (
        <section className="neo-lms">
            <div className="container">
                <div className="neo-lms-content">
                    <div className="neo-lms-text">
                        <h2>Learn more About NEO LMS</h2>
                        <p>For more than 4 years, STI's blended learning approach using eLearning Management System (eLMS) makes education effective and accessible anytime, anywhere.</p>
                        <a href="https://www.youtube.com/watch?v=jSNabAluL0o" target="_blank" rel="noreferrer" className="btn-secondary" id="learn-more-btn">
                            <div className="shine"></div>
                            <i className="fas fa-info-circle"></i> Learn More
                        </a>
                    </div>
                    <div className="neo-lms-visual">
                        <img src="images/Image.png" alt="NEO LMS Platform Interface" className="neo-lms-image" />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default NeoLMS;
