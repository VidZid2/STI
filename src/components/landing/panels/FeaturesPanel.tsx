import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BentoGrid, BentoGridItem } from '../../ui/bento-grid';
import { CardStack } from '../../ui/card-stack';
import { CollaborationBeam } from './CollaborationBeam';
import { SmartAssessmentsList } from './SmartAssessmentsList';
import { ProgressTrackingCard } from './ProgressTrackingCard';
import { cn } from "@/lib/utils";
import { TextAnimate } from "@/components/ui/text-animate";
import {
  IconClipboardCopy,
  IconFileBroken,
  IconSignature,
  IconTableColumn,
} from "@tabler/icons-react";

interface FeaturesPanelProps {
    isActive: boolean;
}

const Highlight = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <span className={cn("font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 rounded px-1.5 py-0.5 text-xs", className)}>
        {children}
    </span>
);

const LESSONS = [
    {
      id: 0,
      name: "Prof. Maria Cruz",
      designation: "Senior IT Faculty, STI College",
      content: (
        <p className="text-xs md:text-sm text-neutral-700 dark:text-neutral-200 leading-relaxed">
          Today we cover <Highlight>CSS Flexbox</Highlight>: learn to distribute space and align items dynamically inside web layouts.
        </p>
      ),
    },
    {
      id: 1,
      name: "Engr. Julian Santos",
      designation: "Database Administrator",
      content: (
        <p className="text-xs md:text-sm text-neutral-700 dark:text-neutral-200 leading-relaxed">
          Ensure integrity: normalize structures to <Highlight>Third Normal Form (3NF)</Highlight> to eliminate data redundancies.
        </p>
      ),
    },
    {
      id: 2,
      name: "Dr. Arthur Reyes",
      designation: "Computer Science Chair",
      content: (
        <p className="text-xs md:text-sm text-neutral-700 dark:text-neutral-200 leading-relaxed">
          Evaluate code performance: use <Highlight>Big O Notation</Highlight> to identify time and memory space complexities.
        </p>
      ),
    },
];



const FeaturesPanel: React.FC<FeaturesPanelProps> = ({ isActive }) => {
    const items = [
        {
          title: "Interactive Learning Modules",
          description: "Engage with dynamic, bite-sized lessons tailored to your pace and style.",
          header: (
              <CardStack 
                items={LESSONS} 
                offset={8} 
                scaleFactor={0.04} 
                isActive={isActive}
                className="h-28 w-64 md:h-32 md:w-72 mx-auto mt-2"
                cardClassName="h-28 w-64 md:h-32 md:w-72 shadow-lg p-3 md:p-4 rounded-xl border border-neutral-100 dark:border-white/[0.05] flex flex-col justify-center"
              />
          ),
          icon: <IconClipboardCopy className="h-4 w-4 text-neutral-500" />,
          className: "md:col-span-1",
        },
        {
          title: "Real-time Collaboration",
          description: "Connect seamlessly with peers and instructors via live chat and whiteboards.",
          header: <CollaborationBeam isActive={isActive} />,
          icon: <IconFileBroken className="h-4 w-4 text-neutral-500" />,
          className: "md:col-span-2",
        },
        {
          title: "Smart Assessments",
          description: "Automated grading and personalized feedback to accelerate learning.",
          header: <SmartAssessmentsList isActive={isActive} />,
          icon: <IconSignature className="h-4 w-4 text-neutral-500" />,
          className: "md:col-span-2",
        },
        {
          title: "Comprehensive Progress Tracking",
          description: "Monitor your academic journey with intuitive dashboards, analytics, and milestone tracking.",
          header: <ProgressTrackingCard isActive={isActive} />,
          icon: <IconTableColumn className="h-4 w-4 text-neutral-500" />,
          className: "md:col-span-1",
        },
    ];

    return (
        <section className={`hz-panel panel-features ${isActive ? 'panel-active' : ''}`}>
            <div className="hz-panel-inner w-full h-full flex flex-col justify-center gap-4 md:gap-6 items-center py-6 md:py-8 px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-2xl mx-auto flex-shrink-0 mt-12 md:mt-16">
                    <h2 className="text-2xl md:text-4xl font-bold text-[#eab308] mb-2 tracking-tight">
                        <TextAnimate
                            as="span"
                            animation="blurInUp"
                            by="character"
                            className="text-2xl md:text-4xl font-bold text-[#eab308] tracking-tight"
                        >
                            Powerful Features for Modern Learning
                        </TextAnimate>
                    </h2>
                    <TextAnimate
                        as="p"
                        animation="blurInUp"
                        by="word"
                        className="text-blue-200 text-sm md:text-base"
                    >
                        Everything you need to manage courses, engage students, and drive success in one unified platform.
                    </TextAnimate>
                </div>
                
                <div className="w-full max-w-6xl mx-auto h-auto md:h-[60vh] lg:h-[65vh] flex-shrink-0 pointer-events-auto">
                    <BentoGrid className="h-auto md:h-full grid-rows-none md:grid-rows-2 md:auto-rows-fr gap-4 md:gap-5">
                        {items.map((item, i) => (
                            <AnimatePresence key={i} mode="wait">
                                {isActive && (
                                    <motion.div
                                        className={`${item.className} h-auto md:h-full`}
                                        initial={{ opacity: 0, y: 40, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 40, scale: 0.95 }}
                                        transition={{
                                            type: "spring",
                                            stiffness: 260,
                                            damping: 20,
                                            mass: 0.8,
                                            delay: i * 0.08,
                                        }}
                                    >
                                        <BentoGridItem
                                            title={item.title}
                                            description={item.description}
                                            header={item.header}
                                            icon={item.icon}
                                            className="h-full"
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        ))}
                    </BentoGrid>
                </div>
                
                {/* Visual baseline offset spacer */}
                <div className="h-2 flex-shrink-0" />
            </div>
        </section>
    );
};

export default FeaturesPanel;
