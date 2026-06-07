import React, { useRef } from 'react';
import { UiverseButton } from '../../ui/uiverse-button';
import VariableProximity from '../../ui/variable-proximity';
import { LinkPreview } from '../../ui/link-preview';

interface CTAPanelProps {
    isActive: boolean;
    onLoginClick: () => void;
}

const CTAPanel: React.FC<CTAPanelProps> = ({ isActive, onLoginClick }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    return (
        <section className={`hz-panel panel-cta ${isActive ? 'panel-active' : ''}`}>

            <div className="hz-panel-inner relative z-10">

                <div ref={containerRef} style={{ position: 'relative' }} className="cta-headline w-full mb-6 flex flex-col md:flex-row flex-wrap justify-center items-center md:gap-x-4">
                    {/* Desktop Version: Variable Proximity */}
                    <div className="hidden md:flex flex-wrap justify-center items-center gap-x-4">
                        <VariableProximity
                            label="Are you ready"
                            className="variable-proximity-demo text-[clamp(2.5rem,5vw,4rem)] font-normal text-white leading-tight"
                            fromFontVariationSettings="'wght' 400, 'opsz' 9"
                            toFontVariationSettings="'wght' 1000, 'opsz' 40"
                            containerRef={containerRef}
                            radius={100}
                            falloff="linear"
                        />
                        <VariableProximity
                            label="STIers"
                            className="variable-proximity-demo text-[clamp(2.5rem,5vw,4rem)] font-bold text-white leading-tight"
                            fromFontVariationSettings="'wght' 700, 'opsz' 9"
                            toFontVariationSettings="'wght' 1000, 'opsz' 40"
                            containerRef={containerRef}
                            radius={100}
                            falloff="linear"
                            wordColors={{ 'STIers': '#eab308' }}
                        />
                        <VariableProximity
                            label="to"
                            className="variable-proximity-demo text-[clamp(2.5rem,5vw,4rem)] font-normal text-white leading-tight"
                            fromFontVariationSettings="'wght' 400, 'opsz' 9"
                            toFontVariationSettings="'wght' 1000, 'opsz' 40"
                            containerRef={containerRef}
                            radius={100}
                            falloff="linear"
                        />
                        <VariableProximity
                            label="Learn?"
                            className="variable-proximity-demo text-[clamp(2.5rem,5vw,4rem)] font-bold text-white leading-tight"
                            fromFontVariationSettings="'wght' 700, 'opsz' 9"
                            toFontVariationSettings="'wght' 1000, 'opsz' 40"
                            containerRef={containerRef}
                            radius={100}
                            falloff="linear"
                            wordColors={{ 'Learn?': '#eab308' }}
                        />
                    </div>

                    {/* Mobile Version: Static Impactful Headline */}
                    <div className="flex md:hidden flex-col items-center justify-center text-center w-full px-4 mb-2">
                        <h2 className="text-[2.6rem] font-[850] leading-[1.05] tracking-tight text-white m-0">
                            Are you ready <span className="text-[#eab308]">STIers</span> to <span className="text-[#eab308]">Learn?</span>
                        </h2>
                    </div>
                </div>

                <div className="cta-buttons w-full px-4 md:px-0 flex flex-col md:flex-row justify-center items-center gap-3 md:gap-4 mt-4 md:mt-0">
                    <UiverseButton 
                        text="Login Now" 
                        className="w-full md:w-auto"
                        onClick={onLoginClick} 
                        style={{ backgroundColor: '#ffffff', color: '#1e40af', border: '1px solid #1e40af' }}
                    />
                    <LinkPreview url="https://www.youtube.com/watch?v=jSNabAluL0o" className="w-full md:w-auto inline-block">
                        <UiverseButton 
                            text="Watch Demo" 
                            className="w-full md:w-auto"
                            style={{ backgroundColor: 'transparent', color: '#eab308', border: '1px solid #eab308', pointerEvents: 'none' }}
                        />
                    </LinkPreview>
                </div>
            </div>
        </section>
    );
};

export default CTAPanel;
