import React from 'react';
import { Carousel, Card } from '../../ui/primitives/apple-cards-carousel';

import { motion } from 'motion/react';
import { TextAnimate } from '../../ui/text-animate';
import { ContainerTextFlip } from '../../ui/container-text-flip';

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

/* --- Mobile Pill Card Data (HomeContent-style white pill containers with SVG icons) --- */
const mobileCards = [
  {
    icon: (
      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
    ),
    iconBg: "bg-blue-50 border-blue-100",
    hoverBorder: "hover:border-blue-300",
    titlePrefix: "Seamless",
    titleBadge: "Workflow.",
    subtitle: "WORKFLOW",
    subtitleColor: "text-blue-600/70",
    description: "Engage, Learn, Assess, and Succeed. A seamless learning journey powered by technology and data, designed to empower students and instructors alike.",
  },
  {
    icon: (
      <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
    ),
    iconBg: "bg-emerald-50 border-emerald-100",
    hoverBorder: "hover:border-emerald-300",
    titlePrefix: "Unified",
    titleBadge: "Ecosystem.",
    subtitle: "PLATFORM",
    subtitleColor: "text-emerald-600/70",
    description: "Experience real-time analytics, enterprise-grade security, and seamless integrations in one powerful platform built for modern education.",
  },
  {
    icon: (
      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
    ),
    iconBg: "bg-purple-50 border-purple-100",
    hoverBorder: "hover:border-purple-300",
    titlePrefix: "Completely",
    titleBadge: "Rebuilt.",
    subtitle: "MODERNIZED",
    subtitleColor: "text-purple-600/70",
    description: "From legacy limitations to a modern learning platform. Clean design system, mobile-first responsiveness, and automated workflows.",
  },
  {
    icon: (
      <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
    ),
    iconBg: "bg-orange-50 border-orange-100",
    hoverBorder: "hover:border-orange-300",
    titlePrefix: "Measurable",
    titleBadge: "Results.",
    subtitle: "PERFORMANCE",
    subtitleColor: "text-orange-600/70",
    description: "Built for scale, speed, and the modern student experience. 99.9% uptime, 3x faster load times, and supporting over 50,000 students.",
  },
];

const WhyPanel: React.FC<WhyPanelProps> = ({ isActive }) => {
  const cards = data.map((card, index) => (
    <Card key={card.src} card={card} index={index} />
  ));

  const renderHeader = (isMobile: boolean) => {
    if (isMobile) {
      return (
        <h3 className="text-xl sm:text-2xl font-bold text-neutral-800 font-sans tracking-tight leading-tight flex items-center flex-wrap">
          <span className="mr-1">Interactive</span>
          <span className="text-blue-600 ml-1">
            <TextAnimate animation="blurIn" as="span" by="word" once={false}>
              Experience.
            </TextAnimate>
          </span>
        </h3>
      );
    }

    return (
      <div className="hidden md:flex max-w-7xl pl-4 md:pl-8 mx-auto w-full items-center gap-3 mb-4">
        <h2 className="text-3xl md:text-5xl font-bold text-neutral-800 dark:text-neutral-200 font-sans leading-tight m-0 flex items-center h-full">
          The New eLMS
        </h2>
        <ContainerTextFlip
          words={["Experience.", "Platform.", "Workflow.", "Ecosystem."]}
          className="!bg-blue-600 !bg-none shadow-sm !pt-1 !pb-2 px-4 flex items-center justify-center"
          textClassName="!text-yellow-400 text-3xl md:text-5xl leading-none"
        />
      </div>
    );
  };

  return (
    <section
      className={`hz-panel panel-why ${isActive ? 'panel-active' : ''}`}
      style={{ background: '#ffffff' }}
    >
      <div className="hz-panel-inner flex flex-col h-full w-full justify-center py-16 md:py-20 overflow-y-auto">
        {renderHeader(false)}
        
        {/* Desktop View: Apple Cards Carousel */}
        <div className="hidden md:block w-full">
          <Carousel items={cards} isActive={isActive} />
        </div>

        {/* Mobile/Tablet View: Premium White Pill Containers */}
        <div className="md:hidden flex flex-col gap-5 px-4 mt-10 sm:mt-14 pb-16 w-full max-w-xl mx-auto">
          
          {/* Header Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5 }}
            className="bg-white border border-slate-200 shadow-sm rounded-[24px] p-5 flex flex-col gap-4 transition-all duration-300 hover:shadow-md hover:border-blue-300 w-full overflow-hidden"
          >
            {/* Top: Header with rotating text */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-[16px] bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[10px] font-bold text-blue-600/70 uppercase tracking-wider leading-none mb-1">THE NEW eLMS</span>
                {renderHeader(true)}
              </div>
            </div>

            {/* Separator */}
            <hr className="border-t border-slate-100 w-full" />

            {/* Bottom: Description */}
            <p className="text-[13px] font-medium text-slate-500 leading-relaxed">
              Discover what makes the new eLMS platform the definitive standard for modern education at STI.
            </p>
          </motion.div>

          {/* Feature Cards */}
          {mobileCards.map((card, idx) => (
            <motion.div 
              key={idx} 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className={`bg-white border border-slate-200 shadow-sm rounded-[24px] p-5 flex flex-col gap-4 transition-all duration-300 hover:shadow-md ${card.hoverBorder} w-full overflow-hidden`}
            >
              {/* Top: Icon + Title */}
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-[16px] ${card.iconBg} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                  {card.icon}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className={`text-[10px] font-bold ${card.subtitleColor} uppercase tracking-wider leading-none mb-1`}>{card.subtitle}</span>
                  <h3 className="text-xl sm:text-2xl font-bold text-neutral-800 font-sans tracking-tight leading-tight flex items-center flex-wrap">
                    <span className="mr-1">{card.titlePrefix}</span>
                    <span className="text-blue-600 ml-1">
                      <TextAnimate animation="blurIn" as="span" by="word" once={false}>
                        {card.titleBadge}
                      </TextAnimate>
                    </span>
                  </h3>
                </div>
              </div>

              {/* Separator */}
              <hr className="border-t border-slate-100 w-full" />

              {/* Bottom: Description */}
              <p className="text-[13px] font-medium text-slate-500 leading-relaxed">
                {card.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyPanel;

