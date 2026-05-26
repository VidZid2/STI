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
                <div ref={containerRef} style={{ position: 'relative' }} className="cta-headline w-full mb-6 flex flex-wrap justify-center gap-x-3 md:gap-x-4">
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

                <div className="cta-buttons">
                    <UiverseButton 
                        text="Login Now" 
                        onClick={onLoginClick} 
                        style={{ backgroundColor: '#ffffff', color: '#1e40af', border: '1px solid #1e40af' }}
                    />
                    <LinkPreview url="https://www.youtube.com/watch?v=jSNabAluL0o" className="inline-block">
                        <UiverseButton 
                            text="Watch Demo" 
                            style={{ backgroundColor: 'transparent', color: '#eab308', border: '1px solid #eab308', pointerEvents: 'none' }}
                        />
                    </LinkPreview>
                </div>
            </div>
        </section>
    );
};

export default CTAPanel;
