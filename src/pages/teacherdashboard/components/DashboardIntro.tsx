import React, { useState, useRef } from 'react';

interface TeacherDashboardIntroProps {
    onComplete: () => void;
}

const TeacherDashboardIntro: React.FC<TeacherDashboardIntroProps> = ({ onComplete }) => {
    const [isVisible, setIsVisible] = useState(true);
    const [isFadingOut, setIsFadingOut] = useState(false);
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioEnabledRef = useRef(false);

    const enableAudio = () => {
        if (!audioEnabledRef.current) {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContextClass) {
                audioContextRef.current = new AudioContextClass();
                audioContextRef.current.resume();
                audioEnabledRef.current = true;
            }
        }
    };

    const handleClick = () => {
        enableAudio();

        // Play party sound
        const partySound = new Audio('/sounds/Party.mp3');
        partySound.volume = 0.7;
        partySound.play().catch(error => {
            console.log('Party sound play failed:', error);
        });

        // Trigger confetti through callback
        if ((window as any).triggerConfettiFromIntro) {
            (window as any).triggerConfettiFromIntro();
        }

        // Mark intro as shown for this session
        sessionStorage.setItem('teacherDashboardIntroShown', 'true');

        // Start fade out
        setIsFadingOut(true);

        // Remove after fade out animation
        setTimeout(() => {
            setIsVisible(false);
            onComplete();
        }, 500);
    };

    if (!isVisible) {
        return null;
    }

    return (
        <div
            className={`first-intro-overlay ${isFadingOut ? 'fade-out' : ''}`}
            onClick={handleClick}
        >
            <div className="first-intro-content">
                <div
                    className="intro-icon-container"
                    dangerouslySetInnerHTML={{
                        __html: `
                            <lord-icon
                                src="https://cdn.lordicon.com/wxnxiano.json"
                                trigger="hover"
                                colors="primary:#3b82f6,secondary:#8b5cf6"
                                style="width:250px;height:250px">
                            </lord-icon>
                        `
                    }}
                />
                <div className="intro-instruction-text">
                    <h2>Welcome to Teacher Portal</h2>
                    <p>Click anywhere to begin your dashboard tour</p>
                </div>
            </div>
        </div>
    );
};

export default TeacherDashboardIntro;
