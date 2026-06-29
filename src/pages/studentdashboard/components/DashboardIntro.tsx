import React from 'react';
import ArcRevealHero from '../../../components/ui/arc-preloader-hero';

interface DashboardIntroProps {
    onComplete: () => void;
    isLoading?: boolean;
}

const DashboardIntro: React.FC<DashboardIntroProps> = ({ onComplete, isLoading }) => {
    const handleComplete = () => {
        // Trigger confetti when the intro completes and curtain rises
        if ((window as any).triggerConfettiFromIntro) {
            (window as any).triggerConfettiFromIntro();
        }
        onComplete();
    };

    return (
        <div className="fixed inset-0 z-[9999] pointer-events-none">
            <ArcRevealHero
                storageKey="dashboardIntroShown"
                isLoading={isLoading}
                greetings={[
                    { text: "Welcome." },
                    { text: "Just a moment..." },
                    { text: "Setting up your workspace..." },
                    { text: "Organizing your courses..." },
                    { text: "Gathering your modules..." },
                    { text: "Connecting to eLMS..." },
                    { text: "Loading your dashboard..." },
                    { text: "Preparing notifications..." },
                    { text: "Fetching daily quotes..." },
                    { text: "Syncing your progress..." },
                    { text: "Optimizing layout..." },
                    { text: "Warming up widgets..." },
                    { text: "Tidying up the sidebar..." },
                    { text: "Checking connections..." },
                    { text: "Almost there..." },
                    { text: "Polishing the UI..." },
                    { text: "Loading final assets..." },
                    { text: "Wrapping things up..." },
                    { text: "Just a few more seconds..." },
                    { text: "Getting ready..." }
                ]}
                greetingHold={1200}
                revealDuration={2000}
                onComplete={handleComplete}
                className="!bg-transparent pointer-events-none"
                introClassName="pointer-events-auto"
                revealClassName="hidden"
            />
        </div>
    );
};

export default DashboardIntro;
