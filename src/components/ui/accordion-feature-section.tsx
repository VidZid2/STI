"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { Plus } from "lucide-react";
import { useDevicePerformance } from "../../hooks/use-device-performance";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
} from "@/components/ui/accordion";

export interface FeatureItem {
  id: number;
  icon?: React.ElementType;
  sub?: string;
  title: string;
  image: string;
  description: string;
}

interface Feature197Props {
  features: FeatureItem[];
}

const defaultFeatures: FeatureItem[] = [
  {
    id: 1,
    title: "Ready-to-Use UI Blocks",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80",
    description:
      "Browse through our extensive collection of pre-built UI blocks designed with shadcn/ui. Each block is carefully crafted to be responsive, accessible, and easily customizable. Simply copy and paste the code into your project.",
  },
  {
    id: 2,
    title: "Tailwind CSS & TypeScript",
    image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80",
    description:
      "Built with Tailwind CSS for rapid styling and TypeScript for type safety. Our blocks leverage the full power of Tailwind's utility classes while maintaining clean, type-safe code that integrates seamlessly with your Next.js projects.",
  },
];

const Feature197 = ({ features = defaultFeatures }: Feature197Props) => {
  const { isLowEnd } = useDevicePerformance();
  const [activeTabId, setActiveTabId] = useState<number | null>(features[0]?.id || 1);
  const [activeImage, setActiveImage] = useState(features[0]?.image || defaultFeatures[0].image);

  return (
    <div className="w-full">
      <div className="flex w-full items-start justify-between gap-6 lg:gap-12">
        <div className="w-full md:w-1/2">
          <Accordion type="single" className="w-full" defaultValue={`item-${features[0]?.id || 1}`}>
            {features.map((tab, index) => (
              <motion.div
                key={tab.id}
                initial={isLowEnd ? false : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={isLowEnd ? { duration: 0 } : { duration: 0.5, delay: index * 0.1 + 0.1, ease: [0.16, 1, 0.3, 1] }}
              >
                <AccordionItem value={`item-${tab.id}`} className="py-2">
                  <AccordionPrimitive.Header className="flex">
                    <AccordionPrimitive.Trigger
                      onClick={() => {
                        setActiveImage(tab.image);
                        setActiveTabId(tab.id);
                      }}
                      className="flex flex-1 items-center justify-between py-2 text-left text-[15px] font-semibold leading-6 outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 transition-all [&>svg>path:last-child]:origin-center [&>svg>path:last-child]:transition-all [&>svg>path:last-child]:duration-200 [&[data-state=open]>svg>path:last-child]:rotate-90 [&[data-state=open]>svg>path:last-child]:opacity-0 [&[data-state=open]>svg]:rotate-180"
                    >
                      <span className="flex items-center gap-3 sm:gap-4">
                        {tab.icon && (
                          <span
                            className="flex size-10 sm:size-12 shrink-0 items-center justify-center rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 shadow-sm transition-transform duration-300 group-hover:scale-105"
                            aria-hidden="true"
                          >
                            <tab.icon className="w-5 h-5 sm:w-6 sm:h-6 opacity-70 text-slate-700 dark:text-slate-300" strokeWidth={2} />
                          </span>
                        )}
                        <span className="flex flex-col space-y-0.5">
                          <span className={`text-lg sm:text-xl font-semibold transition-colors duration-300 ${tab.id === activeTabId ? "text-slate-900 dark:text-slate-100" : "text-slate-500 dark:text-slate-400"}`}>
                            {tab.title}
                          </span>
                          {tab.sub && <span className="text-sm font-normal text-slate-500 dark:text-slate-400">{tab.sub}</span>}
                        </span>
                      </span>
                      <Plus
                        size={20}
                        strokeWidth={2}
                        className="shrink-0 opacity-60 transition-transform duration-200 text-slate-500 dark:text-slate-400"
                        aria-hidden="true"
                      />
                    </AccordionPrimitive.Trigger>
                  </AccordionPrimitive.Header>
                  <AccordionContent className="pb-4 sm:pb-2 pl-2 sm:ps-[4.5rem] pr-2 sm:pr-4">
                      <p className="mt-2 text-slate-600 dark:text-slate-400 leading-relaxed text-sm sm:text-base">
                        {tab.description}
                      </p>
                      <div className="mt-4 md:hidden">
                        <div className="w-full aspect-video rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-sm">
                          <img
                            src={tab.image}
                            alt={tab.title}
                            loading="lazy"
                            className="w-full h-full object-contain"
                          />
                        </div>
                      </div>
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </div>
        <div className="relative m-auto hidden w-1/2 overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 md:block p-2 shadow-sm aspect-[4/3]">
          <AnimatePresence mode="wait">
            <motion.img
              key={activeImage}
              src={activeImage}
              alt="Feature preview"
              initial={{ opacity: 0, filter: "blur(10px)", scale: 0.98 }}
              animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
              exit={{ opacity: 0, filter: "blur(10px)", scale: 0.98 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="absolute inset-2 w-[calc(100%-1rem)] h-[calc(100%-1rem)] rounded-xl object-cover shadow-inner"
            />
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export { Feature197 };
