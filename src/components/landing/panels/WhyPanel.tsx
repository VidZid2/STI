import React from 'react';
import { Carousel, Card } from '../../ui/primitives/apple-cards-carousel';
import RotatingText from '../../ui/RotatingText';

interface WhyPanelProps {
  isActive: boolean;
}

const data = [
  {
    category: "",
    title: "The eLMS STI Workflow.",
    src: "/images/carousel-1.png",
    content: (
      <div className="bg-[#F5F5F7] dark:bg-neutral-800 p-8 md:p-14 rounded-3xl mb-4">
        <p className="text-neutral-600 dark:text-neutral-400 text-base md:text-2xl font-sans max-w-3xl mx-auto">
          <span className="font-bold text-neutral-700 dark:text-neutral-200">
            A seamless learning journey powered by technology and data.
          </span>{" "}
          Engage, Learn, Assess, and Succeed. The new workflow is designed to empower students and instructors alike.
        </p>
      </div>
    ),
  },
  {
    category: "",
    title: "Everything you need to succeed.",
    src: "/images/carousel-2.png",
    content: (
      <div className="bg-[#F5F5F7] dark:bg-neutral-800 p-8 md:p-14 rounded-3xl mb-4">
        <p className="text-neutral-600 dark:text-neutral-400 text-base md:text-2xl font-sans max-w-3xl mx-auto">
          <span className="font-bold text-neutral-700 dark:text-neutral-200">
            Unified Learning Ecosystem.
          </span>{" "}
          Experience real-time analytics, enterprise-grade security, and seamless integrations in one powerful platform.
        </p>
      </div>
    ),
  },
  {
    category: "",
    title: "Before vs After.",
    src: "/images/carousel-3.png",
    content: (
      <div className="bg-[#F5F5F7] dark:bg-neutral-800 p-8 md:p-14 rounded-3xl mb-4">
        <p className="text-neutral-600 dark:text-neutral-400 text-base md:text-2xl font-sans max-w-3xl mx-auto">
          <span className="font-bold text-neutral-700 dark:text-neutral-200">
            From legacy limitations to a modern learning platform.
          </span>{" "}
          We completely rebuilt the system with React, featuring a clean design system, mobile-first responsiveness, and automated workflows.
        </p>
      </div>
    ),
  },
  {
    category: "",
    title: "Measurable Results.",
    src: "/images/carousel-4.png",
    content: (
      <div className="bg-[#F5F5F7] dark:bg-neutral-800 p-8 md:p-14 rounded-3xl mb-4">
        <p className="text-neutral-600 dark:text-neutral-400 text-base md:text-2xl font-sans max-w-3xl mx-auto">
          <span className="font-bold text-neutral-700 dark:text-neutral-200">
            Built for scale, speed, and the modern student experience.
          </span>{" "}
          Achieving 99.9% uptime, 3x faster load times, and supporting over 50,000 students effortlessly.
        </p>
      </div>
    ),
  },
];

const WhyPanel: React.FC<WhyPanelProps> = ({ isActive }) => {
  const cards = data.map((card, index) => (
    <Card key={card.src} card={card} index={index} />
  ));

  return (
    <section
      className={`hz-panel panel-why ${isActive ? 'panel-active' : ''}`}
      style={{ background: '#ffffff' }}
    >
      <div className="hz-panel-inner flex flex-col h-full w-full justify-center py-20">
        <h2 className="max-w-7xl pl-4 md:pl-8 mx-auto text-xl md:text-5xl font-bold text-neutral-800 dark:text-neutral-200 font-sans w-full leading-tight">
          The New eLMS{" "}
          <span className="inline-flex items-center ml-1 translate-y-[2px] md:translate-y-[6px]">
            <RotatingText
              texts={['Experience.', 'Ecosystem.', 'Platform.', 'Standard.']}
              mainClassName="px-2 sm:px-2 md:px-4 bg-blue-600 text-yellow-400 overflow-hidden py-0.5 sm:py-1 md:py-2 justify-center rounded-xl inline-flex"
              staggerFrom="last"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "-120%" }}
              staggerDuration={0.025}
              splitLevelClassName="overflow-hidden pb-0.5 sm:pb-1 md:pb-1"
              transition={{ type: "spring", damping: 30, stiffness: 400 }}
              rotationInterval={3000}
              splitBy="characters"
              auto
              loop
            />
          </span>
        </h2>
        <Carousel items={cards} isActive={isActive} />
      </div>
    </section>
  );
};

export default WhyPanel;
