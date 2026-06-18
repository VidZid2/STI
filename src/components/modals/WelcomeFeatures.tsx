"use client";

import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Flame, 
  Wrench, 
  LayoutTemplate, 
  Users, 
  Target, 
  BookOpen, 
  CloudUpload, 
  BotMessageSquare 
} from "lucide-react";

const featuresData = [
  {
    id: "item-1",
    icon: Flame,
    title: "Day Streak",
    content: "Stay motivated by tracking your consecutive study days. Build habits that last and keep pushing your personal records higher.",
  },
  {
    id: "item-2",
    icon: Wrench,
    title: "Student Tools",
    content: "Essential utilities and resources right at your fingertips to maximize your productivity and learning efficiency.",
  },
  {
    id: "item-3",
    icon: LayoutTemplate,
    title: "Quick View Widgets",
    content: "Your dashboard, upgraded. Access everything you need at a glance without ever having to switch tabs or pages.",
  },
  {
    id: "item-4",
    icon: Users,
    title: "Group Page",
    content: "Seamlessly collaborate with your peers, manage group assignments effortlessly, and communicate in real-time.",
  },
  {
    id: "item-5",
    icon: Target,
    title: "Revamp Goals System",
    content: "Set, track, and crush your academic goals with our entirely new goal-setting engine built for student success.",
  },
  {
    id: "item-6",
    icon: BookOpen,
    title: "Revamp Course System",
    content: "A streamlined, distraction-free view for your modules, lessons, and quizzes. Focus entirely on your learning material.",
  },
  {
    id: "item-7",
    icon: CloudUpload,
    title: "Upload & Deleting System",
    content: "Manage your files with ease using our lightning-fast, highly reliable cloud upload and deletion interface.",
  },
  {
    id: "item-8",
    icon: BotMessageSquare,
    title: "Support & Helper AI",
    content: "Stuck on a problem? Ask our built-in intelligent AI assistant for immediate, step-by-step help and guidance.",
  },
];

export function WelcomeFeatures() {
  // Split into two columns for desktop
  const col1 = featuresData.slice(0, 4);
  const col2 = featuresData.slice(4, 8);

  const AccordionList = ({ items }: { items: typeof featuresData }) => (
    <Accordion type="multiple" className="w-full space-y-2">
      {items.map((item) => (
        <AccordionItem
          key={item.id}
          value={item.id}
          className="border rounded-xl bg-slate-50/50 dark:bg-slate-800/20 px-1"
        >
          <AccordionTrigger className="py-3.5 px-4 text-[15px] sm:text-base font-semibold hover:no-underline hover:bg-slate-100/50 dark:hover:bg-slate-800/50 rounded-lg transition-colors">
            <div className="flex items-center gap-3 text-slate-800 dark:text-slate-100">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-blue-600 dark:text-blue-400">
                <item.icon className="size-4" strokeWidth={2.5} />
              </span>
              {item.title}
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-1">
            <div className="pl-11 pr-2">
              <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-[15px] leading-relaxed">
                {item.content}
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );

  return (
    <div className="w-full h-full flex flex-col pt-2 sm:pt-4">
      <div className="text-center space-y-2 mb-6 sm:mb-8 shrink-0 px-4">
        <h3 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Everything New</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base max-w-lg mx-auto">
          We've packed this update with powerful tools to transform how you study. Explore the new features below.
        </p>
      </div>

      <div className="w-full flex-1 min-h-0 relative">
        <div className="absolute inset-0 overflow-y-auto overflow-x-hidden hide-scrollbar px-1 sm:px-2 pb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
            <AccordionList items={col1} />
            <AccordionList items={col2} />
          </div>
        </div>
      </div>
    </div>
  );
}
