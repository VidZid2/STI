import React, { useRef } from 'react';
import { AnimatedGradientText } from '@/components/ui/animated-gradient-text';
import PixelBlast from '@/components/ui/pixel-blast';
import VariableProximity from '@/components/ui/variable-proximity';
import { UiverseButton } from '@/components/ui/uiverse-button';
import { LinkPreview } from '@/components/ui/link-preview';

interface HeroPanelProps {
  isActive: boolean;
  hasScrolled: boolean;
  onLearnMoreClick: () => void;
  onCTAClick: () => void;
}

const HeroPanel: React.FC<HeroPanelProps> = ({ isActive, hasScrolled, onLearnMoreClick, onCTAClick }) => {
  void hasScrolled;
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <section className={`hz-panel panel-hero ${isActive ? 'panel-active' : ''}`}>
      {/* Interactive PixelBlast Background (Blue & White Only) */}
      <PixelBlast
        variant="square"
        pixelSize={1}
        color="#1e40af"
        patternScale={2.75}
        patternDensity={1}
        pixelSizeJitter={0}
        enableRipples={true}
        rippleSpeed={0.4}
        rippleThickness={0.12}
        rippleIntensityScale={1.5}
        liquid={false}
        liquidStrength={0.12}
        liquidRadius={1.2}
        liquidWobbleSpeed={5}
        speed={1.4}
        edgeFade={0.23}
        transparent={true}
      />

      <div className="hz-panel-inner">
        {/* Modern SaaS Pill Announcement Badge */}
        <div onClick={onCTAClick} className="group relative mx-auto flex w-fit items-center justify-center rounded-full px-3 py-1 shadow-[inset_0_-8px_10px_#3b82f61f] transition-shadow duration-500 ease-out hover:shadow-[inset_0_-5px_10px_#3b82f63f] mb-6 cursor-pointer bg-white/5 backdrop-blur-sm border border-transparent">
          <span
            className="animate-gradient absolute inset-0 block h-full w-full rounded-[inherit] bg-gradient-to-r from-[#1e40af]/50 via-[#3b82f6]/50 to-[#1e40af]/50 bg-[length:300%_100%] p-[1px]"
            style={{
              WebkitMask:
                "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
              WebkitMaskComposite: "destination-out",
              mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
              maskComposite: "subtract",
              WebkitClipPath: "padding-box",
            }}
          />
          <span className="text-base">🚀</span> <hr className="mx-2 h-3.5 w-px shrink-0 bg-neutral-400/50" />
          <AnimatedGradientText speed={1.2} colorFrom="#1e40af" colorTo="#3b82f6" className="text-xs font-medium tracking-tight">
            STI eLMS Overhaul Update
          </AnimatedGradientText>
        </div>


        <div ref={containerRef} style={{ position: 'relative' }} className="hero-headline w-full max-w-[100vw] px-2 md:px-4 mb-6 flex flex-col md:flex-row flex-wrap justify-center items-center md:gap-x-3 gap-y-0.5 md:gap-y-0">
          <VariableProximity
            label="Where learning meets the future of"
            className="variable-proximity-demo text-[clamp(16px,5.5vw,40px)] md:text-[clamp(2.5rem,5vw,4.5rem)] font-bold text-[#1e40af] leading-tight text-center whitespace-nowrap md:whitespace-normal"
            fromFontVariationSettings="'wght' 400, 'opsz' 9"
            toFontVariationSettings="'wght' 1000, 'opsz' 40"
            containerRef={containerRef}
            radius={100}
            falloff="linear"
          />
          <VariableProximity
            label="education"
            className="variable-proximity-demo text-[clamp(24px,8vw,48px)] md:text-[clamp(2.5rem,5vw,4.5rem)] font-bold text-[#1e40af] leading-tight text-center"
            fromFontVariationSettings="'wght' 700, 'opsz' 9"
            toFontVariationSettings="'wght' 1000, 'opsz' 40"
            containerRef={containerRef}
            radius={100}
            falloff="linear"
            wordColors={{ 'education': '#eab308' }}
          />
        </div>



        {/* Premium SaaS CTA Buttons */}
        <div className="hero-ctas">
          <LinkPreview url="https://www.sti.edu/admissions_registration25.asp" className="inline-block">
            <UiverseButton 
              text="Get Started" 
              onClick={() => window.open('https://www.sti.edu/admissions_registration25.asp', '_blank')}
              style={{ pointerEvents: 'none' }}
            />
          </LinkPreview>
          <UiverseButton 
            text="Learn More" 
            className="btn-outline"
            onClick={onLearnMoreClick}
          />
        </div>
      </div>


    </section>
  );
};

export default HeroPanel;
