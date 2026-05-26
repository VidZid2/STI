import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHorizontalScroll } from '../../hooks/useHorizontalScroll';
import WhyPanel from './panels/WhyPanel';
import FeaturesPanel from './panels/FeaturesPanel';
import FAQPanel from './panels/FAQPanel';
import CTAPanel from './panels/CTAPanel';
import StaggeredMenu from '../ui/staggered-menu';
import { StickyBanner } from '../ui/sticky-banner';
import HeroPanel from './panels/HeroPanel';
import { MagneticButton } from '../ui/magnetic-button';
import '../ui/shine-button.css';

interface HorizontalHomeProps {
    onLoginClick: () => void;
}

const TOTAL_PANELS = 5;

// Which panels have dark backgrounds (for dot/navbar theming)
const DARK_PANELS = new Set([2, 3, 4]); // FeaturesPanel (index 2), FAQPanel (index 3), CTAPanel (index 4)

const PANEL_NAMES = ['Home', 'Why', 'Features', 'FAQ', 'Get Started'];

const HorizontalHome: React.FC<HorizontalHomeProps> = ({ onLoginClick }) => {
    const [showIntro, setShowIntro] = React.useState(true);
    const [isMobileDevice, setIsMobileDevice] = React.useState(false);

    React.useEffect(() => {
        const checkMobile = () => {
            setIsMobileDevice(window.innerWidth < 1024);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const {
        containerRef,
        currentPanel,
        progress,
        isMobile,
        goToPanel,
        hasScrolled,
    } = useHorizontalScroll({ totalPanels: TOTAL_PANELS });

    void progress;
    void isMobile;

    const isDarkPanel = DARK_PANELS.has(currentPanel);

    const menuItems = [
        ...PANEL_NAMES.map((name, index) => ({
            label: name,
            ariaLabel: `Go to ${name}`,
            link: '#',
            onClick: () => goToPanel(index)
        })),
        {
            label: 'Login',
            ariaLabel: 'Login to eLMS',
            link: '#',
            onClick: onLoginClick
        }
    ];

    const socialItems = [
        { 
            label: 'STI Official', 
            link: 'https://www.sti.edu',
            icon: 'https://cdn.lordicon.com/vvyxyrur.json',
            trigger: 'hover',
            state: '',
            colors: 'primary:#1e40af,secondary:#3b82f6'
        },
        { 
            label: 'Facebook', 
            link: 'https://facebook.com/stiofficial',
            icon: 'https://cdn.lordicon.com/lplofcfe.json',
            trigger: 'hover',
            state: 'hover-draw',
            colors: 'primary:#1e40af,secondary:#3b82f6'
        },
        { 
            label: 'Twitter', 
            link: 'https://twitter.com/sticollege',
            icon: 'https://cdn.lordicon.com/vnvsnvov.json',
            trigger: 'hover',
            state: 'hover-fly',
            colors: 'primary:#1e40af,secondary:#3b82f6'
        }
    ];

    return (
        <>
            <AnimatePresence>
                {showIntro && (
                    <motion.div
                        initial={{ opacity: 1 }}
                        exit={{ 
                            y: '-100%',
                            transition: { duration: 0.85, ease: [0.76, 0, 0.24, 1] } 
                        }}
                        className="fixed inset-0 bg-white z-[9999] flex flex-col items-center justify-center select-none overflow-y-auto px-4"
                    >
                        <div className="flex flex-col items-center max-w-md w-full text-center">


                            {isMobileDevice ? (
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ duration: 0.7, delay: 0.1 }}
                                    className="bg-amber-50/80 border border-amber-200 rounded-2xl p-6 mb-8 text-center shadow-sm w-full mt-4"
                                >
                                    <div className="flex items-center gap-3 mb-4 justify-start">
                                        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center shadow-inner border-[3px] border-amber-50 shrink-0">
                                            <lord-icon
                                                src="https://cdn.lordicon.com/jzwvffwx.json"
                                                trigger="in"
                                                delay="1500"
                                                state="in-warning"
                                                colors="primary:#d97706,secondary:#b45309"
                                                style={{ width: '32px', height: '32px' }}>
                                            </lord-icon>
                                        </div>
                                        <h3 className="font-bold text-amber-900 text-lg text-left">Desktop Optimization Notice</h3>
                                    </div>
                                    <p className="text-sm text-amber-800 leading-relaxed text-left">
                                        This website currently <strong className="font-bold">does not have support for Cellphone / Tablet viewport layout</strong>. We are focusing fully on completing the rich PC dashboard experiences first! Mobile-optimized views will be worked on and released once the PC layout is 100% finished.
                                    </p>
                                    <p className="text-xs text-amber-600 mt-4 leading-normal text-left">
                                        You are welcome to proceed on a wider screen.
                                    </p>
                                </motion.div>
                            ) : (
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ duration: 0.7, delay: 0.1 }}
                                    className="bg-blue-50/60 backdrop-blur-md border border-blue-200/60 rounded-2xl p-6 mb-8 shadow-[0_4px_20px_-4px_rgba(59,130,246,0.1)] w-full max-w-[360px] mx-auto mt-4"
                                >
                                    <p className="text-sm text-[#1e40af] leading-relaxed text-center font-medium">
                                        Welcome to the interactive STI eLMS simulation! Beta test lang po ito para i-showcase yung UI/UX overhaul ng original na eLMS system, so ayon lang naman.
                                    </p>
                                    <p className="text-xs text-blue-600/80 mt-4 font-semibold text-center">
                                        Best experienced on Desktop or wide monitors.
                                    </p>
                                </motion.div>
                            )}

                            {/* Continue CTA Button (PC Only) */}
                            {!isMobileDevice && (
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ duration: 0.6, delay: 0.45 }}
                                    className="flex justify-center"
                                >
                                    <MagneticButton>
                                        <button onClick={() => setShowIntro(false)} className="shine-button">
                                            Enter Overhaul Showcase
                                            <svg fill="currentColor" viewBox="0 0 24 24" className="shine-icon">
                                                <path
                                                    clipRule="evenodd"
                                                    d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm4.28 10.28a.75.75 0 000-1.06l-3-3a.75.75 0 10-1.06 1.06l1.72 1.72H8.25a.75.75 0 000 1.5h5.69l-1.72 1.72a.75.75 0 101.06 1.06l3-3z"
                                                    fillRule="evenodd"
                                                ></path>
                                            </svg>
                                        </button>
                                    </MagneticButton>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <StickyBanner id="overhaul-update-v1" className="bg-[#eab308] z-50">
                <p className="mx-0 max-w-[90%] text-[#0a0a0a] drop-shadow-sm font-medium">
                    STI eLMS Overhaul Update is officially live!{" "}
                    <a href="#" className="transition duration-200 hover:underline font-bold">
                        Read the release notes
                    </a>
                </p>
            </StickyBanner>

            <StaggeredMenu
                position="left"
                items={menuItems}
                socialItems={socialItems}
                displaySocials={true}
                displayItemNumbering={true}
                menuButtonColor={isDarkPanel ? "#ffffff" : "#1e40af"}
                openMenuButtonColor="#ffffff"
                changeMenuColorOnOpen={true}
                colors={['#1e40af', '#3b82f6', '#60a5fa']}
                logoUrl="/file.svg"
                accentColor="#3b82f6"
                isFixed={true}
            />





            {/* Main horizontal scroll container */}
            <div className="hz-viewport">
                <div className="hz-track" ref={containerRef}>
                    <HeroPanel
                        isActive={currentPanel === 0}
                        hasScrolled={hasScrolled}
                        onLearnMoreClick={() => goToPanel(1)}
                        onCTAClick={() => goToPanel(4)}
                    />
                    <WhyPanel isActive={currentPanel === 1} />
                    <FeaturesPanel isActive={currentPanel === 2} />
                    <FAQPanel isActive={currentPanel === 3} />
                    <CTAPanel
                        isActive={currentPanel === 4}
                        onLoginClick={onLoginClick}
                    />
                </div>
            </div>
        </>
    );
};

export default HorizontalHome;
