import React, { useEffect, useState } from 'react';

interface NavbarProps {
    onLoginClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onLoginClick }) => {
    const [isCompressed, setIsCompressed] = useState(false);
    const [isHidden, setIsHidden] = useState(false);

    useEffect(() => {

        let scrollTimeout: number;

        const handleScroll = () => {
            const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
            const scrollThreshold = 100;

            clearTimeout(scrollTimeout);

            scrollTimeout = window.setTimeout(() => {
                if (currentScroll > scrollThreshold) {
                    // Scrolling down or up past threshold -> compress
                    setIsCompressed(true);
                    setIsHidden(false);
                } else {
                    // Near top -> expand
                    setIsCompressed(false);
                    setIsHidden(false);
                }

            }, 10);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav className={`navbar ${isCompressed ? 'compressed' : ''} ${isHidden ? 'hidden' : ''}`}>
            <div className="nav-container">
                <div className="nav-logo">
                    <img src="/file.svg" alt="STI Logo" className="nav-logo-svg" />
                    STI Education Services Group
                </div>
                <div className="nav-links">
                    <a href="https://helpdesk.sti.edu/User/Login?ReturnUrl=%2f" target="_blank" rel="noreferrer" className="nav-link">Campus Helpdesk</a>
                    <a href="https://elms.sti.edu/page/show/495374" target="_blank" rel="noreferrer" className="nav-link">FAQ</a>
                    <button className="login-btn" onClick={onLoginClick}>Login</button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
