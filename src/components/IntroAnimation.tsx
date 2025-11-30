import React, { useEffect, useState } from 'react';

const IntroAnimation: React.FC = () => {
    const [showFirstIntro, setShowFirstIntro] = useState(false);
    const [showSecondIntro, setShowSecondIntro] = useState(false);
    const [fadeOutFirst, setFadeOutFirst] = useState(false);
    const [fadeOutSecond, setFadeOutSecond] = useState(false);

    useEffect(() => {
        // Check if intro has already been shown in this session
        if (sessionStorage.getItem('introShown') === 'true') {
            return;
        }

        // Check if user has ever interacted before
        const hasInteractedBefore = localStorage.getItem('userHasInteracted') === 'true';

        if (hasInteractedBefore) {
            sessionStorage.setItem('introShown', 'true');
            return;
        }

        // Show first intro
        setShowFirstIntro(true);
    }, []);

    const handleFirstIntroClick = () => {
        // Enable audio
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContext.resume();
        localStorage.setItem('userHasInteracted', 'true');

        // Start second intro
        setShowSecondIntro(true);

        // Fade out first intro
        setTimeout(() => {
            setFadeOutFirst(true);
            setTimeout(() => {
                setShowFirstIntro(false);
            }, 500);
        }, 100);

        // Play intro sound
        const introSound = new Audio('./sounds/Intro.mp3');
        introSound.volume = 1.0;
        setTimeout(() => {
            introSound.currentTime = 0;
            introSound.play().catch(error => {
                console.log('Sound play failed:', error);
            });
        }, 100);

        // Animation sequence for second intro
        setTimeout(() => {
            setFadeOutSecond(true);
            setTimeout(() => {
                setShowSecondIntro(false);
                sessionStorage.setItem('introShown', 'true');
            }, 2500);
        }, 5000);
    };

    if (!showFirstIntro && !showSecondIntro) {
        return null;
    }

    return (
        <>
            {showFirstIntro && (
                <div
                    className={`first-intro-overlay ${fadeOutFirst ? 'fade-out' : ''}`}
                    onClick={handleFirstIntroClick}
                >
                    <div className="first-intro-content">
                        <div className="intro-icon-container">
                            {/* @ts-ignore */}
                            <lord-icon
                                src="https://cdn.lordicon.com/evxithfv.json"
                                trigger="hover"
                                colors="primary:#1e40af,secondary:#ffd700"
                                style={{ width: '250px', height: '250px' }}>
                                {/* @ts-ignore */}
                            </lord-icon>
                        </div>
                        <div className="intro-instruction-text">
                            <h2>Click anywhere to continue</h2>
                            <p>User interaction is required for the best experience</p>
                        </div>
                    </div>
                </div>
            )}

            {showSecondIntro && (
                <div className={`intro-overlay ${fadeOutSecond ? 'fade-out' : ''}`}>
                    <div className={`intro-text-container ${fadeOutSecond ? 'blur-out' : ''}`}>
                        <div className="intro-text-small">Welcome To STI very Own</div>
                        <div className="intro-text-large">Education Services Group</div>
                    </div>
                </div>
            )}
        </>
    );
};

export default IntroAnimation;
