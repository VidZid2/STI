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
import ArcRevealHero from '../ui/arc-preloader-hero';
import '../ui/shine-button.css';

interface HorizontalHomeProps {
    onLoginClick: () => void;
}

const TOTAL_PANELS = 5;

// Which panels have dark backgrounds (for dot/navbar theming)
const DARK_PANELS = new Set([2, 4]); // FeaturesPanel (index 2), CTAPanel (index 4)

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

    // Accurate scroll-based detection for the fixed menu button on mobile.
    // On desktop the panel-based detection is fine since panels occupy the full viewport.
    // On mobile, panels stack vertically and the IntersectionObserver fires too early
    // (when 30% of a panel is visible), causing the menu to change theme before the
    // dark panel actually covers the button's position at the top of the screen.
    const [menuOnDarkBg, setMenuOnDarkBg] = React.useState(false);

    React.useEffect(() => {
        if (!isMobileDevice) {
            setMenuOnDarkBg(isDarkPanel);
            return;
        }

        const checkMenuBg = () => {
            const panels = containerRef.current?.querySelectorAll('.hz-panel');
            if (!panels) return;

            // The menu button sits roughly 40px from the top of the viewport
            const buttonY = 40;
            let onDark = false;

            panels.forEach((panel, index) => {
                const rect = panel.getBoundingClientRect();
                if (rect.top <= buttonY && rect.bottom > buttonY) {
                    onDark = DARK_PANELS.has(index);
                }
            });

            setMenuOnDarkBg(onDark);
        };

        window.addEventListener('scroll', checkMenuBg, { passive: true });
        checkMenuBg();

        return () => window.removeEventListener('scroll', checkMenuBg);
    }, [isMobileDevice, isDarkPanel]);

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

    const pageContent = (
        <>
            <StickyBanner id="overhaul-update-v1" className="bg-[#eab308] z-50" position="bottom">
                <p className="mx-0 max-w-[90%] text-[#0a0a0a] drop-shadow-sm font-medium">
                    STI eLMS Overhaul Update is officially live!{" "}
                    <a href="#" className="transition duration-200 hover:underline font-bold">
                        Read the release notes
                    </a>
                </p>
            </StickyBanner>

            <StaggeredMenu
                className={menuOnDarkBg ? "theme-dark" : "theme-light"}
                position="left"
                items={menuItems}
                socialItems={socialItems}
                displaySocials={true}
                displayItemNumbering={true}
                menuButtonColor="#1e40af"
                openMenuButtonColor="#1e40af"
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

    return (
        <>
            <AnimatePresence>
                {showIntro && isMobileDevice && (
                    <motion.div
                        initial={{ opacity: 1 }}
                        exit={{ 
                            y: '-100%',
                            transition: { duration: 0.85, ease: [0.76, 0, 0.24, 1] } 
                        }}
                        className="fixed inset-0 bg-white z-[9999] flex flex-col items-center justify-center select-none overflow-y-auto px-4"
                    >
                        <div className="flex flex-col items-center max-w-md w-full text-center">


                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ duration: 0.7, delay: 0.1 }}
                                className="bg-blue-50/80 border border-blue-200 rounded-2xl p-6 mb-8 text-center shadow-sm w-full mt-4"
                            >
                                <div className="flex items-center gap-3 mb-4 justify-start">
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center shadow-inner border-[3px] border-blue-50 shrink-0">
                                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                                        </svg>
                                    </div>
                                    <h3 className="font-bold text-blue-900 text-lg text-left">Hello there!</h3>
                                </div>
                                <p className="text-sm text-blue-800 leading-relaxed text-left">
                                    Welcome to the new eLMS! Please note that the <strong className="font-bold text-blue-900">mobile and tablet experiences are still in active development</strong>. We're prioritizing the PC layout first, but feel free to explore what we have so far and enjoy the sneak peek!
                                </p>
                                <p className="text-xs text-blue-600 mt-4 leading-normal text-left font-medium">
                                    For the full immersive experience, try visiting on a wider screen.
                                </p>
                            </motion.div>

                            {/* Continue CTA Button (Mobile Device) */}
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
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {!isMobileDevice ? (
                <ArcRevealHero
                    greetings={[
                        { text: "Welcome." },
                        { text: "To the new eLMS." },
                        { text: "Redesigned." },
                        { text: "Refined." },
                        { text: "Ready." },
                    ]}
                    greetingHold={1200}
                    revealDuration={2000}
                >
                    {pageContent}
                </ArcRevealHero>
            ) : (
                pageContent
            )}
        </>
    );
};

export default HorizontalHome;
